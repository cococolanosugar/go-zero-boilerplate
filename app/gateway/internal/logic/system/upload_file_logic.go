package system

import (
	"context"
	"net/http"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type UploadFileLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	r      *http.Request
}

// 通用文件上传
func NewUploadFileLogic(ctx context.Context, svcCtx *svc.ServiceContext, r *http.Request) *UploadFileLogic {
	return &UploadFileLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		r:      r,
	}
}

func (l *UploadFileLogic) UploadFile() (resp *types.FileUploadResp, err error) {
	// 1. 限制表单解析大小
	maxSize := l.svcCtx.Config.Storage.MaxSize
	if maxSize <= 0 {
		maxSize = 20 * 1024 * 1024
	}
	if err := l.r.ParseMultipartForm(maxSize); err != nil {
		l.Errorf("parse multipart form failed: %v", err)
		return nil, xerr.NewErrCode(xerr.FileTooLargeError)
	}

	// 2. 读取文件表单，默认 key 为 "file"
	file, fileHeader, err := l.r.FormFile("file")
	if err != nil {
		l.Errorf("get form file failed: %v", err)
		return nil, xerr.NewCodeError(xerr.RequestParamError, "上传文件不能为空 (字段名需为 file)")
	}
	defer file.Close()

	// 3. 调用通用存储驱动上传
	fileInfo, err := l.svcCtx.Storage.Upload(
		l.ctx,
		file,
		fileHeader.Filename,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
	)
	if err != nil {
		l.Errorf("storage driver upload failed: %v", err)
		return nil, err
	}

	return &types.FileUploadResp{
		Url:          fileInfo.Url,
		Filename:     fileInfo.Filename,
		OriginalName: fileInfo.OriginalName,
		Size:         fileInfo.Size,
		MimeType:     fileInfo.MimeType,
		Hash:         fileInfo.Hash,
	}, nil
}
