package titanlogic

import (
	"context"
	"testing"
	"time"

	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"

	"github.com/stretchr/testify/assert"
)

func TestChangeWindowRules(t *testing.T) {
	// 1. 测试非生产环境无封网限制
	ok, _ := isWithinChangeWindow("dev", time.Date(2026, 9, 18, 20, 0, 0, 0, time.Local))
	assert.True(t, ok)

	// 2. 测试周五 18:00 之后触发生产封网告警拦截
	fridayEvening := time.Date(2026, 9, 18, 19, 30, 0, 0, time.Local)
	ok, reason := isWithinChangeWindow("prod", fridayEvening)
	assert.False(t, ok)
	assert.Contains(t, reason, "周末封网保护期")

	// 3. 测试周六触发生产封网拦截
	saturday := time.Date(2026, 9, 19, 14, 0, 0, 0, time.Local)
	ok, reason = isWithinChangeWindow("prod", saturday)
	assert.False(t, ok)
	assert.Contains(t, reason, "周末封网保护期")

	// 4. 测试周四工作日白班放行生产发布
	thursdayWorkHours := time.Date(2026, 9, 17, 10, 0, 0, 0, time.Local)
	ok, _ = isWithinChangeWindow("prod", thursdayWorkHours)
	assert.True(t, ok)
}

func TestCreateReleaseOrder_Validation(t *testing.T) {
	ctx := context.Background()
	l := NewCreateReleaseOrderLogic(ctx, &svc.ServiceContext{})

	// 缺少项目 ID
	resp, err := l.CreateReleaseOrder(&titan.CreateReleaseOrderReq{
		ProjectId: 0,
	})
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "项目ID必须大于0")

	// 缺少标题
	resp, err = l.CreateReleaseOrder(&titan.CreateReleaseOrderReq{
		ProjectId: 1,
		Title:     "",
	})
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "发布单标题不能为空")
}

func TestAuditReleaseOrder_Validation(t *testing.T) {
	ctx := context.Background()
	l := NewAuditReleaseOrderLogic(ctx, &svc.ServiceContext{})

	resp, err := l.AuditReleaseOrder(&titan.AuditReleaseOrderReq{
		Id: 0,
	})
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "发布单ID必须大于0")
}

func TestExecuteReleaseOrder_Validation(t *testing.T) {
	ctx := context.Background()
	l := NewExecuteReleaseOrderLogic(ctx, &svc.ServiceContext{})

	resp, err := l.ExecuteReleaseOrder(&titan.ExecuteReleaseOrderReq{
		Id: 0,
	})
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "发布单ID必须大于0")
}
