package jenkins

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	URL      string `json:"url"`
	Username string `json:"username"`
	Token    string `json:"token"`
}

type Client struct {
	cfg        Config
	httpClient *http.Client
}

type CrumbIssuerResp struct {
	CrumbRequestField string `json:"crumbRequestField"`
	Crumb             string `json:"crumb"`
}

type QueueItemResp struct {
	Blocked    bool `json:"blocked"`
	Buildable  bool `json:"buildable"`
	Cancelled  bool `json:"cancelled"`
	ID         int64 `json:"id"`
	Executable struct {
		Number int64  `json:"number"`
		URL    string `json:"url"`
	} `json:"executable"`
}

type BuildInfoResp struct {
	Building          bool   `json:"building"`
	Duration          int64  `json:"duration"`
	EstimatedDuration int64  `json:"estimatedDuration"`
	ID                string `json:"id"`
	Number            int64  `json:"number"`
	Result            string `json:"result"` // SUCCESS, FAILURE, ABORTED, UNSTABLE
	Timestamp         int64  `json:"timestamp"`
	URL               string `json:"url"`
}

type ProgressiveLogResp struct {
	Content    string
	NextOffset int64
	HasMore    bool
}

func NewClient(cfg Config) *Client {
	return &Client{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) getCrumb(ctx context.Context) (string, string, error) {
	reqURL := fmt.Sprintf("%s/crumbIssuer/api/json", strings.TrimRight(c.cfg.URL, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return "", "", err
	}
	if c.cfg.Username != "" && c.cfg.Token != "" {
		req.SetBasicAuth(c.cfg.Username, c.cfg.Token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		// CSRF protection might be disabled
		return "", "", nil
	}
	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("fetch crumb returned status %d", resp.StatusCode)
	}

	var crumbResp CrumbIssuerResp
	if err := json.NewDecoder(resp.Body).Decode(&crumbResp); err != nil {
		return "", "", err
	}
	return crumbResp.CrumbRequestField, crumbResp.Crumb, nil
}

// TestConnection 测试 Jenkins 连通性与权限
func (c *Client) TestConnection(ctx context.Context) (string, error) {
	reqURL := fmt.Sprintf("%s/api/json", strings.TrimRight(c.cfg.URL, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return "", err
	}
	if c.cfg.Username != "" && c.cfg.Token != "" {
		req.SetBasicAuth(c.cfg.Username, c.cfg.Token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("jenkins api returned status %d", resp.StatusCode)
	}
	version := resp.Header.Get("X-Jenkins")
	if version == "" {
		version = "unknown"
	}
	return version, nil
}

// TriggerJob 触发远程 Jenkins Job（支持携带动态参数），返回 Queue ID
func (c *Client) TriggerJob(ctx context.Context, jobName string, params map[string]string) (int64, error) {
	baseURL := strings.TrimRight(c.cfg.URL, "/")
	var reqURL string
	var query url.Values

	if len(params) > 0 {
		query = url.Values{}
		for k, v := range params {
			query.Set(k, v)
		}
		reqURL = fmt.Sprintf("%s/job/%s/buildWithParameters?%s", baseURL, url.PathEscape(jobName), query.Encode())
	} else {
		reqURL = fmt.Sprintf("%s/job/%s/build", baseURL, url.PathEscape(jobName))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, nil)
	if err != nil {
		return 0, err
	}
	if c.cfg.Username != "" && c.cfg.Token != "" {
		req.SetBasicAuth(c.cfg.Username, c.cfg.Token)
	}

	// 注入 CSRF Crumb
	field, crumb, _ := c.getCrumb(ctx)
	if field != "" && crumb != "" {
		req.Header.Set(field, crumb)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("trigger job %s failed with status %d: %s", jobName, resp.StatusCode, string(body))
	}

	// 从 Location 头提取 Queue Item ID (例如: http://jenkins/queue/item/42/)
	location := resp.Header.Get("Location")
	if location == "" {
		return 0, nil
	}
	trimmed := strings.TrimRight(location, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) > 0 {
		queueID, _ := strconv.ParseInt(parts[len(parts)-1], 10, 64)
		return queueID, nil
	}
	return 0, nil
}

// GetQueueItem 查询排队状态与分配的 Build Number
func (c *Client) GetQueueItem(ctx context.Context, queueID int64) (*QueueItemResp, error) {
	reqURL := fmt.Sprintf("%s/queue/item/%d/api/json", strings.TrimRight(c.cfg.URL, "/"), queueID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	if c.cfg.Username != "" && c.cfg.Token != "" {
		req.SetBasicAuth(c.cfg.Username, c.cfg.Token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("query queue item returned status %d", resp.StatusCode)
	}

	var item QueueItemResp
	if err := json.NewDecoder(resp.Body).Decode(&item); err != nil {
		return nil, err
	}
	return &item, nil
}

// GetBuildInfo 获取构建详细状态
func (c *Client) GetBuildInfo(ctx context.Context, jobName string, buildNumber int64) (*BuildInfoResp, error) {
	reqURL := fmt.Sprintf("%s/job/%s/%d/api/json", strings.TrimRight(c.cfg.URL, "/"), url.PathEscape(jobName), buildNumber)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	if c.cfg.Username != "" && c.cfg.Token != "" {
		req.SetBasicAuth(c.cfg.Username, c.cfg.Token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("query build info returned status %d", resp.StatusCode)
	}

	var info BuildInfoResp
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	return &info, nil
}

// GetProgressiveLog 增量流式抓取构建控制台输出日志
func (c *Client) GetProgressiveLog(ctx context.Context, jobName string, buildNumber int64, offset int64) (*ProgressiveLogResp, error) {
	reqURL := fmt.Sprintf("%s/job/%s/%d/logText/progressiveText?start=%d",
		strings.TrimRight(c.cfg.URL, "/"), url.PathEscape(jobName), buildNumber, offset)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, nil)
	if err != nil {
		return nil, err
	}
	if c.cfg.Username != "" && c.cfg.Token != "" {
		req.SetBasicAuth(c.cfg.Username, c.cfg.Token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("progressive log returned status %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	nextOffsetStr := resp.Header.Get("X-Text-Size")
	hasMoreStr := resp.Header.Get("X-More-Data")

	nextOffset, _ := strconv.ParseInt(nextOffsetStr, 10, 64)
	if nextOffset == 0 {
		nextOffset = offset + int64(len(bodyBytes))
	}

	return &ProgressiveLogResp{
		Content:    string(bodyBytes),
		NextOffset: nextOffset,
		HasMore:    strings.EqualFold(hasMoreStr, "true"),
	}, nil
}
