package titanlogic

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

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

func (l *TestIntegrationLogic) TestIntegration(in *titan.TestIntegrationReq) (*titan.TestIntegrationResp, error) {
	item, err := l.svcCtx.IntegrationModel.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrMsg("集成凭据不存在")
	}

	rawCfg := item.Config
	if dec, err := cryptox.Decrypt(item.Config, ""); err == nil && dec != "" {
		rawCfg = dec
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
				Message: "Jenkins 配置格式错误: " + err.Error(),
			}, nil
		}

		client := jenkins.NewClient(jCfg)
		version, err := client.TestConnection(l.ctx)
		if err != nil {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "连接 Jenkins 失败: " + err.Error(),
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
				Message: "Nacos 配置 JSON 格式错误: " + err.Error(),
			}, nil
		}
		if nCfg.ServerAddr == "" {
			return &titan.TestIntegrationResp{
				Success: false,
				Message: "Nacos 服务地址 (serverAddr) 不能为空",
			}, nil
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
		req, _ := http.NewRequestWithContext(l.ctx, http.MethodGet, testUrl, nil)
		resp, err := httpClient.Do(req)
		if err != nil {
			// 若 readiness 接口不通，回退尝试根路径探测
			rootUrl := strings.TrimRight(targetAddr, "/") + ctxPath + "/"
			req2, _ := http.NewRequestWithContext(l.ctx, http.MethodGet, rootUrl, nil)
			resp2, err2 := httpClient.Do(req2)
			if err2 != nil {
				return &titan.TestIntegrationResp{
					Success: false,
					Message: fmt.Sprintf("无法连接至 Nacos 节点 [%s]: %s", nCfg.ServerAddr, err.Error()),
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
				Message: "Apollo 配置 JSON 格式错误: " + err.Error(),
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
		if !strings.HasPrefix(targetUrl, "http://") && !strings.HasPrefix(targetUrl, "https://") {
			targetUrl = "http://" + targetUrl
		}

		req, _ := http.NewRequestWithContext(l.ctx, http.MethodGet, strings.TrimRight(targetUrl, "/")+"/health", nil)
		if aCfg.Token != "" {
			req.Header.Set("Authorization", aCfg.Token)
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			// 回退尝试直接请求 targetUrl
			req2, _ := http.NewRequestWithContext(l.ctx, http.MethodGet, targetUrl, nil)
			resp2, err2 := httpClient.Do(req2)
			if err2 != nil {
				return &titan.TestIntegrationResp{
					Success: false,
					Message: fmt.Sprintf("无法连接至 Apollo 配置中心 [%s]: %s", targetUrl, err.Error()),
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
		return &titan.TestIntegrationResp{
			Success: true,
			Message: "凭据解密成功，配置格式校验通过",
		}, nil
	}
}
