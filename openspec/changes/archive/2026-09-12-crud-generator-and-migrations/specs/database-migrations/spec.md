## Purpose

提供版本化、可追踪、支持正向升级与反向回滚的数据库 Schema 增量迁移流水线，消除多环境数据结构漂移风险。

## ADDED Requirements

### Requirement: 增量版本化迁移文件创建
迁移工作流 SHALL 支持通过命令行快速创建带有毫秒级时间戳的迁移文件（如 `YYYYMMDDHHMMSS_<name>.sql`），区分 UP（升级）与 DOWN（回滚）执行逻辑。

#### Scenario: 成功创建迁移文件
- **WHEN** 开发者运行 `just migrate-new create_sys_notice_table`
- **THEN** 系统在 `manifest/sql/migrations/` 下创建带有时间戳的空迁移文件模板并就绪

### Requirement: 数据库正向迁移与回滚控制
迁移工作流 SHALL 能够读取未应用的迁移文件按顺序在目标数据库执行，并支持安全执行指定版本的反向回滚操作。

#### Scenario: 执行正向版本升级
- **WHEN** 开发者运行 `just migrate-up`
- **THEN** 系统对目标数据库中尚未应用的迁移脚本依次执行，记录版本迁移状态，并输出执行日志

#### Scenario: 执行反向版本回滚
- **WHEN** 开发者运行 `just migrate-down`
- **THEN** 系统回退最后一个已应用的迁移版本，并同步更新版本记录表

### Requirement: 迁移版本状态查询与环境基线兼容
迁移工作流 SHALL 能够输出当前数据库已应用与待应用的迁移版本清单，并提供当前全量 `init.sql` 的基线版本化支持。

#### Scenario: 查询迁移同步状态
- **WHEN** 开发者运行 `just migrate-status`
- **THEN** 系统展示当前已执行与待执行的迁移版本列表、执行耗时与完成时间戳
