package xerr

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// CodeError 自定义业务错误类型
type CodeError struct {
	errCode uint32
	errMsg  string
}

func (e *CodeError) GetErrCode() uint32 {
	return e.errCode
}

func (e *CodeError) GetErrMsg() string {
	return e.errMsg
}

func (e *CodeError) Error() string {
	return fmt.Sprintf("ErrCode:%d, ErrMsg:%s", e.errCode, e.errMsg)
}

// GRPCStatus 实现 gRPC 状态接口，保证在 RPC 传输时保留完整的业务错误格式
func (e *CodeError) GRPCStatus() *status.Status {
	return status.New(codes.Unknown, e.Error())
}

func NewCodeError(errCode uint32, errMsg string) error {
	return &CodeError{errCode: errCode, errMsg: errMsg}
}

func NewErrCode(errCode uint32) error {
	return &CodeError{errCode: errCode, errMsg: MapErrMsg(errCode)}
}

func NewErrMsg(errMsg string) error {
	return &CodeError{errCode: ServerCommonError, errMsg: errMsg}
}

// FromError 从 error 中解析并提取业务错误码与展示文本
// 兼容本地 *CodeError、包装错误（errors.As）以及跨微服务 gRPC Status 错误
func FromError(err error) (uint32, string) {
	if err == nil {
		return OK, MapErrMsg(OK)
	}

	// 1. 优先解包原生或嵌套的 *CodeError
	var codeErr *CodeError
	if errors.As(err, &codeErr) {
		return codeErr.GetErrCode(), codeErr.GetErrMsg()
	}

	// 2. 检查是否为 gRPC 远程调用抛出的 Status 错误
	if grpcStatus, ok := status.FromError(err); ok {
		msg := grpcStatus.Message()
		// 反解微服务通过 gRPC 传递的 "ErrCode:%d, ErrMsg:%s" 结构
		if strings.HasPrefix(msg, "ErrCode:") {
			if codeStr, errMsg, found := strings.Cut(strings.TrimPrefix(msg, "ErrCode:"), ", ErrMsg:"); found {
				if c, parseErr := strconv.ParseUint(codeStr, 10, 32); parseErr == nil {
					return uint32(c), errMsg
				}
			}
		}
		// 其他标准 gRPC 错误（例如网络不可达、超时等）
		return ServerCommonError, msg
	}

	// 3. 普通 Go 错误兜底
	return ServerCommonError, err.Error()
}
