package perm

import (
	"context"
	"encoding/json"
	"fmt"

	userClient "go-zero-boilerplate/app/user/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

const (
	// Redis 缓存键前缀
	userPermCachePrefix = "cache:sys:user:perms:%d"
	userRoleCachePrefix = "cache:sys:user:roles:%d"
	permCacheTTL        = 300 // 缓存 5 分钟
)

type RbacService struct {
	userRpc     userClient.User
	redisClient *redis.Redis
}

func NewRbacService(userRpc userClient.User, redisClient *redis.Redis) *RbacService {
	return &RbacService{
		userRpc:     userRpc,
		redisClient: redisClient,
	}
}

// GetUserIdFromCtx 从上下文提取用户 ID
func GetUserIdFromCtx(ctx context.Context) int64 {
	var userId int64
	if uidVal := ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			userId, _ = uidJson.Int64()
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		} else if uidFloat, ok := uidVal.(float64); ok {
			userId = int64(uidFloat)
		}
	}
	return userId
}

// Check 统一权限判定门面方法
func (s *RbacService) Check(ctx context.Context, req PermissionRequired) error {
	userId := GetUserIdFromCtx(ctx)
	if userId <= 0 {
		// 未登录或无效用户，返回 403
		return xerr.NewErrCode(xerr.Forbidden)
	}

	// 1. 超级管理员拥有全量全局豁免 (ID == 1)
	if userId == 1 {
		return nil
	}

	// 2. 若未声明任何权限（单权限、All、Any 均为空）
	if req.IsEmpty() {
		return s.fallbackCheck(ctx, userId)
	}

	// 3. 查询当前用户拥有的权限与角色
	perms, isSuperAdmin, err := s.getUserPermissions(ctx, userId)
	if err != nil {
		logx.WithContext(ctx).Errorf("Get user permissions error: %v", err)
		return xerr.NewErrCode(xerr.Forbidden)
	}
	if isSuperAdmin {
		return nil
	}

	// 4. 单权限校验
	if req.Permission != "" {
		if req.Permission == PublicAuthenticated {
			return nil
		}
		if !perms[req.Permission] {
			return xerr.NewErrCode(xerr.Forbidden)
		}
	}

	// 5. 校验全部满足 (All / AND)
	for _, code := range req.All {
		if code == PublicAuthenticated {
			continue
		}
		if !perms[code] {
			return xerr.NewErrCode(xerr.Forbidden)
		}
	}

	// 6. 校验任一满足 (Any / OR)
	if len(req.Any) > 0 {
		hasAny := false
		for _, code := range req.Any {
			if code == PublicAuthenticated || perms[code] {
				hasAny = true
				break
			}
		}
		if !hasAny {
			return xerr.NewErrCode(xerr.Forbidden)
		}
	}

	return nil
}

// HasPermission 判断是否具备单权限
func (s *RbacService) HasPermission(ctx context.Context, code string) bool {
	return s.Check(ctx, PermissionRequired{Permission: code}) == nil
}

// HasAll 判断是否具备所有权限
func (s *RbacService) HasAll(ctx context.Context, codes ...string) bool {
	return s.Check(ctx, PermissionRequired{All: codes}) == nil
}

// HasAny 判断是否具备任一权限
func (s *RbacService) HasAny(ctx context.Context, codes ...string) bool {
	return s.Check(ctx, PermissionRequired{Any: codes}) == nil
}

// getUserPermissions 获取用户权限集合及超级管理员标识（优先读 Redis 缓存）
func (s *RbacService) getUserPermissions(ctx context.Context, userId int64) (map[string]bool, bool, error) {
	permKey := fmt.Sprintf(userPermCachePrefix, userId)
	roleKey := fmt.Sprintf(userRoleCachePrefix, userId)

	// 尝试从 Redis 读取
	if s.redisClient != nil {
		permList, err := s.redisClient.SmembersCtx(ctx, permKey)
		if err == nil && len(permList) > 0 {
			permMap := make(map[string]bool, len(permList))
			isSuper := false
			for _, p := range permList {
				permMap[p] = true
				if p == "*" {
					isSuper = true
				}
			}
			// 检查角色缓存
			if roles, err := s.redisClient.SmembersCtx(ctx, roleKey); err == nil {
				for _, r := range roles {
					if r == "ROLE_ADMIN" {
						isSuper = true
					}
				}
			}
			return permMap, isSuper, nil
		}
	}

	// 缓存未命中，调用 UserRpc
	if s.userRpc == nil {
		return map[string]bool{}, false, nil
	}

	profile, err := s.userRpc.GetAdminProfile(ctx, &userClient.IdRequest{Id: userId})
	if err != nil {
		return nil, false, err
	}

	permMap := make(map[string]bool, len(profile.Permissions))
	isSuper := false
	for _, r := range profile.Roles {
		if r == "ROLE_ADMIN" {
			isSuper = true
		}
	}

	var permStrings []interface{}
	for _, p := range profile.Permissions {
		permMap[p] = true
		permStrings = append(permStrings, p)
		if p == "*" {
			isSuper = true
		}
	}

	// 回写 Redis 缓存
	if s.redisClient != nil && len(permStrings) > 0 {
		_, _ = s.redisClient.SaddCtx(ctx, permKey, permStrings...)
		_ = s.redisClient.ExpireCtx(ctx, permKey, permCacheTTL)

		var roleStrings []interface{}
		for _, r := range profile.Roles {
			roleStrings = append(roleStrings, r)
		}
		if len(roleStrings) > 0 {
			_, _ = s.redisClient.SaddCtx(ctx, roleKey, roleStrings...)
			_ = s.redisClient.ExpireCtx(ctx, roleKey, permCacheTTL)
		}
	}

	return permMap, isSuper, nil
}

// fallbackCheck 未配置权限点时的兜底校验
func (s *RbacService) fallbackCheck(ctx context.Context, userId int64) error {
	// 尝试从上下文中获取当前请求的 Path 和 Method
	pathVal := ctx.Value("requestPath")
	methodVal := ctx.Value("requestMethod")
	if pathVal == nil || methodVal == nil {
		// 上下文中无路由信息，只要有效登录即放行，由外层 RbacMiddleware 兜底
		return nil
	}

	path, ok1 := pathVal.(string)
	method, ok2 := methodVal.(string)
	if !ok1 || !ok2 || path == "" {
		return nil
	}

	if s.userRpc == nil {
		return nil
	}

	resp, err := s.userRpc.CheckApiPermission(ctx, &userClient.CheckApiPermissionRequest{
		UserId: userId,
		Path:   path,
		Method: method,
	})
	if err != nil || resp == nil || !resp.Allowed {
		return xerr.NewErrCode(xerr.Forbidden)
	}

	return nil
}
