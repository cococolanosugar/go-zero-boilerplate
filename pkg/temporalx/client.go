package temporalx

import (
	"fmt"

	"github.com/zeromicro/go-zero/core/logx"
	"go.temporal.io/sdk/client"
)

// logxAdapter adapts go-zero logx to Temporal SDK log.Logger
type logxAdapter struct{}

func (l *logxAdapter) Debug(msg string, keyvals ...interface{}) {
	logx.Debugw(msg, toLogxFields(keyvals...)...)
}

func (l *logxAdapter) Info(msg string, keyvals ...interface{}) {
	logx.Infow(msg, toLogxFields(keyvals...)...)
}

func (l *logxAdapter) Warn(msg string, keyvals ...interface{}) {
	logx.Sloww(msg, toLogxFields(keyvals...)...)
}

func (l *logxAdapter) Error(msg string, keyvals ...interface{}) {
	logx.Errorw(msg, toLogxFields(keyvals...)...)
}

func toLogxFields(keyvals ...interface{}) []logx.LogField {
	var fields []logx.LogField
	for i := 0; i < len(keyvals); i += 2 {
		if i+1 < len(keyvals) {
			fields = append(fields, logx.Field(fmt.Sprintf("%v", keyvals[i]), keyvals[i+1]))
		}
	}
	return fields
}

// NewClient creates a new Temporal Client with go-zero logx logger integration
func NewClient(c Config) (client.Client, error) {
	opts := client.Options{
		HostPort:  c.HostPort,
		Namespace: c.Namespace,
		Logger:    &logxAdapter{},
	}
	return client.Dial(opts)
}
