package userlogic

import (
	"context"
	"fmt"
	"strings"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"golang.org/x/crypto/bcrypt"
)

type CreateSysUserLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateSysUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateSysUserLogic {
	return &CreateSysUserLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateSysUserLogic) CreateSysUser(in *pb.CreateSysUserRequest) (*pb.IdRequest, error) {
	username := strings.TrimSpace(in.Username)
	password := strings.TrimSpace(in.Password)
	if len(username) == 0 || len(password) == 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	// 1. 检查用户名是否存在
	exist, _ := l.svcCtx.SysUserModel.FindOneByUsername(l.ctx, username)
	if exist != nil {
		return nil, xerr.NewErrMsg("该用户名已存在")
	}

	// 2. 密码加密
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.ServerCommonError)
	}

	newUser := &model.SysUser{
		DeptId:       in.DeptId,
		Username:     username,
		Password:     string(hash),
		RealName:     in.RealName,
		Mobile:       in.Mobile,
		Email:        in.Email,
		Avatar:       "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
		Status:       1,
		TokenVersion: 1,
	}

	var newId int64
	err = l.svcCtx.SqlConn.TransactCtx(l.ctx, func(ctx context.Context, session sqlx.Session) error {
		insertUserSql := `INSERT INTO sys_user (dept_id, username, password, real_name, mobile, email, avatar, status, token_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		res, err := session.ExecCtx(ctx, insertUserSql, newUser.DeptId, newUser.Username, newUser.Password, newUser.RealName, newUser.Mobile, newUser.Email, newUser.Avatar, newUser.Status, newUser.TokenVersion)
		if err != nil {
			return err
		}
		newId, err = res.LastInsertId()
		if err != nil {
			return err
		}

		// 写入角色关联
		if len(in.RoleIds) > 0 {
			var vals []string
			var args []any
			for _, rid := range in.RoleIds {
				vals = append(vals, "(?, ?)")
				args = append(args, newId, rid)
			}
			sql := fmt.Sprintf("INSERT INTO sys_user_role (user_id, role_id) VALUES %s", strings.Join(vals, ", "))
			if _, err := session.ExecCtx(ctx, sql, args...); err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		l.Errorf("CreateSysUser err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.IdRequest{Id: newId}, nil
}