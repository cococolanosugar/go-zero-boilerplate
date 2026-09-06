package userlogic

import (
	"context"
	"errors"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserInfoLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserInfoLogic {
	return &GetUserInfoLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetUserInfoLogic) GetUserInfo(in *pb.IdRequest) (*pb.UserInfoResponse, error) {
	if in.Id <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	user, err := l.svcCtx.UserModel.FindOne(l.ctx, in.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, xerr.NewErrCode(xerr.UserNotFound)
		}
		l.Errorf("FindOne user err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.UserInfoResponse{
		Id:     user.Id,
		Name:   user.Username,
		Mobile: user.Mobile,
		Avatar: user.Avatar,
	}, nil
}

