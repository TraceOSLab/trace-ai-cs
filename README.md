# Trace AI Conversational System

基于火山引擎 RTC 的实时对话式 AI 系统。

## 项目结构

```
trace-ai-cs/
├── client/          # 前端项目 (React + TypeScript + Vite)
│   ├── src/         # 源代码
│   └── package.json
├── server/          # 后端项目 (Python + FastAPI)
│   ├── scenes/      # 场景配置
│   ├── app.py       # 主服务
│   └── requirements.txt
├── package.json     # 根 workspace 配置
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

## 功能特性

- 实时语音对话 AI
- 多场景切换
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
- Arco Design (UI 组件)
- @volcengine/rtc (RTC SDK)

### 后端
- Python 3.12
- FastAPI (异步框架)
- httpx (HTTP 客户端)
- 火山引擎 OpenAPI

## 配置管理

### 文件说明

| 文件 | 作用 | 是否提交到 Git |
|------|------|--------------|
| `server/scenes/Custom.json` | **你的真实配置**（含 accessKeyId 等凭据） | ❌ `.gitignore` 排除 |
| `server/scenes/Custom.example.json` | 模板文件，敏感字段留空 | ✅ 提交到仓库 |

### 首次使用

```bash
# 1. 创建你的场景配置
cp server/scenes/Custom.example.json server/scenes/Custom.json

# 2. 编辑 server/scenes/Custom.json，填入你的火山引擎凭据
```

### 添加新场景

每个场景是一个独立的 JSON 文件，可以配置各自的 ASR / TTS / LLM：

```bash
cp server/scenes/Custom.example.json server/scenes/Interview.json
# 编辑 Interview.json，填入你的场景配置
# 系统会自动加载它（.json 优先于 .example.json）
```

### Git 初始化