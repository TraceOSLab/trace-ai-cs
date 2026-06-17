# CONTRIBUTING.md — 贡献指南

本项目主要用于 AI Agent 辅助开发。以下规范确保多人/多 Agent 协作时代码一致性。

## 分支策略

```
main          ← 稳定版本，随时可部署
  └─ codex/<描述>  ← 功能分支 (前缀 codex/)
```

- 从 `main` 创建功能分支: `git checkout -b codex/add-rag-search`
- 完成后合并回 `main`

## Commit 规范

```
<type>(<scope>): <简短描述>
```

**type 取值**:

| type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(server): add /rag/search endpoint` |
| `fix` | Bug 修复 | `fix(client): resolve token error on join` |
| `docs` | 文档更新 | `docs: add configuration guide` |
| `refactor` | 重构 (不改行为) | `refactor(server): rename token.py → rtc_token.py` |
| `chore` | 杂项 (依赖/构建等) | `chore: update pnpm to 9.x` |
| `style` | 格式调整 | `style(client): format with prettier` |
| `test` | 测试 | `test(server): add scene service unit tests` |

**scope 取值**: `server` / `client` / `docs` / `root` (根配置) / 省略 (全局)

## 代码规范

### Python (`server/`)

- 遵循 PEP 8
- **类型注解**: 所有函数签名必须有参数类型和返回类型
- 使用 Pydantic v2 语法 (`.model_dump()` 不是 `.dict()`)
- 日志: `logging.getLogger(__name__)`，不使用 `print()`
- 路由层不写业务逻辑，services 不操作请求/响应对象
- 文件命名: snake_case

### TypeScript / React (`client/`)

- **组件 Props**: 必须定义 interface (如 `interface IAudioLoadingProps`)
- 避免 `any`，优先使用 `unknown` + 类型守卫
- Redux 状态通过 action 修改，不直接 mutate
- 组件文件 PascalCase，工具文件 camelCase
- API 调用统一通过 `client/src/api/` 层

### 通用

- 删除代码同时删除对应的 import (ESLint 未配置 `no-unused-vars`，需手动注意)
- 文件名不含空格或特殊字符
- 不要引入仅使用一次的抽象层

## Pull Request 流程

1. 在 `codex/<描述>` 分支上开发
2. 确保前端 `tsc --noEmit` 和后端 `python -c "from server.app import app"` 均通过
3. 创建 PR，描述做了什么、为什么这样做、测试方式
4. 合并后删除特性分支

## 文档更新

如果改动涉及以下内容，必须同步更新对应文档：

| 改动 | 需更新的文档 |
|------|------------|
| 新增接口 | `AGENTS.md` API 表格, `server/README.md`, `docs/ARCHITECTURE.md` |
| 新配置项 | `docs/CONFIGURATION.md` |
| 新增依赖 | `AGENTS.md` 技术栈表, `docs/PROJECT.md` |
| 状态管理变更 | `docs/ARCHITECTURE.md` Redux 结构 |
| 新的领域概念 | `docs/GLOSSARY.md` |
| 版本发布 | `CHANGELOG.md` |

## .gitignore 规则

以下文件**绝对不能提交**:

- `.env` — 账号凭证
- `server/scenes/*.json` (除 `*.example.json`)
- `node_modules/`, `.venv/`, `dist/`, `__pycache__/`
- `.DS_Store`
