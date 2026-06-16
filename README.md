# Trace AI Conversational System

基于火山引擎 RTC 的实时对话式 AI 系统，支持接入第三方大模型。

## 项目结构

```
trace-ai-cs/
├── client/                     # 前端项目 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                # API 层
│   │   ├── components/         # 通用组件
│   │   │   ├── LLMProviderSelect/  # LLM 提供商选择组件
│   │   │   └── SceneConfigPanel/   # 场景配置编辑面板
│   │   ├── lib/                # RTC 核心逻辑
│   │   ├── pages/              # 页面组件
│   │   ├── store/              # Redux 状态管理
│   │   └── utils/              # 工具函数
│   └── package.json
├── server/                     # 后端项目 (Python + FastAPI)
│   ├── routers/                # 路由层
│   ├── schemas/                # Pydantic 数据模型
│   ├── services/               # 业务逻辑层
│   ├── scenes/                 # 场景配置 JSON
│   ├── app.py                  # 主入口
│   └── requirements.txt
├── .env.example                # 环境变量模板
├── package.json                # 根 workspace 配置
└── pnpm-workspace.yaml
```

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python >= 3.12

### 1. 启动后端服务

```bash
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r server/requirements.txt

# 启动服务
uvicorn server.app:app --reload --host 0.0.0.0 --port 3001
```

### 2. 启动前端服务

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm --filter @trace-ai-cs/client dev
```

### 3. 同时启动前后端

```bash
pnpm dev
```

## 配置管理

### 文件说明

| 文件                                | 作用                                  | Git 提交 |
| ----------------------------------- | ------------------------------------- | -------- |
| `.env`                              | 账号级凭证（accessKeyId / secretKey） | ❌       |
| `server/scenes/Custom.json`         | 场景真实配置                          | ❌       |
| `server/scenes/Custom.example.json` | 场景配置模板                          | ✅       |

### 首次配置

```bash
# 1. 配置账号凭证
cp .env.example .env
# 编辑 .env 填入火山引擎凭证

# 2. 创建场景配置
cp server/scenes/Custom.example.json server/scenes/Custom.json
# 编辑 Custom.json 填入 AppId、ASR/TTS/LLM 配置
```

## 功能特性

- 实时语音对话 AI
- 多场景切换
- 支持第三方大模型（DeepSeek、OpenAI 兼容接口）
- LLM 提供商选择 UI
- 视频通话支持
- 屏幕共享
- 数字人交互
- 语音打断
- 网络质量监测
- 移动端适配

## 技术栈

### 前端

- React 18 + TypeScript
- Redux Toolkit (状态管理)
- Vite (构建工具)
- Arco Design (UI 组件库)
- @volcengine/rtc (RTC SDK)x

### 后端

- Python 3.12
- FastAPI (异步框架)
- httpx (HTTP 客户端)
- 火山引擎 OpenAPI

## 文档

- [Server API 文档](server/README.md) — 后端接口说明和配置指南

接口交互式文档：启动后端后访问 `http://localhost:3001/docs`
