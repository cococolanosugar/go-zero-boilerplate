package svc

import (
	"go-zero-boilerplate/app/user/model"
	"go-zero-boilerplate/app/user/rpc/internal/config"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config           config.Config
	SqlConn          sqlx.SqlConn
	UserModel        model.UserModel
	SysUserModel     model.SysUserModel
	SysRoleModel     model.SysRoleModel
	SysMenuModel     model.SysMenuModel
	SysApiModel      model.SysApiModel
	SysUserRoleModel model.SysUserRoleModel
	SysRoleMenuModel model.SysRoleMenuModel
	SysMenuApiModel  model.SysMenuApiModel
	SysRoleApiModel  model.SysRoleApiModel
	SysDeptModel     model.SysDeptModel
	SysDictTypeModel model.SysDictTypeModel
	SysDictDataModel model.SysDictDataModel
	SysOperLogModel  model.SysOperLogModel
	SysLoginLogModel model.SysLoginLogModel
	SysPostModel model.SysPostModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.DataSource)
	return &ServiceContext{
		Config:           c,
		SqlConn:          conn,
		UserModel:        model.NewUserModel(conn, c.Cache),
		SysUserModel:     model.NewSysUserModel(conn, c.Cache),
		SysRoleModel:     model.NewSysRoleModel(conn, c.Cache),
		SysMenuModel:     model.NewSysMenuModel(conn, c.Cache),
		SysApiModel:      model.NewSysApiModel(conn, c.Cache),
		SysUserRoleModel: model.NewSysUserRoleModel(conn, c.Cache),
		SysRoleMenuModel: model.NewSysRoleMenuModel(conn, c.Cache),
		SysMenuApiModel:  model.NewSysMenuApiModel(conn, c.Cache),
		SysRoleApiModel:  model.NewSysRoleApiModel(conn, c.Cache),
		SysDeptModel:     model.NewSysDeptModel(conn, c.Cache),
		SysDictTypeModel: model.NewSysDictTypeModel(conn, c.Cache),
		SysDictDataModel: model.NewSysDictDataModel(conn, c.Cache),
		SysOperLogModel:  model.NewSysOperLogModel(conn, c.Cache),
		SysLoginLogModel: model.NewSysLoginLogModel(conn, c.Cache),
		SysPostModel: model.NewSysPostModel(conn, c.Cache),
	}
}
