## ADDED Requirements

### Requirement: Atlas 迁移目录完整性
迁移目录中所有迁移文件 SHALL 被 `atlas.sum` 校验和清单完整收录；新增或修改迁移文件后 SHALL 同步重新生成校验和清单，且 CI SHALL 强制校验目录与清单一致性，不一致时构建失败。

#### Scenario: 新迁移未收录清单时构建失败
- **WHEN** 开发者新增迁移文件但未重新生成 `atlas.sum` 即提交，CI 执行迁移目录校验
- **THEN** 校验失败，构建被阻止并提示需重新生成校验和清单

#### Scenario: 修复后迁移链可应用
- **WHEN** 迁移目录与 `atlas.sum` 一致，在全新环境执行迁移应用命令
- **THEN** 全部迁移（含 Titan 表结构）按顺序成功应用，无校验和错误
