// Package guard 提供出站请求安全防护：连通性测试目标地址的 SSRF 校验。
package guard

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"strings"
)

// ErrBlocked 目标地址被安全校验拒绝
var ErrBlocked = errors.New("目标地址被安全策略拒绝")

// Policy SSRF 校验策略
type Policy struct {
	// AllowPrivateRanges 放行 RFC1918 私有网段（10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16）。
	// 企业集成与集群 API 常驻内网，生产部署可按需开启；
	// 环回、链路本地（含云元数据 169.254.169.254）地址不受此开关影响，始终拒绝。
	AllowPrivateRanges bool
}

// CheckOutboundTarget 对用户提供的出站目标（URL 或 host:port）做 SSRF 校验：
// 解析全部 A/AAAA 记录后逐 IP 判定，任一 IP 命中拒绝网段即整体拒绝，
// 防止以合法域名掩护指向内网/元数据地址。
func CheckOutboundTarget(ctx context.Context, target string, p Policy) error {
	host, err := extractHost(target)
	if err != nil {
		return fmt.Errorf("%w: %s", ErrBlocked, err.Error())
	}
	if host == "" {
		return fmt.Errorf("%w: 目标主机为空", ErrBlocked)
	}

	// 已是字面量 IP 则直接判定
	if ip := net.ParseIP(host); ip != nil {
		return checkIP(ip, p)
	}

	// 域名：解析后逐 IP 判定（覆盖 DNS 指向内网/元数据地址的情形）
	ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return fmt.Errorf("%w: 目标解析失败 (%s)", ErrBlocked, host)
	}
	if len(ips) == 0 {
		return fmt.Errorf("%w: 目标无可用解析记录 (%s)", ErrBlocked, host)
	}
	for _, addr := range ips {
		if err := checkIP(addr.IP, p); err != nil {
			return err
		}
	}
	return nil
}

func extractHost(target string) (string, error) {
	t := strings.TrimSpace(target)
	if t == "" {
		return "", errors.New("目标地址为空")
	}
	if strings.Contains(t, "://") {
		u, err := url.Parse(t)
		if err != nil {
			return "", fmt.Errorf("目标 URL 非法: %s", t)
		}
		return stripBrackets(u.Hostname()), nil
	}
	// host:port 形式
	if h, _, err := net.SplitHostPort(t); err == nil {
		return stripBrackets(h), nil
	}
	return stripBrackets(t), nil
}

func stripBrackets(h string) string {
	return strings.Trim(h, "[]")
}

func checkIP(ip net.IP, p Policy) error {
	block := func(reason string) error {
		return fmt.Errorf("%w: %s (%s)", ErrBlocked, reason, ip.String())
	}

	// 始终拒绝：环回（本机服务）、链路本地（云元数据 169.254.169.254）、
	// 未指定、组播、广播 —— 与 AllowPrivateRanges 开关无关
	if ip.IsLoopback() {
		return block("环回地址不允许访问")
	}
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return block("链路本地地址不允许访问")
	}
	if ip.IsUnspecified() || ip.IsMulticast() {
		return block("非单播地址不允许访问")
	}

	// 默认拒绝：私有网段（策略放行时才允许，用于企业内网集成）
	if ip.IsPrivate() && !p.AllowPrivateRanges {
		return block("私有网段地址默认不允许访问")
	}
	return nil
}
