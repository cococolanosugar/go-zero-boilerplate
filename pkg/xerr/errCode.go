package xerr

// 常用通用错误码
const (
	OK                  uint32 = 200
	ServerCommonError   uint32 = 100001
	RequestParamError   uint32 = 100002
	TokenExpireError    uint32 = 100003
	TokenGenerateError  uint32 = 100004
	DbError             uint32 = 100005

	// 用户模块错误码 (200000 - 299999)
	UserNotFound uint32 = 200001
	UserExisted  uint32 = 200002
	PasswordErr  uint32 = 200003
)

var message = map[uint32]string{
	OK:                 "SUCCESS",
	ServerCommonError:  "服务器开小差啦，请稍后再试",
	RequestParamError:  "参数错误",
	TokenExpireError:   "登录已失效，请重新登录",
	TokenGenerateError: "生成Token失败",
	DbError:            "数据库操作失败",

	UserNotFound: "用户不存在",
	UserExisted:  "用户已存在",
	PasswordErr:  "密码错误",
}

// MapErrMsg 根据错误码返回预设的错误描述
func MapErrMsg(errCode uint32) string {
	if msg, ok := message[errCode]; ok {
		return msg
	}
	return "未知系统错误"
}
