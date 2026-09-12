package userlogic

import (
	"context"
	"errors"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdatePersonalProfileLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdatePersonalProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdatePersonalProfileLogic {
	return &UpdatePersonalProfileLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *UpdatePersonalProfileLogic) UpdatePersonalProfile(in *pb.UpdatePersonalProfileRequest) (*pb.EmptyResponse, error) {
	if in.UserId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	user, err := l.svcCtx.SysUserModel.FindOne(l.ctx, in.UserId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, xerr.NewErrCode(xerr.UserNotFound)
		}
		l.Errorf("find user %d failed: %v", in.UserId, err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	if in.RealName != "" {
		user.RealName = strings.TrimSpace(in.RealName)
	}
	if in.Mobile != "" {
		user.Mobile = strings.TrimSpace(in.Mobile)
	}
	if in.Email != "" {
		user.Email = strings.TrimSpace(in.Email)
	}
	if in.Avatar != "" {
		user.Avatar = strings.TrimSpace(in.Avatar)
	}

	if err := l.svcCtx.SysUserModel.Update(l.ctx, user); err != nil {
		l.Errorf("update user %d profile failed: %v", in.UserId, err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
