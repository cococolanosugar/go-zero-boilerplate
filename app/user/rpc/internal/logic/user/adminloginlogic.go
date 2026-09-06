package userlogic

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"golang.org/x/crypto/bcrypt"
)

type AdminLoginLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewAdminLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AdminLoginLogic {
	return &AdminLoginLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *AdminLoginLogic) AdminLogin(in *pb.AdminLoginRequest) (*pb.AdminLoginResponse, error) {
	account := strings.TrimSpace(in.Account)
	password := strings.TrimSpace(in.Password)
	if len(account) == 0 || len(password) == 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 1. 根据用户名或手机号查询后台员工
	var (
		user *model.SysUser
		err  error
	)
	user, err = l.svcCtx.SysUserModel.FindOneByUsername(l.ctx, account)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			// 尝试用手机号查询
			user, err = l.svcCtx.SysUserModel.FindOneByMobile(l.ctx, account)
			if err != nil {
				if errors.Is(err, model.ErrNotFound) {
					return nil, xerr.NewErrMsg("管理员账号或密码错误")
				}
				l.Errorf("FindOneByMobile err: %v", err)
				return nil, xerr.NewErrCode(xerr.DbError)
			}
		} else {
			l.Errorf("FindOneByUsername err: %v", err)
			return nil, xerr.NewErrCode(xerr.DbError)
		}
	}

	recordLog := func(status int64, msg string) {
		go func() {
			_, _ = l.svcCtx.SysLoginLogModel.Insert(context.Background(), &model.SysLoginLog{
				Username: account,
				LoginIp:  "127.0.0.1",
				Browser:  "Web Admin",
				Os:       "Desktop",
				Status:   status,
				Msg:      msg,
			})
		}()
	}

	if user.Status == 0 {
		recordLog(0, "管理员账号已被停用")
		return nil, xerr.NewErrMsg("管理员账号已被停用，请联系超管")
	}

	// 2. 校验密码哈希
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		recordLog(0, "密码错误")
		return nil, xerr.NewErrMsg("管理员账号或密码错误")
	}

	// 3. 查询角色标识列表
	var roles []string
	query := fmt.Sprintf("SELECT r.code FROM sys_role r INNER JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = %d AND r.status = 1", user.Id)
	var roleRows []struct {
		Code string `db:"code"`
	}
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &roleRows, query); err == nil {
		for _, r := range roleRows {
			roles = append(roles, r.Code)
		}
	}

	recordLog(1, "登录成功")

	return &pb.AdminLoginResponse{
		Id:       user.Id,
		Username: user.Username,
		RealName: user.RealName,
		Avatar:   user.Avatar,
		Roles:    roles,
	}, nil
}