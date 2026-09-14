package itsm

import (
	"context"
	"encoding/json"
)

func getUserIdFromCtx(ctx context.Context) int64 {
	var userId int64
	if uidVal := ctx.Value("userId"); uidVal != nil {
		if uidNum, ok := uidVal.(json.Number); ok {
			if uidInt, err := uidNum.Int64(); err == nil {
				userId = uidInt
			}
		} else if uidInt, ok := uidVal.(int64); ok {
			userId = uidInt
		}
	}
	return userId
}
