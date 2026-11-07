package guard

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCheckOutboundTargetLiteralIP(t *testing.T) {
	ctx := context.Background()

	// 云元数据地址：任何策略下始终拒绝
	err := CheckOutboundTarget(ctx, "http://169.254.169.254/latest/meta-data", Policy{AllowPrivateRanges: true})
	assert.ErrorIs(t, err, ErrBlocked)

	// 环回地址：始终拒绝
	err = CheckOutboundTarget(ctx, "127.0.0.1:8848", Policy{AllowPrivateRanges: true})
	assert.ErrorIs(t, err, ErrBlocked)

	// 私有网段：默认拒绝
	err = CheckOutboundTarget(ctx, "10.1.2.3", Policy{})
	assert.ErrorIs(t, err, ErrBlocked)

	// 私有网段：策略放行后允许（企业内网集成）
	err = CheckOutboundTarget(ctx, "http://10.1.2.3:8848/nacos", Policy{AllowPrivateRanges: true})
	assert.NoError(t, err)

	// 公网地址：允许
	err = CheckOutboundTarget(ctx, "https://api.github.com", Policy{})
	// api.github.com 解析可能包含 IPv6 等公网地址，不应命中拒绝网段
	assert.NotErrorIs(t, err, ErrBlocked)
}

func TestCheckOutboundTargetDNSToPrivate(t *testing.T) {
	ctx := context.Background()
	// metadata.google.internal 解析到 169.254.169.254（元数据地址），域名掩护也应被拒
	err := CheckOutboundTarget(ctx, "http://metadata.google.internal/computeMetadata/v1", Policy{AllowPrivateRanges: true})
	assert.ErrorIs(t, err, ErrBlocked)
}

func TestCheckOutboundTargetInvalid(t *testing.T) {
	ctx := context.Background()

	err := CheckOutboundTarget(ctx, "", Policy{})
	assert.ErrorIs(t, err, ErrBlocked)

	// 不可解析域名：拒绝（不发起出站请求）
	err = CheckOutboundTarget(ctx, "http://this-domain-definitely-does-not-exist.invalid", Policy{})
	assert.ErrorIs(t, err, ErrBlocked)
	assert.True(t, errors.Is(err, ErrBlocked))
}
