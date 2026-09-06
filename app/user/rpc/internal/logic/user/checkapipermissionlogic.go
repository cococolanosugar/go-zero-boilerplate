package userlogic

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"

	"github.com/zeromicro/go-zero/core/logx"
)

type CheckApiPermissionLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCheckApiPermissionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CheckApiPermissionLogic {
	return &CheckApiPermissionLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 缓存正则替换规则，将 :id 或 :param 替换为 [^/]+
var pathParamRegex = regexp.MustCompile(`:[a-zA-Z0-9_]+`)

func (l *CheckApiPermissionLogic) CheckApiPermission(in *pb.CheckApiPermissionRequest) (*pb.CheckApiPermissionResponse, error) {
	userId := in.UserId
	if userId <= 0 {
		return &pb.CheckApiPermissionResponse{Allowed: false}, nil
	}

	// 1. 超级管理员拥有全权通行证 (ID为1 或拥有 ROLE_ADMIN 角色)
	if userId == 1 {
		return &pb.CheckApiPermissionResponse{Allowed: true}, nil
	}

	var adminCount int64
	adminCheckSql := fmt.Sprintf(`
		SELECT COUNT(*) FROM sys_user_role ur 
		JOIN sys_role r ON ur.role_id = r.id 
		WHERE ur.user_id = %d AND r.code = 'ROLE_ADMIN' AND r.status = 1
	`, userId)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &adminCount, adminCheckSql); err == nil && adminCount > 0 {
		return &pb.CheckApiPermissionResponse{Allowed: true}, nil
	}

	// 2. 查询当前用户通过角色绑定的所有可用 API (path 与 method)
	queryApisSql := fmt.Sprintf(`
		SELECT DISTINCT a.path, a.method 
		FROM sys_user_role ur
		JOIN sys_role_api ra ON ur.role_id = ra.role_id
		JOIN sys_role r ON ur.role_id = r.id
		JOIN sys_api a ON ra.api_id = a.id
		WHERE ur.user_id = %d AND r.status = 1
	`, userId)

	type apiRow struct {
		Path   string `db:"path"`
		Method string `db:"method"`
	}

	var apis []apiRow
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &apis, queryApisSql); err != nil {
		l.Errorf("Query user APIs err: %v", err)
		return &pb.CheckApiPermissionResponse{Allowed: false}, nil
	}

	reqMethod := strings.ToUpper(strings.TrimSpace(in.Method))
	reqPath := strings.TrimSpace(in.Path)

	for _, api := range apis {
		if !strings.EqualFold(api.Method, reqMethod) {
			continue
		}

		// 精确匹配
		if api.Path == reqPath {
			return &pb.CheckApiPermissionResponse{Allowed: true}, nil
		}

		// RESTful 路径参数模糊匹配 (如 /api/v1/system/users/:id 匹配 /api/v1/system/users/2)
		if strings.Contains(api.Path, ":") {
			pattern := "^" + pathParamRegex.ReplaceAllString(api.Path, `[^/]+`) + "$"
			if matched, _ := regexp.MatchString(pattern, reqPath); matched {
				return &pb.CheckApiPermissionResponse{Allowed: true}, nil
			}
		}
	}

	return &pb.CheckApiPermissionResponse{Allowed: false}, nil
}
