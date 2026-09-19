package titanlogic

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"go-zero-boilerplate/app/titan/rpc/internal/guard"
	"go-zero-boilerplate/app/titan/rpc/internal/jenkins"
	"go-zero-boilerplate/app/titan/rpc/internal/svc"
	"go-zero-boilerplate/app/titan/rpc/titan"
	"go-zero-boilerplate/pkg/cryptox"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type TestIntegrationLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewTestIntegrationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TestIntegrationLogic {
	return &TestIntegrationLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

type NacosTestConfig struct {
	ServerAddr  string `json:"serverAddr"`
	Namespace   string `json:"namespace"`
	Group       string `json:"group"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	ContextPath string `json:"contextPath"`
}

type ApolloTestConfig struct {
	PortalUrl  string `json:"portalUrl"`
	MetaServer string `json:"metaServer"`
	AppId      string `json:"appId"`
	Cluster    string `json:"cluster"`
	Env        string `json:"env"`
	Token      string `json:"token"`
}

// guardPolicy 从服务配置构造 SSRF 校验策略
func (l *TestIntegrationLogic) guardPolicy() guard.Policy {
	return guard.Policy{AllowPrivateRanges: l.svcCtx.Config.Guard.AllowPrivateNetwork}
}

// guardTarget 对出站目标做 SSRF 校验，命中拒绝网段时返回用户可读错误（不透出内部细节）
func guardTarget(policy guard.Policy, target string) error {
	if err := guard.CheckOutboundTarget(context.Background(), target, policy); err != nil {
		if errors.Is(err, guard.ErrBlocked) {
			return xerr.NewErrMsg("连通性测试目标地址不被允许: " + err.Error())
		}
		return xerr.NewErrMsg("连通性测试目标校验失败")
	}
	return nil
}

func (l *TestIntegrationLogic) TestIntegration(in *titan.TestIntegrationReq) (*titan.TestIntegrationResp, error) {
	item, err := l.svcCtx.IntegrationModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, notFoundOrError(err, "集成凭证")
	}

	// 解密失败不再静默回退密文，直接返回明确失败（unknown category 也不返回假成功）
	rawCfg, decErr := cryptox.Decrypt(item.Config, "")
	if decErr != nil || rawCfg == "" {
		return &titan.TestIntegrationResp{
			Success: false,
			Message: "集成配置解密失败，无法执行连通性测试",
		}, nil
	}

	httpClient := &http.Client{
		Timeout: 4 * time.Second,
	}

	cat := strings.ToLower(strings.TrimSpace(item.Category))
	switch cat {
	case "jenkins":
		var jCfg jenkins.Config
		if err := json.Unmarshal([]byte(rawCfg), &jCfg); err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Jenkins 配置格式错误",
			}, nil
		}
		if jCfg.URL == "" {
			return &titan.TestIntegrationResp{Success: false, Message: "Jenkins URL 不能为空"}, nil
		}
		if err := guardTarget(l.guardPolicy(), jCfg.URL); err != nil {
			return &titan.TestIntegrationResp{Success: false, Message: err.Error()}, nil
		}

		client := jenkins.NewClient(jCfg)
		version, err := client.TestConnection(l.ctx)
		if err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "无法连接至 Jenkins 服务，请检查地址与凭据",
			}, nil
		}
		return &titan.TestIntegrationResp{
			Success: true,
			Message: fmt.Sprintf("连接成功，Jenkins 版本: %s", version),
		}, nil

	case "nacos":
		var nCfg NacosTestConfig
		if err := json.Unmarshal([]byte(rawCfg), &nCfg); err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Nacos 配置 JSON 格式错误",
			}, nil
		}
		if nCfg.ServerAddr == "" {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Nacos 服务地址 (serverAddr) 不能为空",
			}, nil
		}
		if err := guardTarget(l.guardPolicy(), nCfg.ServerAddr); err != nil {
			return &titan.TestIntegrationResp{Success: false, Message: err.Error()}, nil
		}

		targetAddr := nCfg.ServerAddr
		if !strings.HasPrefix(targetAddr, "http://") && !strings.HasPrefix(targetAddr, "https://") {
			targetAddr = "http://" + targetAddr
		}
		ctxPath := nCfg.ContextPath
		if ctxPath == "" {
			ctxPath = "/nacos"
		}
		if !strings.HasPrefix(ctxPath, "/") {
			ctxPath = "/" + ctxPath
		}

		// 测试探测 Nacos 状态与就绪接口
		testUrl := strings.TrimRight(targetAddr, "/") + ctxPath + "/v1/console/health/readiness"
		req, rErr := http.NewRequestWithContext(l.ctx, http.MethodGet, testUrl, nil)
		if rErr != nil {
			return &titan.TestIntegrationResp{Success: false, Message: "无法构造探测请求"}, nil
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			// 若 readiness 接口不通，回退尝试根路径探测
			rootUrl := strings.TrimRight(targetAddr, "/") + ctxPath + "/"
			req2, r2Err := http.NewRequestWithContext(l.ctx, http.MethodGet, rootUrl, nil)
			if r2Err != nil {
				return &titan.TestIntegrationResp{Success: false, Message: "无法构造探测请求"}, nil
			}
			resp2, err2 := httpClient.Do(req2)
			if err2 != nil {
				return &titan.TestIntegrationResp{
					Success: false,
					Message: fmt.Sprintf("无法连接至 Nacos 节点 [%s]: 目标不可达或超时", nCfg.ServerAddr),
				}, nil
			}
			resp = resp2
		}
		defer resp.Body.Close()

		ns := nCfg.Namespace
		if ns == "" {
			ns = "public"
		}
		return &titan.TestIntegrationResp{
			Success: true,
			Message: fmt.Sprintf("Nacos 服务连通成功 (HTTP %d)，注册中心节点: %s，目标命名空间: %s", resp.StatusCode, nCfg.ServerAddr, ns),
		}, nil

	case "apollo":
		var aCfg ApolloTestConfig
		if err := json.Unmarshal([]byte(rawCfg), &aCfg); err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Apollo 配置 JSON 格式错误",
			}, nil
		}
		targetUrl := aCfg.PortalUrl
		if targetUrl == "" {
			targetUrl = aCfg.MetaServer
		}
		if targetUrl == "" {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Apollo 配置中心 portalUrl 或 metaServer 不能为空",
			}, nil
		}
		if err := guardTarget(l.guardPolicy(), targetUrl); err != nil {
			return &titan.TestIntegrationResp{Success: false, Message: err.Error()}, nil
		}
		if !strings.HasPrefix(targetUrl, "http://") && !strings.HasPrefix(targetUrl, "https://") {
			targetUrl = "http://" + targetUrl
		}

		req, rErr := http.NewRequestWithContext(l.ctx, http.MethodGet, strings.TrimRight(targetUrl, "/")+"/health", nil)
		if rErr != nil {
			return &titan.TestIntegrationResp{Success: false, Message: "无法构造探测请求"}, nil
		}
		if aCfg.Token != "" {
			req.Header.Set("Authorization", aCfg.Token)
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			// 回退尝试直接请求 targetUrl
			req2, r2Err := http.NewRequestWithContext(l.ctx, http.MethodGet, targetUrl, nil)
			if r2Err != nil {
				return &titan.TestIntegrationResp{Success: false, Message: "无法构造探测请求"}, nil
			}
			resp2, err2 := httpClient.Do(req2)
			if err2 != nil {
				return &titan.TestIntegrationResp{
					Success: false,
					Message: fmt.Sprintf("无法连接至 Apollo 配置中心 [%s]: 目标不可达或超时", targetUrl),
				}, nil
			}
			resp = resp2
		}
		defer resp.Body.Close()

		return &titan.TestIntegrationResp{
			Success: true,
			Message: fmt.Sprintf("Apollo 配置中心连通成功 (HTTP %d)，应用 AppID: %s，环境: %s", resp.StatusCode, aCfg.AppId, aCfg.Env),
		}, nil

	default:
		// 未知类别：仅确认配置可解析，不再返回假成功
		var probe map[string]interface{}
		if err := json.Unmarshal([]byte(rawCfg), &probe); err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "配置不是合法 JSON，无法测试",
			}, nil
		}
		return &titan.TestIntegrationResp{
			Success: true,
			Message: "凭据解密成功，配置格式校验通过 (该类别暂无主动探测，仅校验配置)",
		}, nil
	}
}
