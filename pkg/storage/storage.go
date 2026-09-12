package storage

import (
	"context"
	"fmt"
	"io"
)

// FileInfo 上传文件元数据
type FileInfo struct {
	OriginalName string `json:"originalName"`
	Filename     string `json:"filename"`
	Path         string `json:"path"`
	Url          string `json:"url"`
	Size         int64  `json:"size"`
	MimeType     string `json:"mimeType"`
	Hash         string `json:"hash"`
}

// Config 存储驱动配置
type Config struct {
	Driver   string `json:",default=local,options=[local,minio,oss]"`
	BasePath string `json:",default=./data/uploads"`
	BaseUrl  string `json:",default=/uploads"`
	MaxSize  int64  `json:",default=20971520"` // 默认 20MB
}

// Driver 对象存储通用驱动接口
type Driver interface {
	Upload(ctx context.Context, reader io.Reader, originalName string, size int64, mimeType string) (*FileInfo, error)
	Delete(ctx context.Context, path string) error
	GetUrl(ctx context.Context, path string) string
}

// NewDriver 根据配置构造存储驱动
func NewDriver(c Config) (Driver, error) {
	switch c.Driver {
	case "local", "":
		return NewLocalStorageDriver(c), nil
	default:
		return nil, fmt.Errorf("unsupported storage driver: %s", c.Driver)
	}
}
