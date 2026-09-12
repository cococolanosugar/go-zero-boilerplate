package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

const (
	PrefixSession   = "sys:online:sess:"
	PrefixTokenMap  = "sys:online:token:"
	PrefixBlacklist = "sys:blacklist:"
	KeyOnlineZSet   = "sys:online:zset"
)

// OnlineSession 在线会话实体
type OnlineSession struct {
	SessionId     string `json:"sessionId"`
	TokenHash     string `json:"tokenHash"`
	UserId        int64  `json:"userId"`
	Username      string `json:"username"`
	RealName      string `json:"realName"`
	DeptName      string `json:"deptName"`
	LoginIp       string `json:"loginIp"`
	LoginLocation string `json:"loginLocation"`
	Browser       string `json:"browser"`
	Os            string `json:"os"`
	LoginTime     string `json:"loginTime"`
	ExpireTime    int64  `json:"expireTime"` // Unix 时间戳 (秒)
}

type Manager struct {
	rds *redis.Redis
}

func NewManager(rds *redis.Redis) *Manager {
	return &Manager{rds: rds}
}

// HashToken 计算 Token 的 SHA256 摘要，避免直接明文存储敏感 JWT
func HashToken(token string) string {
	clean := strings.TrimSpace(token)
	clean = strings.TrimPrefix(clean, "Bearer ")
	clean = strings.TrimSpace(clean)
	h := sha256.Sum256([]byte(clean))
	return hex.EncodeToString(h[:])
}

// GenerateSessionId 生成安全唯一的会话标识
func GenerateSessionId() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

// CreateSession 登录成功后登记在线会话
func (m *Manager) CreateSession(ctx context.Context, sess *OnlineSession, token string, ttlSeconds int64) error {
	if m.rds == nil {
		return nil
	}

	if sess.SessionId == "" {
		sess.SessionId = GenerateSessionId()
	}
	sess.TokenHash = HashToken(token)
	now := time.Now()
	if sess.LoginTime == "" {
		sess.LoginTime = now.Format("2006-01-02 15:04:05")
	}
	sess.ExpireTime = now.Unix() + ttlSeconds

	data, err := json.Marshal(sess)
	if err != nil {
		return err
	}

	sessKey := PrefixSession + sess.SessionId
	tokenKey := PrefixTokenMap + sess.TokenHash

	// 1. 保存会话详情，设置 TTL
	if err := m.rds.SetexCtx(ctx, sessKey, string(data), int(ttlSeconds)); err != nil {
		logx.WithContext(ctx).Errorf("save online session %s failed: %v", sessKey, err)
		return err
	}

	// 2. 保存 tokenHash -> sessionId 映射
	if err := m.rds.SetexCtx(ctx, tokenKey, sess.SessionId, int(ttlSeconds)); err != nil {
		logx.WithContext(ctx).Errorf("save token mapping %s failed: %v", tokenKey, err)
	}

	// 3. 记录到在线有序集合，score 为过期时间戳
	if _, err := m.rds.ZaddCtx(ctx, KeyOnlineZSet, sess.ExpireTime, sess.SessionId); err != nil {
		logx.WithContext(ctx).Errorf("add to online zset %s failed: %v", sess.SessionId, err)
	}

	return nil
}

// IsBlacklisted 检查当前 Token 是否已被强制下线列入黑名单
func (m *Manager) IsBlacklisted(ctx context.Context, token string) bool {
	if m.rds == nil || token == "" {
		return false
	}
	tokenHash := HashToken(token)
	blKey := PrefixBlacklist + tokenHash
	exists, err := m.rds.ExistsCtx(ctx, blKey)
	if err != nil {
		logx.WithContext(ctx).Errorf("check blacklist %s failed: %v", blKey, err)
		return false
	}
	return exists
}

