package result

// Response 统一 HTTP 返回结构
type Response struct {
	Code uint32 `json:"code"`
	Msg  string `json:"msg"`
	Data any    `json:"data,omitempty"`
}

func Success(data any) *Response {
	return &Response{
		Code: 200,
		Msg:  "SUCCESS",
		Data: data,
	}
}

func Error(errCode uint32, errMsg string) *Response {
	return &Response{
		Code: errCode,
		Msg:  errMsg,
		Data: nil,
	}
}
