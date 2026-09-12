package storage

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"go-zero-boilerplate/pkg/xerr"
)

func TestLocalStorageDriver(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "storage-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	cfg := Config{
		Driver:   "local",
		BasePath: tempDir,
		BaseUrl:  "/uploads",
		MaxSize:  1024 * 1024, // 1MB
	}

	driver, err := NewDriver(cfg)
	if err != nil {
		t.Fatalf("failed to create driver: %v", err)
	}

	ctx := context.Background()

	t.Run("Upload Normal Image", func(t *testing.T) {
		content := []byte("fake-png-image-content-bytes-12345")
		reader := bytes.NewReader(content)

		info, err := driver.Upload(ctx, reader, "avatar.png", int64(len(content)), "image/png")
		if err != nil {
			t.Fatalf("unexpected upload error: %v", err)
		}

		if info.OriginalName != "avatar.png" {
			t.Errorf("expected originalName avatar.png, got %s", info.OriginalName)
		}
		if !strings.HasPrefix(info.Url, "/uploads/") {
			t.Errorf("expected url starting with /uploads/, got %s", info.Url)
		}
		if info.Size != int64(len(content)) {
			t.Errorf("expected size %d, got %d", len(content), info.Size)
		}
		if info.Hash == "" {
			t.Error("expected non-empty hash")
		}

		// Verify file exists on disk
		fullPath := filepath.Join(tempDir, filepath.FromSlash(info.Path))
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			t.Fatalf("file not found on disk at: %s", fullPath)
		}

		// Test instant deduplication
		reader2 := bytes.NewReader(content)
		info2, err := driver.Upload(ctx, reader2, "another_name.png", int64(len(content)), "image/png")
		if err != nil {
			t.Fatalf("unexpected deduplication error: %v", err)
		}
		if info2.Hash != info.Hash {
			t.Errorf("expected same hash %s, got %s", info.Hash, info2.Hash)
		}
		if info2.Path != info.Path {
			t.Errorf("expected same path %s, got %s", info.Path, info2.Path)
		}
	})

	t.Run("Reject Dangerous Extensions", func(t *testing.T) {
		dangerousNames := []string{"virus.exe", "trojan.bat", "backdoor.sh", "webshell.php", "script.ps1"}
		for _, name := range dangerousNames {
			reader := bytes.NewReader([]byte("malicious content"))
			_, err := driver.Upload(ctx, reader, name, 17, "application/octet-stream")
			if err == nil {
				t.Fatalf("expected error for %s, got nil", name)
			}
			codeErr, ok := err.(*xerr.CodeError)
			if !ok || codeErr.GetErrCode() != xerr.FileForbiddenError {
				t.Errorf("expected FileForbiddenError for %s, got %v", name, err)
			}
		}
	})

	t.Run("Reject Too Large File", func(t *testing.T) {
		largeContent := make([]byte, 2*1024*1024) // 2MB > 1MB
		reader := bytes.NewReader(largeContent)
		_, err := driver.Upload(ctx, reader, "huge.zip", int64(len(largeContent)), "application/zip")
		if err == nil {
			t.Fatal("expected error for oversized file, got nil")
		}
		codeErr, ok := err.(*xerr.CodeError)
		if !ok || codeErr.GetErrCode() != xerr.FileTooLargeError {
			t.Errorf("expected FileTooLargeError, got %v", err)
		}
	})

	t.Run("Delete and Path Traversal Guard", func(t *testing.T) {
		err := driver.Delete(ctx, "../../../etc/passwd")
		if err == nil {
			t.Fatal("expected path traversal protection error, got nil")
		}
	})
}
