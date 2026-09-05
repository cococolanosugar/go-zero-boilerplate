package xerr

import (
	"errors"
	"fmt"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestFromError(t *testing.T) {
	tests := []struct {
		name         string
		err          error
		wantCode     uint32
		wantMsgMatch string
	}{
		{
			name:         "nil error returns OK",
			err:          nil,
			wantCode:     OK,
			wantMsgMatch: "SUCCESS",
		},
		{
			name:         "direct CodeError",
			err:          NewErrCode(RequestParamError),
			wantCode:     RequestParamError,
			wantMsgMatch: "参数错误",
		},
		{
			name:         "wrapped CodeError with fmt.Errorf",
			err:          fmt.Errorf("wrap error: %w", NewErrCode(UserNotFound)),
			wantCode:     UserNotFound,
			wantMsgMatch: "用户不存在",
		},
		{
			name:         "gRPC status error with ErrCode and ErrMsg format",
			err:          status.Error(codes.Unknown, "ErrCode:200001, ErrMsg:用户不存在"),
			wantCode:     UserNotFound,
			wantMsgMatch: "用户不存在",
		},
		{
			name:         "standard gRPC error (e.g. Unavailable)",
			err:          status.Error(codes.Unavailable, "connection refused"),
			wantCode:     ServerCommonError,
			wantMsgMatch: "connection refused",
		},
		{
			name:         "standard Go error",
			err:          errors.New("something went wrong"),
			wantCode:     ServerCommonError,
			wantMsgMatch: "something went wrong",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotCode, gotMsg := FromError(tt.err)
			if gotCode != tt.wantCode {
				t.Errorf("FromError() gotCode = %v, want %v", gotCode, tt.wantCode)
			}
			if gotMsg != tt.wantMsgMatch {
				t.Errorf("FromError() gotMsg = %v, want %v", gotMsg, tt.wantMsgMatch)
			}
		})
	}
}
