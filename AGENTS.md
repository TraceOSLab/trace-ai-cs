# AGENTS.md — Trace AI CS

## 项目概览

**Trace AI CS** — 基于火山引擎 RTC 的实时对话式 AI 系统，支持接入第三方大模型（OpenAI 兼容接口）。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Vite 6, Redux Toolkit, Arco Design 2.x, Less |
| 后端 | Python 3.11+, FastAPI, httpx, Pydantic, python-dotenv |
| RTC | @volcengine/rtc 4.66.x |
| LLM | OpenAI 兼容 API（通过 CustomLLM 回调桥接） |
| 包管理 | pnpm (monorepo) |

### 项目结构

```
trace-ai-cs/
├── client/          # 前端 (React + Vite)     package: @trace-ai-cs/client
├── server/          # 后端 (Python + FastAPI)  package: @trace-ai-cs/server
├── .env             # 账号凭证 (gitignore)
├── .env.example     # 凭证模板 (git跟踪)
├── package.json     # 根 workspace
├── pnpm-workspace.yaml
└── scripts/         # 脚本 (空)
```

### 启动命令

```bash
# 安装依赖
pnpm install

# 创建 Python 虚拟环境
python3 -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt

# 启动 (全部)
pnpm dev

# 或分别启动
pnpm dev:client    # 前端 :3000
pnpm dev:server    # 后端 :3001
```

### 配置

1. `cp .env.example .env` 填入火山引擎凭证
2. `cp server/scenes/Custom.example.json server/scenes/Custom.json` 填入 RTC AppId/AppKey
3. 修改 `server/services/llm_channel.py` 中的 `_LLM_CONFIG` 来切换 LLM 模型

### 环境变量

在 `.env` 中配置 (`.env.example` 为模板):

| 变量 | 说明 |
|------|------|
| `VOLC_ACCESS_KEY_ID` | 火山引擎 AccessKey (账号) |
| `VOLC_SECRET_KEY` | 火山引擎 SecretKey (账号) |
| `CUSTOMLLM_CALLBACK_URL` | CustomLLM 回调公网地址 (ngrok 等) |

场景 JSON 文件中使用 `${VAR_NAME}` 引用环境变量。

### 关键文件 (修改最频繁)

| 文件 | 用途 |
|------|------|
| `server/services/llm_channel.py` | LLM 渠道配置 (模型/API Key/Base URL) |
| `server/scenes/Custom.json` | 场景配置 (ASR/TTS/RTC) |
| `.env` | 账号凭证 |
| `client/src/config/index.ts` | 前端后端地址 |

### 编码约定

- Python: FastAPI 标准结构 (routers → services → schemas)，Pydantic v2
- 前端: Redux Toolkit + hooks，API 层 `client/src/api/`，组件按 `pages/` 和 `components/` 分层
- 命名: 文件名 snake_case (Python) / PascalCase (React组件)，变量 camelCase
- 场景 JSON: `${VAR}` 环境变量插值通过 `server/util.py::interpolate_env`
- 无数据库: 当前所有状态在内存和 sessionStorage 中

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/getScenes` | 获取场景列表 + RTC Token |
| POST | `/proxy?Action=StartVoiceChat` | 启动 AI 对话 |
| POST | `/proxy?Action=StopVoiceChat` | 停止 AI 对话 |
| POST | `/llm/callback` | CustomLLM 回调接口 (SSE 流式) |

交互式文档: 启动后端后访问 `http://localhost:3001/docs`

### Demo 参考

本项目基于 `rtc-aigc-demo` 参考实现。

### 当前版本

1.1.0 — 基础实时对话 AI，支持 CustomLLM 桥接第三方模型。
