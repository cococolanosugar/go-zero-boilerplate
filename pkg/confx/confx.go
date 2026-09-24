package confx

import (
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/zeromicro/go-zero/core/conf"
)

var loaders = map[string]func([]byte, any) error{
	".json":  conf.LoadFromJsonBytes,
	".json5": conf.LoadFromJson5Bytes,
	".toml":  conf.LoadFromTomlBytes,
	".yaml":  conf.LoadFromYamlBytes,
	".yml":   conf.LoadFromYamlBytes,
}

// ExpandEnvWithDefault expands ${VAR:default} and ${VAR} placeholders using environment variables.
func ExpandEnvWithDefault(s string) string {
	return os.Expand(s, func(key string) string {
		varName, defaultVal, hasDefault := strings.Cut(key, ":")
		if val, ok := os.LookupEnv(varName); ok && val != "" {
			return val
		}
		if hasDefault {
			return defaultVal
		}
		return os.Getenv(key)
	})
}

// MustLoad loads config into v from file, expanding ${VAR:default} placeholders.
// Panics if loading fails.
func MustLoad(file string, v any) {
	if err := Load(file, v); err != nil {
		panic(err)
	}
}

// Load loads config into v from file (.yaml, .yml, .json, .json5, .toml),
// expanding ${VAR:default} and environment variables.
func Load(file string, v any) error {
	content, err := os.ReadFile(file)
	if err != nil {
		return err
	}

	ext := strings.ToLower(path.Ext(file))
	loader, ok := loaders[ext]
	if !ok {
		return fmt.Errorf("confx: unrecognized file type: %s", file)
	}

	expanded := ExpandEnvWithDefault(string(content))
	return loader([]byte(expanded), v)
}
