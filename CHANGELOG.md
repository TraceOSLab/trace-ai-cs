# CHANGELOG.md

## [Unreleased]

### 新增
- `server/services/llm_service.py` — LLM 服务，对接方舟 Ark (OpenAI 兼容接口)，支持流式/非流式
- `server/services/rag_service.py` — RAG 检索服务，对接火山知识库 API (SignerV4 签名)
- `server/routers/llm_debug.py` — Debug 接口:
  - `POST /llm/debug/chat` SSE 流式对话
  - `POST /llm/debug/chat/sync` JSON 非流式对话
  - `POST /llm/debug/rag` JSON 知识库检索
- 场景配置新增 `LLMChannel`(Ark) 和 `RAGConfig`(知识库) 字段

### 变更
- `server/services/llm_channel.py` 重写: 移除硬编码 OpenAI 配置，改为 RAG 检索 + LLM 调用管线
- `server/routers/llm_callback.py` 从场景配置读取 LLMChannel/RAGConfig/AccountConfig
- `server/app.py` 注册 debug 路由，场景配置注入 callback/debug 路由
- `.env` 精简为仅主账号 AK/SK，其他配置移至场景 JSON
- `server/scenes/Custom.example.json` 模板更新，新增 LLMChannel + RAGConfig

## [1.1.0] — 2026-06-16

### 新增
- CustomLLM 回调支持: `/llm/callback` 端点, 转发到 OpenAI 兼容 API
- `server/services/llm_channel.py` — LLM 渠道配置与 SSE 流式转发
- `server/routers/llm_callback.py` — CustomLLM 回调路由
- `docs/` 文档体系: PROJECT / ARCHITECTURE / DATABASE / CONFIGURATION / DEVELOPMENT / GLOSSARY
- `AGENTS.md` — Agent 开发入口文档
- `CONTRIBUTING.md` — 贡献规范
- `.env` + `.env.example` 双层凭证管理
- 场景 JSON `${VAR}` 环境变量插值

### 变更
- `server/token.py` → `server/rtc_token.py` (修复与 Python 标准库 token 的命名冲突)
- `client/src/api/` 替代 `client/src/app/` (API 层搬迁)
- `client/src/config/index.ts` 抽取前端地址常量
- 场景 JSON 三层分离: `Custom.example.json` (模板) / `Custom.json` (真实) / `.env` (凭证)
- 移除前端 LLM 提供商选择面板 (`LLMProviderSelect/`, `SceneConfigPanel/`, `LLMConfig/` menus)
- `servers/services/proxy_service.py` 简化签名转发逻辑
- `server/util.py` 新增 `interpolate_env()`, `read_files()` 重构

### 修复
- Python `token` 标准库被 `server/token.py` 遮盖导致 `import logging` 失败
- TypeScript: `tsconfig.json` lib 升级到 ES2022
- TypeScript: `AudioController` `isLoading` 类型 `boolean | undefined` → `boolean`
- `.env` 配置不存在时场景加载 fallback 到 `*.example.json`

---

## [1.0.0] — 原始 Demo

### 来源
基于 `rtc-aigc-demo` 参考实现。

### 功能
- 火山引擎 RTC 实时语音对话 AI
- 单场景: 火山方舟 (ArkV3) 模式
- 多场景切换前端面板
- 视频通话 / 屏幕共享 / 数字人
- 语音打断 / 字幕 / AI 降噪
- 移动端适配
