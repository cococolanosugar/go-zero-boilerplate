package main

import (
	"bytes"
	"database/sql"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"

	_ "github.com/go-sql-driver/mysql"
	"go-zero-boilerplate/hack/generator/meta"
)

type GeneratorConfig struct {
	Service   string
	Table     string
	DSN       string
	DBName    string
	OutputDir string
}

type TemplateContext struct {
	*meta.TableMeta
	EditableColumns     []meta.ColumnMeta
	AllUpdatableColumns []meta.ColumnMeta
	SearchColumn        string
}

func main() {
	service := flag.String("service", "user", "微服务名称 (user, order 等)")
	table := flag.String("table", "", "MySQL 数据表名称 (如 sys_post)")
	dsn := flag.String("dsn", "root:root@tcp(127.0.0.1:3306)/go_zero_boilerplate", "MySQL 连接 DSN")
	outputDir := flag.String("out", ".", "脚手架根目录")
	flag.Parse()

	if *table == "" {
		fmt.Println("错误: 请通过 -table 指定要生成的 MySQL 数据表名 (例如: -table sys_post)")
		os.Exit(1)
	}

	// 解析数据库名
	dbName := "go_zero_boilerplate"
	if slashIdx := strings.LastIndex(*dsn, "/"); slashIdx != -1 {
		part := (*dsn)[slashIdx+1:]
		if qIdx := strings.Index(part, "?"); qIdx != -1 {
			dbName = part[:qIdx]
		} else {
			dbName = part
		}
	}

	config := GeneratorConfig{
		Service:   *service,
		Table:     *table,
		DSN:       *dsn,
		DBName:    dbName,
		OutputDir: *outputDir,
	}

	fmt.Printf("🚀 开始为数据表 [%s] 生成全栈 CRUD 代码 (目标服务: %s, 数据库: %s)...\n", config.Table, config.Service, config.DBName)

	db, err := sql.Open("mysql", config.DSN)
	if err != nil {
		fmt.Printf("❌ 连接数据库失败: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	tableMeta, err := meta.InspectTable(db, config.DBName, config.Table, config.Service)
	if err != nil {
		fmt.Printf("❌ 解析数据表元数据失败: %v\n", err)
		os.Exit(1)
	}

	ctx := buildTemplateContext(tableMeta)

	// 1. 生成 Model (底层 Cache-Aside + 自定义分页扩展 + 注入 ServiceContext)
	if err := generateModel(config, ctx); err != nil {
		fmt.Printf("❌ 生成持久层 Model 失败: %v\n", err)
		os.Exit(1)
	}

	// 2. 追加 Proto 并重新生成 RPC 桩代码与实现 Logic
	if err := updateProtoAndGenRpc(config, ctx); err != nil {
		fmt.Printf("❌ 生成微服务 Proto 与 RPC 桩代码失败: %v\n", err)
		os.Exit(1)
	}

	// 3. 追加 Gateway API 契约并重新生成网关代码与实现 Logic
	if err := updateGatewayApiAndGen(config, ctx); err != nil {
		fmt.Printf("❌ 生成网关 API 契约失败: %v\n", err)
		os.Exit(1)
	}

	// 4. 同步前端 TypeScript SDK
	fmt.Println("  [4/5] 同步前端 TypeScript SDK (@zero/api)...")
	if err := runCommand(config.OutputDir, "just", "gen-ts"); err != nil {
		fmt.Printf("⚠️ 同步前端 SDK 告警 (可后续手动执行 just gen-ts): %v\n", err)
	}

	// 5. 生成前端 Ant Design ProTable 页面
	fmt.Println("  [5/5] 生成前端 Ant Design 6.x ProTable 页面组件...")
	if err := generateFrontendPage(config, ctx); err != nil {
		fmt.Printf("❌ 生成前端 ProTable 页面失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\n✨ 全栈 CRUD 代码生成大功告成！\n")
	fmt.Printf("----------------------------------------------------------------\n")
	fmt.Printf("📦 持久层 Model  : app/%s/model/%s_model.go\n", config.Service, config.Table)
	fmt.Printf("🔌 微服务 RPC    : app/%s/rpc/%s.proto\n", config.Service, config.Service)
	fmt.Printf("🌐 统一网关 API  : app/gateway/desc/%s.api\n", config.Service)
	fmt.Printf("🖥️ 前端页面组件  : frontend/apps/admin/src/pages/%s/index.tsx\n", ctx.EntityName)
	fmt.Printf("----------------------------------------------------------------\n")
	fmt.Printf("👉 提示：在 frontend/apps/admin/src/config/routes.ts 中添加以下路由即可展示：\n")
	fmt.Printf(`  {
    path: "/system/%s",
    name: "%s",
    component: lazy(() => import("../pages/%s")),
  },
`, ctx.RoutePath, ctx.TableComment, ctx.EntityName)
}

func buildTemplateContext(tbl *meta.TableMeta) *TemplateContext {
	var editable []meta.ColumnMeta
	var allUpdatable []meta.ColumnMeta
	searchCol := "id"

	for _, col := range tbl.Columns {
		if !col.IsPrimaryKey && !col.IsCommonField {
			editable = append(editable, col)
		}
		if !col.IsCommonField {
			allUpdatable = append(allUpdatable, col)
		}
		if searchCol == "id" && strings.Contains(strings.ToLower(col.ColumnName), "name") {
			searchCol = col.ColumnName
		}
	}
	if searchCol == "id" {
		for _, col := range tbl.Columns {
			if strings.Contains(strings.ToLower(col.ColumnName), "code") || col.TsType == "string" {
				searchCol = col.ColumnName
				break
			}
		}
	}

	return &TemplateContext{
		TableMeta:           tbl,
		EditableColumns:     editable,
		AllUpdatableColumns: allUpdatable,
		SearchColumn:        searchCol,
	}
}

func generateModel(config GeneratorConfig, ctx *TemplateContext) error {
	fmt.Println("  [1/5] 生成 Model 持久层代码 (Cache-Aside)...")
	modelDir := filepath.Join(config.OutputDir, "app", config.Service, "model")
	os.MkdirAll(modelDir, 0755)

	// 调用 goctl 生成标准 model
	cmd := exec.Command("goctl", "model", "mysql", "datasource",
		"-url", config.DSN,
		"-table", config.Table,
		"-dir", modelDir,
		"-c",
		"--style", "go_zero",
	)
	cmd.Dir = config.OutputDir
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("goctl model failed: %s (%w)", string(out), err)
	}

	// 渲染自定义分页扩展并写入主 model 文件
	tmplPath := filepath.Join(config.OutputDir, "hack", "generator", "templates", "model_custom.go.tmpl")
	tmplContent, err := os.ReadFile(tmplPath)
	if err != nil {
		return fmt.Errorf("read model_custom template: %w", err)
	}

	t, err := template.New("model_custom").Parse(string(tmplContent))
	if err != nil {
		return fmt.Errorf("parse model_custom template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, ctx); err != nil {
		return fmt.Errorf("render model_custom template: %w", err)
	}

	customFilePath := filepath.Join(modelDir, fmt.Sprintf("%s_model.go", config.Table))
	if err := os.WriteFile(customFilePath, buf.Bytes(), 0644); err != nil {
		return fmt.Errorf("write custom model file: %w", err)
	}
	_ = os.Remove(filepath.Join(modelDir, fmt.Sprintf("%s_model_custom.go", config.Table)))

	// 注入到微服务 servicecontext.go
	svcContextFile := filepath.Join(config.OutputDir, "app", config.Service, "rpc", "internal", "svc", "servicecontext.go")
	if data, err := os.ReadFile(svcContextFile); err == nil {
		content := string(data)
		modelField := fmt.Sprintf("%sModel", ctx.EntityName)
		if !strings.Contains(content, modelField) {
			// 在 ServiceContext struct 末尾注入字段
			structEnd := strings.Index(content, "}\n\nfunc NewServiceContext")
			if structEnd != -1 {
				fieldDef := fmt.Sprintf("\t%s model.%sModel\n", modelField, ctx.EntityName)
				content = content[:structEnd] + fieldDef + content[structEnd:]
			}
			// 在 NewServiceContext 初始化列表注入实例化
			initEnd := strings.LastIndex(content, "\t}\n}")
			if initEnd != -1 {
				initDef := fmt.Sprintf("\t\t%s: model.New%sModel(conn, c.Cache),\n", modelField, ctx.EntityName)
				content = content[:initEnd] + initDef + content[initEnd:]
			}
			os.WriteFile(svcContextFile, []byte(content), 0644)
		}
	}

	return nil
}

func updateProtoAndGenRpc(config GeneratorConfig, ctx *TemplateContext) error {
	fmt.Println("  [2/5] 追加微服务 Proto 契约与 RPC 桩代码...")
	protoPath := filepath.Join(config.OutputDir, "app", config.Service, "rpc", fmt.Sprintf("%s.proto", config.Service))
	contentBytes, err := os.ReadFile(protoPath)
	if err != nil {
		return fmt.Errorf("read proto file: %w", err)
	}
	content := string(contentBytes)

	// 检查是否已经包含该实体的声明
	msgCheck := fmt.Sprintf("message %sItem", ctx.EntityName)
	if !strings.Contains(content, msgCheck) {
		// 渲染 proto 消息
		tmplPath := filepath.Join(config.OutputDir, "hack", "generator", "templates", "proto_crud.tmpl")
		tmplBytes, err := os.ReadFile(tmplPath)
		if err != nil {
			return fmt.Errorf("read proto_crud template: %w", err)
		}

		funcMap := template.FuncMap{
			"inc": func(i int) int { return i + 1 },
		}
		t, err := template.New("proto_crud").Funcs(funcMap).Parse(string(tmplBytes))
		if err != nil {
			return fmt.Errorf("parse proto_crud template: %w", err)
		}

		var msgBuf bytes.Buffer
		if err := t.Execute(&msgBuf, ctx); err != nil {
			return fmt.Errorf("execute proto_crud template: %w", err)
		}

		// 注入 RPC 方法定义到 service 块前
		rpcMethods := fmt.Sprintf(`  // %s
  rpc List%ss(List%sRequest) returns (List%sResponse);
  rpc Get%s(IdRequest) returns (%sItem);
  rpc Create%s(Create%sRequest) returns (IdRequest);
  rpc Update%s(Update%sRequest) returns (EmptyResponse);
  rpc Delete%s(IdRequest) returns (EmptyResponse);
`, ctx.TableComment, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName, ctx.EntityName)

		lastBrace := strings.LastIndex(content, "}")
		if lastBrace != -1 {
			newProto := content[:lastBrace] + rpcMethods + content[lastBrace:] + "\n" + msgBuf.String()
			if err := os.WriteFile(protoPath, []byte(newProto), 0644); err != nil {
				return fmt.Errorf("write proto: %w", err)
			}
		}
	}

	// 触发 just gen-rpc
	if err := runCommand(config.OutputDir, "just", fmt.Sprintf("gen-rpc %s", config.Service)); err != nil {
		return err
	}

	// 实现 RPC Logic 真实增删改查
	writeRpcLogicFiles(config, ctx)

	return nil
}

func writeRpcLogicFiles(config GeneratorConfig, ctx *TemplateContext) {
	logicDir := filepath.Join(config.OutputDir, "app", config.Service, "rpc", "internal", "logic", strings.ToLower(config.Service))
	svcLower := strings.ToLower(config.Service)

	// 1. List
	var toPbFields []string
	for _, col := range ctx.Columns {
		if col.IsCommonField && (col.ColumnName == "create_time" || col.ColumnName == "update_time") {
			toPbFields = append(toPbFields, fmt.Sprintf("\t\t\t%s: item.%s.Format(\"2006-01-02 15:04:05\"),", col.GoField, col.GoField))
		} else {
			toPbFields = append(toPbFields, fmt.Sprintf("\t\t\t%s: item.%s,", col.GoField, col.GoField))
		}
	}
	toPbCode := strings.Join(toPbFields, "\n")

	listTmpl := `package {{ServiceLower}}logic

import (
	"context"

	"go-zero-boilerplate/app/{{Service}}/rpc/internal/svc"
	"go-zero-boilerplate/app/{{Service}}/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type List{{EntityName}}sLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewList{{EntityName}}sLogic(ctx context.Context, svcCtx *svc.ServiceContext) *List{{EntityName}}sLogic {
	return &List{{EntityName}}sLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *List{{EntityName}}sLogic) List{{EntityName}}s(in *pb.List{{EntityName}}Request) (*pb.List{{EntityName}}Response, error) {
	list, total, err := l.svcCtx.{{EntityName}}Model.FindPageList(l.ctx, in.Page, in.PageSize, in.Keyword)
	if err != nil {
		l.Errorf("FindPageList {{TableName}} err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	var pbList []*pb.{{EntityName}}Item
	for _, item := range list {
		pbList = append(pbList, &pb.{{EntityName}}Item{
{{ToPbCode}}
		})
	}

	return &pb.List{{EntityName}}Response{
		Total: total,
		List:  pbList,
	}, nil
}
`
	listCode := applyTokens(listTmpl, map[string]string{
		"{{ServiceLower}}": svcLower,
		"{{Service}}":      config.Service,
		"{{EntityName}}":   ctx.EntityName,
		"{{TableName}}":    ctx.TableName,
		"{{ToPbCode}}":     toPbCode,
	})
	listFile := filepath.Join(logicDir, fmt.Sprintf("list%sslogic.go", strings.ToLower(ctx.EntityName)))
	os.WriteFile(listFile, []byte(listCode), 0644)

	// 2. Get
	var getPbFields []string
	for _, col := range ctx.Columns {
		if col.IsCommonField && (col.ColumnName == "create_time" || col.ColumnName == "update_time") {
			getPbFields = append(getPbFields, fmt.Sprintf("\t\t%s: item.%s.Format(\"2006-01-02 15:04:05\"),", col.GoField, col.GoField))
		} else {
			getPbFields = append(getPbFields, fmt.Sprintf("\t\t%s: item.%s,", col.GoField, col.GoField))
		}
	}
	getPbCode := strings.Join(getPbFields, "\n")

	getTmpl := `package {{ServiceLower}}logic

import (
	"context"

	"go-zero-boilerplate/app/{{Service}}/rpc/internal/svc"
	"go-zero-boilerplate/app/{{Service}}/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type Get{{EntityName}}Logic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGet{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Get{{EntityName}}Logic {
	return &Get{{EntityName}}Logic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *Get{{EntityName}}Logic) Get{{EntityName}}(in *pb.IdRequest) (*pb.{{EntityName}}Item, error) {
	item, err := l.svcCtx.{{EntityName}}Model.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

	return &pb.{{EntityName}}Item{
{{GetPbCode}}
	}, nil
}
`
	getCode := applyTokens(getTmpl, map[string]string{
		"{{ServiceLower}}": svcLower,
		"{{Service}}":      config.Service,
		"{{EntityName}}":   ctx.EntityName,
		"{{GetPbCode}}":    getPbCode,
	})
	getFile := filepath.Join(logicDir, fmt.Sprintf("get%slogic.go", strings.ToLower(ctx.EntityName)))
	os.WriteFile(getFile, []byte(getCode), 0644)

	// 3. Create
	var insertFields []string
	for _, col := range ctx.EditableColumns {
		insertFields = append(insertFields, fmt.Sprintf("\t\t%s: in.%s,", col.GoField, col.GoField))
	}
	insertCode := strings.Join(insertFields, "\n")

	createTmpl := `package {{ServiceLower}}logic

import (
	"context"

	"go-zero-boilerplate/app/{{Service}}/model"
	"go-zero-boilerplate/app/{{Service}}/rpc/internal/svc"
	"go-zero-boilerplate/app/{{Service}}/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type Create{{EntityName}}Logic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreate{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Create{{EntityName}}Logic {
	return &Create{{EntityName}}Logic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *Create{{EntityName}}Logic) Create{{EntityName}}(in *pb.Create{{EntityName}}Request) (*pb.IdRequest, error) {
	item := &model.{{EntityName}}{
{{InsertCode}}
	}

	res, err := l.svcCtx.{{EntityName}}Model.Insert(l.ctx, item)
	if err != nil {
		l.Errorf("Insert {{TableName}} err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	newId, _ := res.LastInsertId()
	return &pb.IdRequest{Id: newId}, nil
}
`
	createLogicCode := applyTokens(createTmpl, map[string]string{
		"{{ServiceLower}}": svcLower,
		"{{Service}}":      config.Service,
		"{{EntityName}}":   ctx.EntityName,
		"{{TableName}}":    ctx.TableName,
		"{{InsertCode}}":   insertCode,
	})
	createFile := filepath.Join(logicDir, fmt.Sprintf("create%slogic.go", strings.ToLower(ctx.EntityName)))
	os.WriteFile(createFile, []byte(createLogicCode), 0644)

	// 4. Update
	var updateAssigns []string
	for _, col := range ctx.EditableColumns {
		updateAssigns = append(updateAssigns, fmt.Sprintf("\titem.%s = in.%s", col.GoField, col.GoField))
	}
	updateCode := strings.Join(updateAssigns, "\n")

	updateTmpl := `package {{ServiceLower}}logic

import (
	"context"

	"go-zero-boilerplate/app/{{Service}}/rpc/internal/svc"
	"go-zero-boilerplate/app/{{Service}}/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type Update{{EntityName}}Logic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewUpdate{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Update{{EntityName}}Logic {
	return &Update{{EntityName}}Logic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *Update{{EntityName}}Logic) Update{{EntityName}}(in *pb.Update{{EntityName}}Request) (*pb.EmptyResponse, error) {
	item, err := l.svcCtx.{{EntityName}}Model.FindOne(l.ctx, in.Id)
	if err != nil {
		return nil, xerr.NewErrCode(xerr.RecordNotFound)
	}

{{UpdateCode}}

	err = l.svcCtx.{{EntityName}}Model.Update(l.ctx, item)
	if err != nil {
		l.Errorf("Update {{TableName}} err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}

	return &pb.EmptyResponse{}, nil
}
`
	updateLogicCode := applyTokens(updateTmpl, map[string]string{
		"{{ServiceLower}}": svcLower,
		"{{Service}}":      config.Service,
		"{{EntityName}}":   ctx.EntityName,
		"{{TableName}}":    ctx.TableName,
		"{{UpdateCode}}":   updateCode,
	})
	updateFile := filepath.Join(logicDir, fmt.Sprintf("update%slogic.go", strings.ToLower(ctx.EntityName)))
	os.WriteFile(updateFile, []byte(updateLogicCode), 0644)

	// 5. Delete
	deleteTmpl := `package {{ServiceLower}}logic

import (
	"context"

	"go-zero-boilerplate/app/{{Service}}/rpc/internal/svc"
	"go-zero-boilerplate/app/{{Service}}/rpc/pb"
	"go-zero-boilerplate/pkg/xerr"

	"github.com/zeromicro/go-zero/core/logx"
)

type Delete{{EntityName}}Logic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewDelete{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Delete{{EntityName}}Logic {
	return &Delete{{EntityName}}Logic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *Delete{{EntityName}}Logic) Delete{{EntityName}}(in *pb.IdRequest) (*pb.EmptyResponse, error) {
	err := l.svcCtx.{{EntityName}}Model.Delete(l.ctx, in.Id)
	if err != nil {
		l.Errorf("Delete {{TableName}} err: %v", err)
		return nil, xerr.NewErrCode(xerr.DbError)
	}
	return &pb.EmptyResponse{}, nil
}
`
	deleteLogicCode := applyTokens(deleteTmpl, map[string]string{
		"{{ServiceLower}}": svcLower,
		"{{Service}}":      config.Service,
		"{{EntityName}}":   ctx.EntityName,
		"{{TableName}}":    ctx.TableName,
	})
	deleteFile := filepath.Join(logicDir, fmt.Sprintf("delete%slogic.go", strings.ToLower(ctx.EntityName)))
	os.WriteFile(deleteFile, []byte(deleteLogicCode), 0644)
}

func updateGatewayApiAndGen(config GeneratorConfig, ctx *TemplateContext) error {
	fmt.Println("  [3/5] 追加网关 API 契约与 BFF 路由...")
	apiPath := filepath.Join(config.OutputDir, "app", "gateway", "desc", fmt.Sprintf("%s.api", config.Service))
	contentBytes, err := os.ReadFile(apiPath)
	if err != nil {
		return fmt.Errorf("read gateway api file: %w", err)
	}
	content := string(contentBytes)

	// 检查是否已经存在
	typeCheck := fmt.Sprintf("%sItem", ctx.EntityName)
	if !strings.Contains(content, typeCheck) {
		tmplPath := filepath.Join(config.OutputDir, "hack", "generator", "templates", "gateway_api.tmpl")
		tmplBytes, err := os.ReadFile(tmplPath)
		if err != nil {
			return fmt.Errorf("read gateway_api template: %w", err)
		}

		t, err := template.New("gateway_api").Parse(string(tmplBytes))
		if err != nil {
			return fmt.Errorf("parse gateway_api template: %w", err)
		}

		var apiBuf bytes.Buffer
		if err := t.Execute(&apiBuf, ctx); err != nil {
			return fmt.Errorf("execute gateway_api template: %w", err)
		}

		newContent := content + "\n\n" + apiBuf.String()
		if err := os.WriteFile(apiPath, []byte(newContent), 0644); err != nil {
			return fmt.Errorf("write gateway api: %w", err)
		}
	}

	// 触发 just gen-gateway
	if err := runCommand(config.OutputDir, "just", "gen-gateway"); err != nil {
		return err
	}

	// 标准化生成的网关 Handler (使用 result.HttpResult)
	standardizeGatewayHandlers(config, ctx)

	// 生成网关 BFF Logic 实现代码
	writeGatewayLogicFiles(config, ctx)

	return nil
}

func standardizeGatewayHandlers(config GeneratorConfig, ctx *TemplateContext) {
	handlerDir := filepath.Join(config.OutputDir, "app", "gateway", "internal", "handler", ctx.EntitySnake)
	if _, err := os.Stat(handlerDir); os.IsNotExist(err) {
		handlerDir = filepath.Join(config.OutputDir, "app", "gateway", "internal", "handler", ctx.EntityLower)
	}
	entries, err := os.ReadDir(handlerDir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".go") {
			continue
		}
		p := filepath.Join(handlerDir, entry.Name())
		data, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		c := string(data)
		c = strings.ReplaceAll(c, "httpx.ErrorCtx(r.Context(), w, err)\n\t\t\treturn", "result.ParamErrorResult(r, w, err)\n\t\t\treturn")
		c = strings.ReplaceAll(c, "httpx.ErrorCtx(r.Context(), w, err)\r\n\t\t\treturn", "result.ParamErrorResult(r, w, err)\r\n\t\t\treturn")
		
		// 替换 OkJson
		oldRespPattern1 := `if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}`
		oldRespPattern2 := strings.ReplaceAll(oldRespPattern1, "\n", "\r\n")
		c = strings.ReplaceAll(c, oldRespPattern1, "result.HttpResult(r, w, resp, err)")
		c = strings.ReplaceAll(c, oldRespPattern2, "result.HttpResult(r, w, resp, err)")

		// 确保 import 了 result 包
		if !strings.Contains(c, "go-zero-boilerplate/pkg/result") {
			c = strings.Replace(c, `"github.com/zeromicro/go-zero/rest/httpx"`, `"go-zero-boilerplate/pkg/result"`+"\n\t"+`"github.com/zeromicro/go-zero/rest/httpx"`, 1)
		}

		os.WriteFile(p, []byte(c), 0644)
	}
}

func writeGatewayLogicFiles(config GeneratorConfig, ctx *TemplateContext) {
	logicDir := filepath.Join(config.OutputDir, "app", "gateway", "internal", "logic", ctx.EntitySnake)
	if _, err := os.Stat(logicDir); os.IsNotExist(err) {
		logicDir = filepath.Join(config.OutputDir, "app", "gateway", "internal", "logic", strings.ToLower(ctx.EntityName))
	}
	_ = os.MkdirAll(logicDir, 0755)

	pkgName := filepath.Base(logicDir)
	rpcClientName := meta.ToPascalCase(config.Service) + "Rpc"
	clientPkg := fmt.Sprintf("%sClient", strings.ToLower(config.Service))
	clientImport := fmt.Sprintf("go-zero-boilerplate/app/%s/rpc/client/%s", config.Service, strings.ToLower(config.Service))

	// 1. List
	var toTypeFields []string
	for _, col := range ctx.Columns {
		if col.GoType == "int" {
			toTypeFields = append(toTypeFields, fmt.Sprintf("\t\t\t%s: int(item.%s),", col.GoField, col.GoField))
		} else {
			toTypeFields = append(toTypeFields, fmt.Sprintf("\t\t\t%s: item.%s,", col.GoField, col.GoField))
		}
	}
	toTypeCode := strings.Join(toTypeFields, "\n")

	listTmpl := `package {{PkgName}}

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	{{ClientPkg}} "{{ClientImport}}"

	"github.com/zeromicro/go-zero/core/logx"
)

type List{{EntityName}}Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewList{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *List{{EntityName}}Logic {
	return &List{{EntityName}}Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *List{{EntityName}}Logic) List{{EntityName}}(req *types.List{{EntityName}}Req) (resp *types.List{{EntityName}}Resp, err error) {
	rpcResp, err := l.svcCtx.{{RpcClientName}}.List{{EntityName}}s(l.ctx, &{{ClientPkg}}.List{{EntityName}}Request{
		Page:     int64(req.Page),
		PageSize: int64(req.PageSize),
		Keyword:  req.Keyword,
	})
	if err != nil {
		return nil, err
	}

	var list []*types.{{EntityName}}Item
	for _, item := range rpcResp.List {
		list = append(list, &types.{{EntityName}}Item{
{{ToTypeCode}}
		})
	}

	return &types.List{{EntityName}}Resp{
		Total: rpcResp.Total,
		List:  list,
	}, nil
}
`
	listCode := applyTokens(listTmpl, map[string]string{
		"{{PkgName}}":       pkgName,
		"{{ClientPkg}}":     clientPkg,
		"{{ClientImport}}":  clientImport,
		"{{EntityName}}":    ctx.EntityName,
		"{{RpcClientName}}": rpcClientName,
		"{{ToTypeCode}}":    toTypeCode,
	})
	listFile := filepath.Join(logicDir, fmt.Sprintf("list_%s_logic.go", ctx.EntitySnake))
	os.WriteFile(listFile, []byte(listCode), 0644)

	// 2. Get
	var getTypeFields []string
	for _, col := range ctx.Columns {
		if col.GoType == "int" {
			getTypeFields = append(getTypeFields, fmt.Sprintf("\t\t%s: int(rpcResp.%s),", col.GoField, col.GoField))
		} else {
			getTypeFields = append(getTypeFields, fmt.Sprintf("\t\t%s: rpcResp.%s,", col.GoField, col.GoField))
		}
	}
	getTypeCode := strings.Join(getTypeFields, "\n")

	getTmpl := `package {{PkgName}}

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	{{ClientPkg}} "{{ClientImport}}"

	"github.com/zeromicro/go-zero/core/logx"
)

type Get{{EntityName}}Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGet{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Get{{EntityName}}Logic {
	return &Get{{EntityName}}Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *Get{{EntityName}}Logic) Get{{EntityName}}(req *types.SysIdReq) (resp *types.{{EntityName}}Item, err error) {
	rpcResp, err := l.svcCtx.{{RpcClientName}}.Get{{EntityName}}(l.ctx, &{{ClientPkg}}.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.{{EntityName}}Item{
{{GetTypeCode}}
	}, nil
}
`
	getCode := applyTokens(getTmpl, map[string]string{
		"{{PkgName}}":       pkgName,
		"{{ClientPkg}}":     clientPkg,
		"{{ClientImport}}":  clientImport,
		"{{EntityName}}":    ctx.EntityName,
		"{{RpcClientName}}": rpcClientName,
		"{{GetTypeCode}}":   getTypeCode,
	})
	getFile := filepath.Join(logicDir, fmt.Sprintf("get_%s_logic.go", ctx.EntitySnake))
	os.WriteFile(getFile, []byte(getCode), 0644)

	// 3. Create
	var createRpcFields []string
	for _, col := range ctx.EditableColumns {
		if col.GoType == "int" {
			createRpcFields = append(createRpcFields, fmt.Sprintf("\t\t%s: int64(req.%s),", col.GoField, col.GoField))
		} else {
			createRpcFields = append(createRpcFields, fmt.Sprintf("\t\t%s: req.%s,", col.GoField, col.GoField))
		}
	}
	createRpcCode := strings.Join(createRpcFields, "\n")

	createTmpl := `package {{PkgName}}

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	{{ClientPkg}} "{{ClientImport}}"

	"github.com/zeromicro/go-zero/core/logx"
)

type Create{{EntityName}}Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreate{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Create{{EntityName}}Logic {
	return &Create{{EntityName}}Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *Create{{EntityName}}Logic) Create{{EntityName}}(req *types.Create{{EntityName}}Req) (resp *types.SysIdResp, err error) {
	rpcResp, err := l.svcCtx.{{RpcClientName}}.Create{{EntityName}}(l.ctx, &{{ClientPkg}}.Create{{EntityName}}Request{
{{CreateRpcCode}}
	})
	if err != nil {
		return nil, err
	}

	return &types.SysIdResp{
		Id: rpcResp.Id,
	}, nil
}
`
	createCode := applyTokens(createTmpl, map[string]string{
		"{{PkgName}}":       pkgName,
		"{{ClientPkg}}":     clientPkg,
		"{{ClientImport}}":  clientImport,
		"{{EntityName}}":    ctx.EntityName,
		"{{RpcClientName}}": rpcClientName,
		"{{CreateRpcCode}}": createRpcCode,
	})
	createFile := filepath.Join(logicDir, fmt.Sprintf("create_%s_logic.go", ctx.EntitySnake))
	os.WriteFile(createFile, []byte(createCode), 0644)

	// 4. Update
	var updateRpcFields []string
	for _, col := range ctx.AllUpdatableColumns {
		if col.GoType == "int" {
			updateRpcFields = append(updateRpcFields, fmt.Sprintf("\t\t%s: int64(req.%s),", col.GoField, col.GoField))
		} else {
			updateRpcFields = append(updateRpcFields, fmt.Sprintf("\t\t%s: req.%s,", col.GoField, col.GoField))
		}
	}
	updateRpcCode := strings.Join(updateRpcFields, "\n")

	updateTmpl := `package {{PkgName}}

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	{{ClientPkg}} "{{ClientImport}}"

	"github.com/zeromicro/go-zero/core/logx"
)

type Update{{EntityName}}Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdate{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Update{{EntityName}}Logic {
	return &Update{{EntityName}}Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *Update{{EntityName}}Logic) Update{{EntityName}}(req *types.Update{{EntityName}}Req) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.{{RpcClientName}}.Update{{EntityName}}(l.ctx, &{{ClientPkg}}.Update{{EntityName}}Request{
{{UpdateRpcCode}}
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
`
	updateCode := applyTokens(updateTmpl, map[string]string{
		"{{PkgName}}":       pkgName,
		"{{ClientPkg}}":     clientPkg,
		"{{ClientImport}}":  clientImport,
		"{{EntityName}}":    ctx.EntityName,
		"{{RpcClientName}}": rpcClientName,
		"{{UpdateRpcCode}}": updateRpcCode,
	})
	updateFile := filepath.Join(logicDir, fmt.Sprintf("update_%s_logic.go", ctx.EntitySnake))
	os.WriteFile(updateFile, []byte(updateCode), 0644)

	// 5. Delete
	deleteTmpl := `package {{PkgName}}

import (
	"context"

	"go-zero-boilerplate/app/gateway/internal/svc"
	"go-zero-boilerplate/app/gateway/internal/types"
	{{ClientPkg}} "{{ClientImport}}"

	"github.com/zeromicro/go-zero/core/logx"
)

type Delete{{EntityName}}Logic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDelete{{EntityName}}Logic(ctx context.Context, svcCtx *svc.ServiceContext) *Delete{{EntityName}}Logic {
	return &Delete{{EntityName}}Logic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *Delete{{EntityName}}Logic) Delete{{EntityName}}(req *types.SysIdReq) (resp *types.SysEmptyResp, err error) {
	_, err = l.svcCtx.{{RpcClientName}}.Delete{{EntityName}}(l.ctx, &{{ClientPkg}}.IdRequest{
		Id: req.Id,
	})
	if err != nil {
		return nil, err
	}

	return &types.SysEmptyResp{}, nil
}
`
	deleteCode := applyTokens(deleteTmpl, map[string]string{
		"{{PkgName}}":       pkgName,
		"{{ClientPkg}}":     clientPkg,
		"{{ClientImport}}":  clientImport,
		"{{EntityName}}":    ctx.EntityName,
		"{{RpcClientName}}": rpcClientName,
	})
	deleteFile := filepath.Join(logicDir, fmt.Sprintf("delete_%s_logic.go", ctx.EntitySnake))
	os.WriteFile(deleteFile, []byte(deleteCode), 0644)
}

func applyTokens(tmpl string, tokens map[string]string) string {
	res := tmpl
	for k, v := range tokens {
		res = strings.ReplaceAll(res, k, v)
	}
	return res
}

func generateFrontendPage(config GeneratorConfig, ctx *TemplateContext) error {
	pageDir := filepath.Join(config.OutputDir, "frontend", "apps", "admin", "src", "pages", ctx.EntityName)
	os.MkdirAll(pageDir, 0755)

	tmplPath := filepath.Join(config.OutputDir, "hack", "generator", "templates", "frontend_protable.tsx.tmpl")
	tmplBytes, err := os.ReadFile(tmplPath)
	if err != nil {
		return fmt.Errorf("read frontend_protable template: %w", err)
	}

	t, err := template.New("frontend_protable").Parse(string(tmplBytes))
	if err != nil {
		return fmt.Errorf("parse frontend_protable template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, ctx); err != nil {
		return fmt.Errorf("execute frontend_protable template: %w", err)
	}

	pageFile := filepath.Join(pageDir, "index.tsx")
	if err := os.WriteFile(pageFile, buf.Bytes(), 0644); err != nil {
		return fmt.Errorf("write frontend page file: %w", err)
	}

	// 自动在 routes.ts 中注册路由
	registerRouteInAdmin(config, ctx)

	return nil
}

func registerRouteInAdmin(config GeneratorConfig, ctx *TemplateContext) {
	routeFile := filepath.Join(config.OutputDir, "frontend", "apps", "admin", "src", "config", "routes.ts")
	data, err := os.ReadFile(routeFile)
	if err != nil {
		return
	}
	content := string(data)
	routePath := fmt.Sprintf("/system/%s", ctx.RoutePath)
	if strings.Contains(content, routePath) {
		return
	}

	target := "path: \"/system/openapi\","
	idx := strings.Index(content, target)
	if idx == -1 {
		return
	}

	closeIdx := strings.Index(content[idx:], "},")
	if closeIdx == -1 {
		return
	}
	insertPos := idx + closeIdx + 2

	newRoute := fmt.Sprintf(`
          {
            path: "%s",
            name: "%s",
            locale: "menu.system.%s",
            icon: "ClusterOutlined",
            component: lazy(() => import("../pages/%s")),
          },`, routePath, ctx.TableComment, strings.ToLower(ctx.EntityName), ctx.EntityName)

	content = content[:insertPos] + newRoute + content[insertPos:]
	_ = os.WriteFile(routeFile, []byte(content), 0644)
	fmt.Printf("  [+] 已自动将路由 %s 挂载至 routes.ts\n", routePath)
}

func runCommand(dir string, name string, args ...string) error {
	var realArgs []string
	for _, arg := range args {
		realArgs = append(realArgs, strings.Fields(arg)...)
	}
	cmd := exec.Command(name, realArgs...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s %v failed: %s (%w)", name, realArgs, string(out), err)
	}
	return nil
}
