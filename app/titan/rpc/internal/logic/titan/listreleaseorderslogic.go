package titanlogic

import (
	"context"
	"time"

	"go-zero-boilerplate/app/titan/model"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListReleaseOrdersLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListReleaseOrdersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListReleaseOrdersLogic {
	return &ListReleaseOrdersLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func formatOrderModel(o *model.TitanReleaseOrder) *titan.ReleaseOrderItem {
	item := &titan.ReleaseOrderItem{
		Id:                o.Id,
		OrderNo:           o.OrderNo,
		ProjectId:         o.ProjectId,
		Title:             o.Title,
		Description:       o.Description,
		TargetEnv:         o.TargetEnv,
		ServicesJson:      o.ServicesJson,
		Status:            o.Status,
		ItsmProcessInstId: o.ItsmProcessInstId,
		ApplicantId:       o.ApplicantId,
		ApplicantName:     o.ApplicantName,
		ApproverId:        o.ApproverId,
		ApproverName:      o.ApproverName,
		CreateTime:        o.CreateTime.Format(time.RFC3339),
		UpdateTime:        o.UpdateTime.Format(time.RFC3339),
	}
	if o.ScheduledTime.Valid {
		item.ScheduledTime = o.ScheduledTime.Time.Format(time.RFC3339)
	}
	if o.StartTime.Valid {
		item.StartTime = o.StartTime.Time.Format(time.RFC3339)
	}
	if o.EndTime.Valid {
		item.EndTime = o.EndTime.Time.Format(time.RFC3339)
	}
	return item
}

// 6. 发布单 (Release Order)
func (l *ListReleaseOrdersLogic) ListReleaseOrders(in *titan.ListReleaseOrdersReq) (*titan.ListReleaseOrdersResp, error) {
	offset, limit := normalizePage(int64(in.Page), int64(in.PageSize))
	keyword := escapeLike(in.Keyword)

	orders, total, err := l.svcCtx.ReleaseOrderModel.ListByPage(l.ctx, in.ProjectId, in.TargetEnv, in.Status, keyword, offset, limit)
	if err != nil {
		return nil, xerr.NewErrMsg("查询发布单列表失败: " + err.Error())
	}

	var list []*titan.ReleaseOrderItem
	for _, o := range orders {
		list = append(list, formatOrderModel(o))
	}

	return &titan.ListReleaseOrdersResp{
		Total: total,
		List:  list,
	}, nil
}
