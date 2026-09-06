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

type RegisterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterLogic {
	return &RegisterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RegisterLogic) Register(in *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	if len(strings.TrimSpace(in.Mobile)) == 0 || len(strings.TrimSpace(in.Password)) == 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 1. 检查手机号是否已被注册
	user, err := l.svcCtx.UserModel.FindOneByMobile(l.ctx, in.Mobile)
	if err != nil && !errors.Is(err, model.ErrNotFound) {
		l.Errorf("FindOneByMobile err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	if user != nil {
		return nil, xerr.NewErrCode(xerr.UserExisted)
	}

	// 2. 密码加盐哈希
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		l.Errorf("bcrypt password err: %v", err)
		return nil, xerr.NewErrCode(xerr.ServerCommonError)
	}

	username := in.Username
	if len(strings.TrimSpace(username)) == 0 {
		if len(in.Mobile) >= 4 {
			username = "User_" + in.Mobile[len(in.Mobile)-4:]
		} else {
			username = "User_" + in.Mobile
		}
	}

	// 3. 写入持久层
	newUser := &model.User{
		Mobile:   in.Mobile,
		Username: username,
		Password: string(hashedPassword),
		Avatar:   "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
	}
	res, err := l.svcCtx.UserModel.Insert(l.ctx, newUser)
	if err != nil {
		l.Errorf("Insert user err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, err := res.LastInsertId()
	if err != nil {
		l.Errorf("Get LastInsertId err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.RegisterResponse{
		Id: newId,
	}, nil
}

