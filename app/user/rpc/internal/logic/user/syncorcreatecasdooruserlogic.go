package userlogic

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/svc"
	"go-zero-boilerplate/app/user/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type SyncOrCreateCasdoorUserLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewSyncOrCreateCasdoorUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SyncOrCreateCasdoorUserLogic {
	return &SyncOrCreateCasdoorUserLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *SyncOrCreateCasdoorUserLogic) SyncOrCreateCasdoorUser(in *pb.SyncCasdoorUserRequest) (*pb.SyncCasdoorUserResponse, error) {
	username := strings.TrimSpace(in.Username)
	if len(username) == 0 {
		return nil, xerr.NewErrCode(xerr.RequestParamError)
	}

	recordLog := func(status int64, msg string) {
		go func() {
			_, _ = l.svcCtx.SysLoginLogModel.Insert(context.Background(), &model.SysLoginLog{
				Username:  username,
				LoginIp:   "127.0.0.1",
				Browser:   "Casdoor SSO",
				Os:        "Desktop",
				Status:    status,
				Msg:       msg,
				LoginTime: time.Now(),
			})
		}()
	}

	// 1. 查找本地用户
	var (
		user *model.SysUser
		err  error
	)
	user, err = l.svcCtx.SysUserModel.FindOneByUsername(l.ctx, username)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			// 若 username 未命中且传了手机号，尝试通过手机号匹配
			if len(in.Mobile) > 0 {
				user, err = l.svcCtx.SysUserModel.FindOneByMobile(l.ctx, in.Mobile)
				if err != nil && !errors.Is(err, model.ErrNotFound) {
					l.Errorf("FindOneByMobile err: %v", err)
					return nil, xerr.NewErrCode(xerr.DbError)
				}
			}
		} else {
			l.Errorf("FindOneByUsername err: %v", err)
			return nil, xerr.NewErrCode(xerr.DbError)
		}
	}

	// 2. 如果本地用户不存在，执行 JIT (Just-In-Time) 首次登录自动建档
	if user == nil {
		realName := strings.TrimSpace(in.RealName)
		if len(realName) == 0 {
			realName = username
		}
		avatar := strings.TrimSpace(in.Avatar)
		if len(avatar) == 0 {
			avatar = "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
		}

		newUser := &model.SysUser{
			DeptId:       1,
			Username:     username,
			Password:     "$2a$10$Ng7owCC4Isoz4SlkX553jOuRn0dmxrNS2CIX8p/JGBwx2bCHFHHdC", // 默认随机哈希占位
			RealName:     realName,
			Mobile:       in.Mobile,
			Email:        in.Email,
			Avatar:       avatar,
			Status:       1,
			TokenVersion: 1,
		}

		res, err := l.svcCtx.SysUserModel.Insert(l.ctx, newUser)
		if err != nil {
			l.Errorf("JIT create sys_user err: %v", err)
			return nil, xerr.NewErrMsg("自动拨备系统账号失败")
		}

		newId, _ := res.LastInsertId()
		user = newUser
		user.Id = newId

		// 默认挂载操作员角色 (role_id = 2)，超管账号赋予 ROLE_ADMIN (role_id = 1)
		roleId := int64(2)
		if user.Id == 1 || strings.EqualFold(username, "admin") {
			roleId = 1
		}
		bindRoleSql := fmt.Sprintf("INSERT INTO sys_user_role (user_id, role_id) VALUES (%d, %d)", user.Id, roleId)
		_, _ = l.svcCtx.SqlConn.ExecCtx(l.ctx, bindRoleSql)
	} else {
		// 已存在用户：如果账号被停用则拦截
		if user.Status == 0 {
			recordLog(0, "SSO 登录失败：账号已被禁用")
			return nil, xerr.NewErrMsg("账号已被停用，请联系管理员")
		}

		// 增量同步最新的外部画像属性
		needUpdate := false
		if len(in.RealName) > 0 && user.RealName != in.RealName {
			user.RealName = in.RealName
			needUpdate = true
		}
		if len(in.Avatar) > 0 && user.Avatar != in.Avatar {
			user.Avatar = in.Avatar
			needUpdate = true
		}
		if len(in.Email) > 0 && user.Email != in.Email {
			user.Email = in.Email
			needUpdate = true
		}
		if needUpdate {
			_ = l.svcCtx.SysUserModel.Update(l.ctx, user)
		}
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
	if len(roles) == 0 {
		if user.Id == 1 || strings.EqualFold(user.Username, "admin") {
			roles = []string{"ROLE_ADMIN"}
		} else {
			roles = []string{"ROLE_OPERATOR"}
		}
	}

	recordLog(1, "Casdoor SSO 登录成功")

	return &pb.SyncCasdoorUserResponse{
		Id:       user.Id,
		Username: user.Username,
		RealName: user.RealName,
		Avatar:   user.Avatar,
		Roles:    roles,
	}, nil
}