// GetSession 获取指定在线会话
func (m *Manager) GetSession(ctx context.Context, sessionId string) (*OnlineSession, error) {
	if m.rds == nil || sessionId == "" {
		return nil, nil
	}
	sessKey := PrefixSession + sessionId
	val, err := m.rds.GetCtx(ctx, sessKey)
	if err != nil || val == "" {
		return nil, nil
	}
	var sess OnlineSession
	if err := json.Unmarshal([]byte(val), &sess); err != nil {
		return nil, err
	}
	return &sess, nil
}

// ForceLogout 管理员强制下线指定会话
func (m *Manager) ForceLogout(ctx context.Context, sessionId string) error {
	if m.rds == nil || sessionId == "" {
		return nil
	}

	sessKey := PrefixSession + sessionId
	val, err := m.rds.GetCtx(ctx, sessKey)
	if err != nil || val == "" {
		// 会话已不在或已过期，清理 zset 即可
		_, _ = m.rds.ZremCtx(ctx, KeyOnlineZSet, sessionId)
		return nil
	}

	var sess OnlineSession
	if err := json.Unmarshal([]byte(val), &sess); err == nil && sess.TokenHash != "" {
		// 计算剩余有效期并记入黑名单
		now := time.Now().Unix()
		remain := int(sess.ExpireTime - now)
		if remain <= 0 {
			remain = 60 // 最低保留 60 秒安全缓冲
		}
		blKey := PrefixBlacklist + sess.TokenHash
		if err := m.rds.SetexCtx(ctx, blKey, "1", remain); err != nil {
			logx.WithContext(ctx).Errorf("set blacklist %s failed: %v", blKey, err)
		}
		_, _ = m.rds.DelCtx(ctx, PrefixTokenMap+sess.TokenHash)
	}

	// 删除会话键与有序集合
	_, _ = m.rds.DelCtx(ctx, sessKey)
	_, _ = m.rds.ZremCtx(ctx, KeyOnlineZSet, sessionId)

	return nil
}

// ListOnlineSessions 分页与条件检索当前在线会话
func (m *Manager) ListOnlineSessions(ctx context.Context, page, pageSize int32, username, loginIp string) (int64, []*OnlineSession, error) {
	if m.rds == nil {
		return 0, []*OnlineSession{}, nil
	}

	now := time.Now().Unix()
	// 1. 毫秒级剔除已过期的过期会话 ID (score < now)
	_, _ = m.rds.ZremrangebyscoreCtx(ctx, KeyOnlineZSet, 0, now)

	// 2. 获取当前全部活跃的会话 ID 列表
	sessionIds, err := m.rds.ZrevrangeCtx(ctx, KeyOnlineZSet, 0, -1)
	if err != nil {
		logx.WithContext(ctx).Errorf("zrevrange online zset failed: %v", err)
		return 0, nil, err
	}

	if len(sessionIds) == 0 {
		return 0, []*OnlineSession{}, nil
	}

	var allSessions []*OnlineSession
	usernameFilter := strings.ToLower(strings.TrimSpace(username))
	ipFilter := strings.TrimSpace(loginIp)

	for _, sid := range sessionIds {
		sessKey := PrefixSession + sid
		val, err := m.rds.GetCtx(ctx, sessKey)
		if err != nil || val == "" {
			// 如果 key 已经不存在，清理 zset
			_, _ = m.rds.ZremCtx(ctx, KeyOnlineZSet, sid)
			continue
		}

		var sess OnlineSession
		if err := json.Unmarshal([]byte(val), &sess); err != nil {
			continue
		}

		// 条件匹配
		if usernameFilter != "" && !strings.Contains(strings.ToLower(sess.Username), usernameFilter) && !strings.Contains(strings.ToLower(sess.RealName), usernameFilter) {
			continue
		}
		if ipFilter != "" && !strings.Contains(sess.LoginIp, ipFilter) {
			continue
		}

		allSessions = append(allSessions, &sess)
	}

	total := int64(len(allSessions))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	start := int((page - 1) * pageSize)
	if start >= len(allSessions) {
		return total, []*OnlineSession{}, nil
	}
	end := start + int(pageSize)
	if end > len(allSessions) {
		end = len(allSessions)
	}

	return total, allSessions[start:end], nil
}

