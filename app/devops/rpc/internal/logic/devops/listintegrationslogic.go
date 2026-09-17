package devopslogic

import (
	"context"
	"encoding/json"
	"fmt"

	"go-zero-boilerplate/app/devops/model"
	"go-zero-boilerplate/app/devops/rpc/devops"
	"go-zero-boilerplate/app/devops/rpc/internal/svc"
	"go-zero-boilerplate/pkg/cryptox"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListIntegrationsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListIntegrationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListIntegrationsLogic {
	return &ListIntegrationsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListIntegrationsLogic) ListIntegrations(in *devops.ListIntegrationsReq) (*devops.ListIntegrationsResp, error) {
	page := in.Page
	if page <= 0 {
		page = 1
	}
	pageSize := in.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	where := "WHERE 1=1"
	var args []interface{}
	if in.Category != "" {
		where += " AND category = ?"
		args = append(args, in.Category)
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM devops_integration %s", where)
	if err := l.svcCtx.SqlConn.QueryRowCtx(l.ctx, &total, countQuery, args...); err != nil {
		return nil, err
	}

	var integrations []*model.DevopsIntegration
	listQuery := fmt.Sprintf("SELECT id, name, category, auth_type, config, status, description, created_by, create_time, update_time FROM devops_integration %s ORDER BY id DESC LIMIT %d, %d", where, offset, pageSize)
	if err := l.svcCtx.SqlConn.QueryRowsCtx(l.ctx, &integrations, listQuery, args...); err != nil {
		return nil, err
	}

	var list []*devops.IntegrationItem
	for _, item := range integrations {
		// 解密并脱敏配置
		configStr := "{}"
		if rawCfg, err := cryptox.Decrypt(item.Config, ""); err == nil {
			var cfgMap map[string]interface{}
			if err := json.Unmarshal([]byte(rawCfg), &cfgMap); err == nil {
				// 敏感字段脱敏
				for _, secretKey := range []string{"token", "password", "private_key", "secret"} {
					if val, ok := cfgMap[secretKey].(string); ok && val != "" {
						cfgMap[secretKey] = cryptox.MaskSecret(val)
					}
				}
				if safeBytes, err := json.Marshal(cfgMap); err == nil {
					configStr = string(safeBytes)
				}
			}
		}

		list = append(list, &devops.IntegrationItem{
			Id:          item.Id,
			Name:        item.Name,
			Category:    item.Category,
			AuthType:    item.AuthType,
			Config:      configStr,
			Status:      int32(item.Status),
			Description: item.Description,
			CreatedBy:   item.CreatedBy,
			CreateTime:  item.CreateTime.Format("2006-01-02 15:04:05"),
			UpdateTime:  item.UpdateTime.Format("2006-01-02 15:04:05"),
		})
	}

	return &devops.ListIntegrationsResp{
		Total: total,
		List:  list,
	}, nil
}
