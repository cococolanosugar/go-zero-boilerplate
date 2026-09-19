package titanlogic

import (
	"context"
	"encoding/json"
	"strings"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

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

// sensitiveKeySubstrings 敏感 key 判定清单：小写化后包含任一子串即视为敏感字段
var sensitiveKeySubstrings = []string{
	"token", "key", "secret", "password", "passwd", "credential", "private",
}

// isSensitiveKey 判断配置 key 是否为敏感字段（大小写不敏感子串匹配）
func isSensitiveKey(k string) bool {
	lk := strings.ToLower(k)
	for _, sub := range sensitiveKeySubstrings {
		if strings.Contains(lk, sub) {
			return true
		}
	}
	return false
}

// maskConfig 解密并脱敏集成配置：
// - 解密失败时回退尝试按历史明文 JSON 处理（兼容加密改造前的存量数据），仍执行脱敏
// - 敏感字段按 key 子串大小写不敏感匹配脱敏
// - 两种方式均失败（非合法配置）返回错误，绝不将密文/原文原样返回
func maskConfig(cipherText string) (string, error) {
	rawCfg, decErr := cryptox.Decrypt(cipherText, "")
	if decErr != nil {
		// 历史明文数据兼容：直接按 JSON 解析并脱敏
		rawCfg = cipherText
	}
	var cfgMap map[string]interface{}
	if err := json.Unmarshal([]byte(rawCfg), &cfgMap); err != nil {
		if decErr != nil {
			return "", xerr.NewErrMsg("集成配置解密失败")
		}
		return "{}", nil
	}
	for k, v := range cfgMap {
		if val, ok := v.(string); ok && val != "" && isSensitiveKey(k) {
			cfgMap[k] = cryptox.MaskSecret(val)
		}
	}
	safeBytes, err := json.Marshal(cfgMap)
	if err != nil {
		return "{}", nil
	}
	return string(safeBytes), nil
}

func (l *ListIntegrationsLogic) ListIntegrations(in *titan.ListIntegrationsReq) (*titan.ListIntegrationsResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))
	category := strings.ToLower(strings.TrimSpace(in.Category))

	integrations, total, err := l.svcCtx.IntegrationModel.ListByPage(l.ctx, category, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询集成凭证列表失败: " + err.Error())
	}

	var list []*titan.IntegrationItem
	for _, item := range integrations {
		configStr, err := maskConfig(item.Config)
		if err != nil {
			// 解密失败：明确标记，不把密文原文当配置返回
			l.Errorf("集成 %d 配置解密失败: %v", item.Id, err)
			list = append(list, &titan.IntegrationItem{
				Id:          item.Id,
				Name:        item.Name,
				Category:    item.Category,
				AuthType:    item.AuthType,
				Config:      "{\"__decrypt_error\": true}",
				Status:      int32(item.Status),
				Description: item.Description,
				CreatedBy:   item.CreatedBy,
				CreateTime:  formatTime(item.CreateTime),
				UpdateTime:  formatTime(item.UpdateTime),
			})
			continue
		}

		list = append(list, &titan.IntegrationItem{
			Id:          item.Id,
			Name:        item.Name,
			Category:    item.Category,
			AuthType:    item.AuthType,
			Config:      configStr,
			Status:      int32(item.Status),
			Description: item.Description,
			CreatedBy:   item.CreatedBy,
			CreateTime:  formatTime(item.CreateTime),
			UpdateTime:  formatTime(item.UpdateTime),
		})
	}

	return &titan.ListIntegrationsResp{
		Total: total,
		List:  list,
	}, nil
}
