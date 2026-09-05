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
	"golang.org/x/crypto/bcrypt"
)

type LoginLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *LoginLogic) Login(in *pb.LoginRequest) (*pb.LoginResponse, error) {
	if len(strings.TrimSpace(in.Mobile)) == 0 || len(strings.TrimSpace(in.Password)) == 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 1. 根据手机号查询用户
	user, err := l.svcCtx.UserModel.FindOneByMobile(l.ctx, in.Mobile)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, xerr.NewErrCode(xerr.UserNotFound)
		}
		l.Errorf("FindOneByMobile err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 2. 验证密码哈希
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(in.Password)); err != nil {
		return nil, xerr.NewErrCode(xerr.PasswordErr)
	}

	return &pb.LoginResponse{
		Id: user.Id,
	}, nil
}

