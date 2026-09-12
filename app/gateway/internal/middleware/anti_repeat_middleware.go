package middleware

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/pkg/result"
	"go-zero-boilerplate/pkg/session"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/golang-jwt/jwt/v4"
	"github.com/zeromicro/go-zero/core/logx"
)

const (
	defaultRepeatInterval = 5 // 默认 5 秒内禁止重复提交
	minRepeatInterval     = 1
	maxRepeatInterval     = 60
	repeatSubmitPrefix    = "cache:repeat_submit:"
)

// AntiRepeatMiddleware 业务数据防重复提交与幂等控制切面中间件
type AntiRepeatMiddleware struct {
	svcCtx *svc.ServiceContext
}

func NewAntiRepeatMiddleware(svcCtx *svc.ServiceContext) *AntiRepeatMiddleware {
	return &AntiRepeatMiddleware{
		svcCtx: svcCtx,
	}
}

func (m *AntiRepeatMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		method := r.Method

		// 1. 仅对可能改变系统状态的写请求进行防重复提交校验 (POST, PUT, DELETE, PATCH)
		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			next(w, r)
			return
		}

		// 2. 白名单放行检测：文件上传流 (multipart/form-data) 与 SSE 实时事件流
		contentType := r.Header.Get("Content-Type")
		if strings.HasPrefix(contentType, "multipart/form-data") {
			next(w, r)
			return
		}
		if strings.Contains(r.Header.Get("Accept"), "text/event-stream") {
			next(w, r)
			return
		}

		// 3. 若 Redis 实例未注入或不可用，采取 Fail-Open 策略保障业务可用性
		if m.svcCtx == nil || m.svcCtx.RedisClient == nil {
			next(w, r)
			return
		}

		// 4. 安全读取 Request Body 并完好复原，供下游 Handler 与审计日志中间件正常消费
		var bodyBytes []byte
		if r.Body != nil {
			var err error
			bodyBytes, err = io.ReadAll(r.Body)
			if err != nil {
				result.HttpResult(r, w, nil, xerr.NewErrCode(xerr.RequestParamError))
				return
			}
			r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		// 5. 提取客户端身份标识（优先从 JWT Claims 提取，未登录或公网接口降级为客户端真实 IP）
		userIdentity := m.extractUserIdentity(r)

		// 6. 计算分布式锁 Key
		// 模式 A：若请求显式携带 X-Idempotency-Key 或 Repeat-Submit-Token
		// 模式 B：若未显式指定，基于「用户身份 + HTTP Method + 路径 + 请求体 MD5」构建特征哈希锁
		idempotencyKey := strings.TrimSpace(r.Header.Get("X-Idempotency-Key"))
		if idempotencyKey == "" {
			idempotencyKey = strings.TrimSpace(r.Header.Get("Repeat-Submit-Token"))
		}

		var lockKey string
		if idempotencyKey != "" {
			lockKey = fmt.Sprintf("%skey:%s:%s", repeatSubmitPrefix, userIdentity, idempotencyKey)
		} else {
			hasher := md5.New()
			hasher.Write(bodyBytes)
			bodyHash := hex.EncodeToString(hasher.Sum(nil))
			lockKey = fmt.Sprintf("%shash:%s:%s:%s:%s", repeatSubmitPrefix, userIdentity, method, r.URL.Path, bodyHash)
		}

		// 7. 解析防重间隔时间 (可由请求头 X-Repeat-Submit-Interval 动态微调，最大 60 秒，默认 5 秒)
		interval := defaultRepeatInterval
		if intervalHeader := r.Header.Get("X-Repeat-Submit-Interval"); intervalHeader != "" {
			if parsed, err := strconv.Atoi(intervalHeader); err == nil && parsed >= minRepeatInterval && parsed <= maxRepeatInterval {
				interval = parsed
			}
		}

		// 8. 原子获取分布式防重锁 (SET key 1 EX interval NX)
		acquired, err := m.svcCtx.RedisClient.SetnxExCtx(r.Context(), lockKey, "1", interval)
		if err != nil {
			logx.WithContext(r.Context()).Errorf("[AntiRepeat] Redis lock error: %v", err)
			// Redis 异常时 Fail-Open，避免阻塞正常业务
			next(w, r)
			return
		}

		if !acquired {
			// 防重复提交拦截：在防重窗口期内重复触发，直接阻断
			logx.WithContext(r.Context()).Infof("[AntiRepeat] Blocked duplicate submission: key=%s, interval=%ds", lockKey, interval)
			result.HttpResult(r, w, nil, xerr.NewErrCode(xerr.RepeatSubmitError))
			return
		}

		// 9. 成功获取锁，放行执行下游 Handler
		next(w, r)
	}
}

// extractUserIdentity 提取请求主体身份（用户ID 或 客户端真实IP）
func (m *AntiRepeatMiddleware) extractUserIdentity(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.svcCtx.Config.Auth.AccessSecret), nil
		})
		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if uidVal, exists := claims["userId"]; exists {
					return fmt.Sprintf("uid_%v", uidVal)
				}
			}
		}
	}

	// 降级为真实的客户端 IP
	clientIP := session.ExtractClientIP(r)
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}
	return fmt.Sprintf("ip_%s", clientIP)
}