// ParseUserAgent 解析客户端 User-Agent 字符串
func ParseUserAgent(ua string) (browser, os string) {
	if ua == "" {
		return "未知浏览器", "未知系统"
	}

	// 操作系统识别
	switch {
	case strings.Contains(ua, "Windows"):
		os = "Windows"
	case strings.Contains(ua, "Macintosh") || strings.Contains(ua, "Mac OS"):
		os = "macOS"
	case strings.Contains(ua, "iPhone") || strings.Contains(ua, "iPad"):
		os = "iOS"
	case strings.Contains(ua, "Android"):
		os = "Android"
	case strings.Contains(ua, "Linux"):
		os = "Linux"
	default:
		os = "其他操作系统"
	}

	// 浏览器识别
	switch {
	case strings.Contains(ua, "Edg"):
		browser = "Edge"
	case strings.Contains(ua, "Chrome"):
		browser = "Chrome"
	case strings.Contains(ua, "Firefox"):
		browser = "Firefox"
	case strings.Contains(ua, "Safari"):
		browser = "Safari"
	case strings.Contains(ua, "Postman"):
		browser = "Postman"
	case strings.Contains(ua, "PowerShell"):
		browser = "PowerShell"
	default:
		browser = "其他浏览器"
	}

	return browser, os
}

// ParseLocation 粗解析 IP 所在网络区域
func ParseLocation(ip string) string {
	ip = strings.TrimSpace(ip)
	if ip == "127.0.0.1" || ip == "::1" || ip == "localhost" {
		return "本机开发环境"
	}
	if strings.HasPrefix(ip, "192.168.") || strings.HasPrefix(ip, "10.") || strings.HasPrefix(ip, "172.16.") {
		return "企业内网局域网"
	}
	if ip == "" {
		return "未知网络"
	}
	return "外网访问"
}

// ExtractClientIP 提取客户端真实 IP
func ExtractClientIP(r *http.Request) string {
	xForwardedFor := r.Header.Get("X-Forwarded-For")
	if xForwardedFor != "" {
		parts := strings.Split(xForwardedFor, ",")
		if len(parts) > 0 && strings.TrimSpace(parts[0]) != "" {
			return strings.TrimSpace(parts[0])
		}
	}
	xRealIP := r.Header.Get("X-Real-IP")
	if xRealIP != "" {
		return strings.TrimSpace(xRealIP)
	}
	remoteAddr := r.RemoteAddr
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		return remoteAddr[:idx]
	}
	return remoteAddr
}

type contextKey string

const (
	CtxClientIPKey  contextKey = "session:client_ip"
	CtxUserAgentKey contextKey = "session:user_agent"
	CtxTokenHashKey contextKey = "session:token_hash"
)

// WithRequestInfo 将客户端 IP、UA 与 TokenHash 注入请求 Context
func WithRequestInfo(ctx context.Context, r *http.Request) context.Context {
	ip := ExtractClientIP(r)
	ua := r.UserAgent()
	ctx = context.WithValue(ctx, CtxClientIPKey, ip)
	ctx = context.WithValue(ctx, CtxUserAgentKey, ua)

	authHeader := r.Header.Get("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		tokenHash := HashToken(authHeader)
		ctx = context.WithValue(ctx, CtxTokenHashKey, tokenHash)
	}

	return ctx
}

// FromContext 从 Context 中提取客户端 IP 与 UA
func FromContext(ctx context.Context) (ip string, ua string) {
	if v, ok := ctx.Value(CtxClientIPKey).(string); ok {
		ip = v
	}
	if v, ok := ctx.Value(CtxUserAgentKey).(string); ok {
		ua = v
	}
	return
}

// CurrentTokenHash 从 Context 中提取当前请求的 TokenHash
func CurrentTokenHash(ctx context.Context) string {
	if v, ok := ctx.Value(CtxTokenHashKey).(string); ok {
		return v
	}
	return ""
}


