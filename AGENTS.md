# AGENTS.md — Trace AI CS

Agent 打开本项目的**第一份必读文件**。下面是操作手册，不是参考手册。

---

## 1. 文档索引

按需阅读，不是一次全读。

| 阶段 | 必读 | 按需查阅 |
|------|------|---------|
| 首次上手 | `docs/DEVELOPMENT.md`（环境搭建） | `docs/GLOSSARY.md`（看不懂术语时） |
| 开发功能 | `docs/ARCHITECTURE.md`（架构） | `docs/CONFIGURATION.md`（涉及配置时）<br>`docs/DATABASE.md`（涉及存储时）<br>`docs/TESTING.md`（涉及测试时） |
| 收尾 | `CONTRIBUTING.md`（规范检查） | `CHANGELOG.md`（写变更记录） |

**不要**从头到尾读所有文档。先读对应阶段的必读项，遇到具体问题再查按需项。

`docs/PROJECT.md` 和 `README.md` 是给人看的项目概览，Agent 不需要依赖它们。

---

## 2. 功能开发流程

用户说"开发新功能 / 加一个 XX / 实现 XX"时，按以下步骤执行。

### 2.1 创建分支

```bash
git checkout -b feature/<功能简述>
```

分支名用英文小写+连字符，如 `feature/add-rag-search`、`feature/user-login`。

如果当前分支已有未提交改动，先和用户确认是否 stash 或 commit。

### 2.2 阅读理解

按文档索引，阅读当前功能相关的必读项和按需项。**读完再写代码**。

涉及后端：先读 `docs/ARCHITECTURE.md` 中"后端架构"部分，理解 routers → services → schemas 分层。
涉及前端：先读 `docs/ARCHITECTURE.md` 中"前端架构"部分，理解 Redux Store + Hooks 结构。

### 2.3 阅读相关源码

找到功能要修改的模块，通读现有代码。遵循现有模式，不要另起炉灶。

### 2.4 实现

遵循 `CONTRIBUTING.md` 中的代码规范：
- Python: routers 不写业务逻辑，services 不操作请求响应
- 前端: 组件 Props 必须有 interface，API 调用统一走 `client/src/api/`
- 日志用 `logging.getLogger(__name__)`（Python）或 `@/utils/logger`（前端），不用 `print` / `console.log`

### 2.5 验证

```bash
# 后端：确认模块可导入
cd trace-ai-cs && source .venv/bin/activate && python -c "from server.app import app"

# 前端：确认类型检查通过
cd client && npx tsc --noEmit
```

详细验证清单见 `docs/DEVELOPMENT.md` 末尾"收尾验证"章节。

---

## 3. 收尾流程

功能开发完成，用户说"收尾 / 完成 / wrap up / 提交"时，按以下步骤执行。

### 3.1 代码验证

```bash
# 后端导入验证
cd trace-ai-cs && source .venv/bin/activate && python -c "from server.app import app"

# 前端类型检查
cd client && npx tsc --noEmit
```

如果不通过，修复后再继续。

### 3.2 更新 CHANGELOG.md

在 `CHANGELOG.md` 顶部添加本次变更条目。按 `新增 / 变更 / 修复` 分类，格式参考现有条目。

如果当前没有版本号变更，在 `[Unreleased]` 标题下记录。

### 3.3 更新受影响的文档

对照 `CONTRIBUTING.md` 中的"文档更新"表格，检查本次改动是否需要更新对应文档：

- 新增/修改接口 → 更新 `AGENTS.md` 的 API 表格、`docs/ARCHITECTURE.md`
- 新增/修改配置项 → 更新 `docs/CONFIGURATION.md`
- 新增依赖 → 更新 `AGENTS.md` 技术栈、`docs/PROJECT.md`
- Redux 状态变更 → 更新 `docs/ARCHITECTURE.md` 中 Redux 结构
- 新概念 → 更新 `docs/GLOSSARY.md`

### 3.4 Git 提交

```bash
git add <改动的文件>
git commit -m "<type>(<scope>): <描述>"
```

Commit message 遵循 Conventional Commits：`feat(server): add /rag/search endpoint`。

type: `feat` / `fix` / `docs` / `refactor` / `chore` / `style` / `test`  
scope: `server` / `client` / `docs` / `root`

### 3.5 向用户报告

报告内容：
- 本次改动的文件清单
- 变更摘要（1-2 句话）
- 验证结果（通过/失败）
- 文档更新情况
- 是否建议推送/合并

---

## 4. 快速参考

### 常用命令

```bash
# 启动开发
pnpm dev                          # 前后端同时
pnpm dev:client                   # 仅前端 :3000
pnpm dev:server                   # 仅后端 :3001

# 验证
cd client && npx tsc --noEmit     # 前端类型检查
python -c "from server.app import app"  # 后端导入检查

# 构建
pnpm build                        # 前端生产构建 → client/dist/

# 虚拟环境
source .venv/bin/activate         # 激活
deactivate                        # 退出
```

### 项目入口文件

| 端 | 入口 | 说明 |
|----|------|------|
| 后端 | `server/app.py` | FastAPI 应用创建、路由注册、场景加载 |
| 前端 | `client/src/main.tsx` | React 挂载 |
| 前端路由 | `client/src/App.tsx` | `/` → MainPage |
| 前端状态 | `client/src/store/slices/room.ts` | 房间状态 Redux Slice |

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/getScenes` | 获取场景列表 + RTC Token |
| POST | `/proxy?Action=StartVoiceChat` | 开启 AI 对话 |
| POST | `/proxy?Action=StopVoiceChat` | 停止 AI 对话 |
| POST | `/llm/callback` | CustomLLM 回调 (SSE 流式) |

调试接口：`http://localhost:3001/docs` (Swagger UI)

### 技术栈速览

| 层 | 技术 |
|----|------|
| 前端 | React 18, TypeScript 5.6, Vite 6, Redux Toolkit 2.5, Arco Design 2.65 |
| 后端 | Python 3.11+, FastAPI 0.115, httpx 0.28, Pydantic 2.10 |
| RTC | @volcengine/rtc 4.66 |
| LLM | OpenAI 兼容 API (CustomLLM 回调桥接) |
