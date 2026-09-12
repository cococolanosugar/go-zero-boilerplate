package xerr

// 常用通用错误码
const (
	OK                  uint32 = 200
	ServerCommonError   uint32 = 100001
	RequestParamError   uint32 = 100002
	TokenExpireError    uint32 = 100003
	TokenGenerateError  uint32 = 100004
	DbError             uint32 = 100005
	RecordNotFound      uint32 = 100006
	Forbidden           uint32 = 100007

	// 用户模块错误码 (200000 - 299999)
	UserNotFound uint32 = 200001
	UserExisted  uint32 = 200002
	PasswordErr  uint32 = 200003

	// 文件存储模块错误码 (300000 - 399999)
	FileUploadError    uint32 = 300001
	FileTooLargeError  uint32 = 300002
	FileForbiddenError uint32 = 300003
)

var message = map[uint32]string{
	OK:                 "SUCCESS",
	ServerCommonError:  "服务器开小差啦，请稍后再试",
	RequestParamError:  "参数错误",
	TokenExpireError:   "登录已失效，请重新登录",
	TokenGenerateError: "生成Token失败",
	DbError:            "数据库操作失败",
	RecordNotFound:     "记录不存在",
	Forbidden:          "无权限访问或操作被禁止",

	UserNotFound: "用户不存在",
	UserExisted:  "用户已存在",
	PasswordErr:  "密码错误",

	FileUploadError:    "文件上传失败",
	FileTooLargeError:  "文件大小超出允许范围",
	FileForbiddenError: "禁止上传可执行或危险脚本文件",
}

// MapErrMsg 根据错误码返回预设的错误描述
func MapErrMsg(errCode uint32) string {
	if msg, ok := message[errCode]; ok {
		return msg
	}
	return "未知系统错误"
}
