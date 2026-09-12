package storage

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
	"go-zero-boilerplate/pkg/xerr"
)

var dangerousExts = map[string]struct{}{
	".exe":   {},
	".bat":   {},
	".cmd":   {},
	".sh":    {},
	".bash":  {},
	".php":   {},
	".phtml": {},
	".jsp":   {},
	".asp":   {},
	".aspx":  {},
	".py":    {},
	".vbs":   {},
	".dll":   {},
	".so":    {},
	".cgi":   {},
	".pl":    {},
	".ps1":   {},
}

// LocalStorageDriver 本地磁盘存储驱动
type LocalStorageDriver struct {
	basePath string
	baseUrl  string
	maxSize  int64
}

// NewLocalStorageDriver 构造本地存储驱动
func NewLocalStorageDriver(c Config) *LocalStorageDriver {
	basePath := c.BasePath
	if basePath == "" {
		basePath = "./data/uploads"
	}
	baseUrl := c.BaseUrl
	if baseUrl == "" {
		baseUrl = "/uploads"
	}
	maxSize := c.MaxSize
	if maxSize <= 0 {
		maxSize = 20 * 1024 * 1024 // 20MB
	}

	return &LocalStorageDriver{
		basePath: filepath.Clean(basePath),
		baseUrl:  baseUrl,
		maxSize:  maxSize,
	}
}

// Upload 上传文件流到本地磁盘并返回元数据
func (d *LocalStorageDriver) Upload(ctx context.Context, reader io.Reader, originalName string, size int64, mimeType string) (*FileInfo, error) {
	ext := strings.ToLower(filepath.Ext(originalName))

	// 1. 安全过滤：禁止危险脚本与可执行文件
	if _, dangerous := dangerousExts[ext]; dangerous {
		return nil, xerr.NewErrCode(xerr.FileForbiddenError)
	}

	// 2. 预检尺寸
	if size > d.maxSize {
		return nil, xerr.NewErrCode(xerr.FileTooLargeError)
	}

	// 3. 创建临时文件并计算 SHA-256
	tempFile, err := os.CreateTemp("", "storage-upload-*")
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to create temp file: %v", err)
		return nil, xerr.NewErrCode(xerr.FileUploadError)
	}
	defer func() {
		_ = tempFile.Close()
		_ = os.Remove(tempFile.Name())
	}()

	hash := sha256.New()
	limitReader := io.LimitReader(reader, d.maxSize+1)
	writer := io.MultiWriter(tempFile, hash)

	written, err := io.Copy(writer, limitReader)
	if err != nil {
		logx.WithContext(ctx).Errorf("failed to copy file stream: %v", err)
		return nil, xerr.NewErrCode(xerr.FileUploadError)
	}

	if written > d.maxSize {
		return nil, xerr.NewErrCode(xerr.FileTooLargeError)
	}

	hashHex := hex.EncodeToString(hash.Sum(nil))

	// 4. 嗅探 MIME 类型
	if mimeType == "" || mimeType == "application/octet-stream" {
		buf := make([]byte, 512)
		if _, err := tempFile.Seek(0, io.SeekStart); err == nil {
			n, _ := tempFile.Read(buf)
			if n > 0 {
				mimeType = http.DetectContentType(buf[:n])
			}
		}
	}

	// 5. 目标路径构建：data/uploads/YYYY/MM/DD/<hash><ext>
	now := time.Now()
	dateDir := now.Format("2006/01/02")
	filename := fmt.Sprintf("%s%s", hashHex, ext)
	relPath := fmt.Sprintf("%s/%s", dateDir, filename)

	targetDir := filepath.Join(d.basePath, filepath.FromSlash(dateDir))
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		logx.WithContext(ctx).Errorf("failed to create target dir: %v", err)
		return nil, xerr.NewErrCode(xerr.FileUploadError)
	}

	targetFile := filepath.Join(targetDir, filename)

	// 6. 秒传校验：若同哈希同名文件已存在，直接复用
	if fi, err := os.Stat(targetFile); err == nil && fi.Size() == written {
		return &FileInfo{
			OriginalName: originalName,
			Filename:     filename,
			Path:         relPath,
			Url:          d.GetUrl(ctx, relPath),
			Size:         written,
			MimeType:     mimeType,
			Hash:         hashHex,
		}, nil
	}

	// 7. 持久化文件
	_ = tempFile.Close()
	if err := copyFile(tempFile.Name(), targetFile); err != nil {
		logx.WithContext(ctx).Errorf("failed to move temp file to target: %v", err)
		return nil, xerr.NewErrCode(xerr.FileUploadError)
	}

	return &FileInfo{
		OriginalName: originalName,
		Filename:     filename,
		Path:         relPath,
		Url:          d.GetUrl(ctx, relPath),
		Size:         written,
		MimeType:     mimeType,
		Hash:         hashHex,
	}, nil
}

// Delete 删除本地文件
func (d *LocalStorageDriver) Delete(ctx context.Context, path string) error {
	cleanRel := filepath.Clean(filepath.FromSlash(path))
	if strings.HasPrefix(cleanRel, "..") {
		return fmt.Errorf("invalid file path traversal: %s", path)
	}

	fullPath := filepath.Join(d.basePath, cleanRel)
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		logx.WithContext(ctx).Errorf("failed to delete file %s: %v", fullPath, err)
		return err
	}
	return nil
}

// GetUrl 获取公开访问 URL
func (d *LocalStorageDriver) GetUrl(ctx context.Context, path string) string {
	cleanPath := strings.TrimPrefix(filepath.ToSlash(path), "/")
	return fmt.Sprintf("%s/%s", strings.TrimRight(d.baseUrl, "/"), cleanPath)
}

func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}
