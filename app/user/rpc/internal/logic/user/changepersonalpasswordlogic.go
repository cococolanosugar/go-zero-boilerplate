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

type ChangePersonalPasswordLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewChangePersonalPasswordLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ChangePersonalPasswordLogic {
	return &ChangePersonalPasswordLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ChangePersonalPasswordLogic) ChangePersonalPassword(in *pb.ChangePersonalPasswordRequest) (*pb.EmptyResponse, error) {
	if in.UserId <= 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	oldPwd := strings.TrimSpace(in.OldPassword)
	newPwd := strings.TrimSpace(in.NewPassword)
	if len(oldPwd) == 0 || len(newPwd) == 0 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "原密码和新密码均不能为空")
	}

	if len(newPwd) < 6 {
		return nil, xerr.NewCodeError(xerr.RequestParamError, "新密码长度不能少于 6 位")
	}

	user, err := l.svcCtx.SysUserModel.FindOne(l.ctx, in.UserId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, xerr.NewErrCode(xerr.UserNotFound)
		}
		l.Errorf("find user %d failed: %v", in.UserId, err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	// 1. 验证原密码是否匹配
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPwd)); err != nil {
		return nil, xerr.NewErrMsg("原密码错误，请重新输入")
	}

	// 2. 加密新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPwd), bcrypt.DefaultCost)
	if err != nil {
		l.Errorf("hash new password failed: %v", err)
		return nil, xerr.NewErrCode(xerr.ServerCommonError)
	}

	user.Password = string(hashedPassword)
	if err := l.svcCtx.SysUserModel.Update(l.ctx, user); err != nil {
		l.Errorf("update user %d password failed: %v", in.UserId, err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
