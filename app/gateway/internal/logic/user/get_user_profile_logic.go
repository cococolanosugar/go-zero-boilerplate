package user

import (
	"context"
	"encoding/json"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	userClient "go-zero-boilerplate/app/user/rpc/client/user"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserProfileLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取统一用户个人画像（双表融合聚合，支持员工与客户）
func NewGetUserProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserProfileLogic {
	return &GetUserProfileLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserProfileLogic) GetUserProfile() (resp *types.UserProfileResp, err error) {
	var userId int64
	if uidVal := l.ctx.Value("userId"); uidVal != nil {
		if uidJson, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidJson.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}
	if userId <= 0 {
		return nil, xerr.NewErrCode(xerr.TokenExpireError)
	}

	// 1. 优先尝试解析员工画像 (sys_user)
	adminResp, adminErr := l.svcCtx.UserRpc.GetAdminProfile(l.ctx, &userClient.IdRequest{
		Id: userId,
	})
	if adminErr == nil && adminResp != nil {
		roles := adminResp.Roles
		if roles == nil {
			roles = []string{}
		}
		return &types.UserProfileResp{
			UserId:   adminResp.Id,
			Username: adminResp.Username,
			RealName: adminResp.RealName,
			Avatar:   adminResp.Avatar,
			Mobile:   adminResp.Mobile,
			Email:    adminResp.Email,
			UserType: "employee",
			Roles:    roles,
			DeptName: adminResp.DeptName,
		}, nil
	}

	// 2. 若非员工或不存在，回退尝试查询外部业务客户主体 (user 表)
	custResp, custErr := l.svcCtx.UserRpc.GetUserInfo(l.ctx, &userClient.IdRequest{
		Id: userId,
	})
	if custErr == nil && custResp != nil {
		return &types.UserProfileResp{
			UserId:   custResp.Id,
			Username: custResp.Name,
			RealName: custResp.Name,
			Avatar:   custResp.Avatar,
			Mobile:   custResp.Mobile,
			Email:    "",
			UserType: "customer",
			Roles:    []string{"ROLE_USER"},
			DeptName: "业务客户",
		}, nil
	}

	// 3. 两张表均未定位到有效主体，返回记录不存在
	l.Errorf("GetUserProfile neither admin nor customer found for userId=%d: adminErr=%v, custErr=%v", userId, adminErr, custErr)
	return nil, xerr.NewErrCode(xerr.RecordNotFound)
}
