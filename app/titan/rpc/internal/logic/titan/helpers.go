package titanlogic

import (
	"database/sql"
	"errors"
	"regexp"
	"strings"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/pkg/xerr"
)

// notFoundOrError 统一区分 model.ErrNotFound 与真实数据库故障：
// 记录不存在返回业务错误码 xerr.RecordNotFound，数据库故障不伪装为"不存在"。
func notFoundOrError(err error, entity string) error {
	if errors.Is(err, model.ErrNotFound) {
		return xerr.NewErrCode(xerr.RecordNotFound)
	}
	return xerr.NewErrMsg(entity + "查询失败: " + err.Error())
}

// isMaskedValue 判断提交值是否为脱敏掩码（****开头），用于更新时跳过掩码值保留库中原值
func isMaskedValue(v string) bool {
	return strings.HasPrefix(v, "****")
}

// validateImageRef 校验容器镜像引用格式（registry/repo:tag），阻止非法字符进入集群资源渲染
func validateImageRef(ref string) error {
	if ref == "" {
		return errors.New("镜像引用为空")
	}
	if len(ref) > 512 {
		return errors.New("镜像引用过长")
	}
	var imageRefPattern = regexp.MustCompile(
		`^[a-zA-Z0-9][a-zA-Z0-9._-]*(?::[0-9]{1,5})?(/[a-zA-Z0-9._/-]+)*(?::[a-zA-Z0-9._-]+)?(@sha256:[a-f0-9]{64})?$`)
	if !imageRefPattern.MatchString(ref) {
		return errors.New("镜像引用格式非法")
	}
	return nil
}

// normalizePage 分页参数归一：默认 1/20，上限 100（RPC 层兜底，与网关契约 range=[1:100] 对齐）
func normalizePage(page, pageSize int64) (offset, limit int64) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return (page - 1) * pageSize, pageSize
}

// escapeLike 转义 LIKE 通配符，防止用户输入 %/_ 破坏匹配语义
func escapeLike(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `%`, `\%`)
	s = strings.ReplaceAll(s, `_`, `\_`)
	return s
}

// formatTime 统一时间格式化（原 15+ 处重复样板）
func formatTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

// formatNullTime 可空时间统一格式化（Null 值返回空串）
func formatNullTime(t sql.NullTime) string {
	if t.Valid {
		return formatTime(t.Time)
	}
	return ""
}
