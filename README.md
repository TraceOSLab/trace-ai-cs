# Trace AI Conversational System

基于火山引擎 RTC 的实时对话式 AI 系统，支持接入第三方大模型（OpenAI / DeepSeek 等）。

## 特性

- 实时语音对话 AI（WebRTC 低延迟）
- 第三方大模型接入（CustomLLM 回调 → OpenAI 兼容 API）
- 语音打断、字幕、AI 降噪
- 视频通话 / 屏幕共享 / 数字人
- 多场景 JSON 配置

## 文档导航

| 文档 | 说明 |
|------|------|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 环境搭建 + 开发指南 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术架构细节 |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | 配置参考（.env / 场景 JSON / LLM） |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | 领域术语 |
| [AGENTS.md](AGENTS.md) | AI Agent 操作手册 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 代码规范 + Git 约定 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |

接口文档：启动后端后访问 `http://localhost:3001/docs` (Swagger)

## 快速开始

```bash
# 1. 安装依赖
pnpm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r server/requirements.txt

# 2. 配置
cp .env.example .env              # 填入火山引擎凭证
cp server/scenes/Custom.example.json server/scenes/Custom.json  # 填入 RTC 配置

# 3. 启动
pnpm dev                          # 前端 :3000 + 后端 :3001
```

详细步骤见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

## 项目结构

```
trace-ai-cs/
├── client/                   # 前端 React + Vite + TypeScript
├── server/                   # 后端 Python + FastAPI
├── docs/                     # 文档
├── .env.example              # 凭证模板
├── pnpm-workspace.yaml       # monorepo 配置
└── package.json
```

## 技术栈

React 18 · TypeScript · Vite · Redux Toolkit · Arco Design · Python · FastAPI · @volcengine/rtc
