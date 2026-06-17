# PROJECT.md — Trace AI Conversational System

## 项目定位

基于火山引擎 RTC 的**实时对话式 AI 系统**。用户通过浏览器麦克风与 AI 进行语音对话，AI 通过火山引擎 RTC 实时处理语音流 (ASR→LLM→TTS)，支持接入自定义大模型。

## 核心能力

- **实时语音对话**: 通过 WebRTC 实现低延迟语音交互
- **第三方大模型接入**: 通过 CustomLLM 回调模式桥接任意 OpenAI 兼容 API (GPT-4o、DeepSeek 等)
- **语音打断**: 用户在 AI 说话时可打断插入新消息
- **网络质量监测**: 实时上行/下行网络质量评估
- **AI 降噪**: 基于 `@volcengine/rtc/extension-ainr`
- **视频通话**: 支持摄像头和屏幕共享
- **数字人**: 通过 AvatarConfig 配置虚拟形象
- **字幕**: 实时显示用户和 AI 对话文本
- **多场景配置**: JSON 文件定义场景 (ASR/TTS/LLM 参数)，支持环境变量插值

## 系统架构

```
┌─────────────┐     ┌──────────────────────────────────────────────┐
│   Browser   │     │            Backend (FastAPI :3001)            │
│  React App  │────▶│                                              │
│             │     │  /getScenes  ── 场景列表 + RTC Token          │
│             │◀────│  /proxy      ── 代理火山引擎 OpenAPI (签名)   │
│             │     │  /llm/callback ─ CustomLLM 回调 (SSE 流式)    │
└──────┬──────┘     └──────────────────┬───────────────────────────┘
       │                               │
       │  WebRTC (音视频流)              │  HTTP (签名代理)
       │                               │
       ▼                               ▼
┌──────────────────────┐    ┌──────────────────────┐
│  火山引擎 RTC 服务     │    │  火山引擎 OpenAPI      │
│  - 音频流传输          │    │  - StartVoiceChat     │
│  - 二进制消息 (字幕等)  │    │  - StopVoiceChat      │
└──────────────────────┘    └──────────┬───────────┘
                                       │ CustomLLM 回调
                                       ▼
                              ┌──────────────────────┐
                              │  第三方 LLM API        │
                              │  (OpenAI / DeepSeek   │
                              │   等兼容接口)          │
                              └──────────────────────┘
```

## 技术选型

### 前端

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.6 | 类型系统 |
| Vite | 6.0 | 构建/开发服务器 |
| Redux Toolkit | 2.5 | 全局状态管理 |
| Arco Design | 2.65 | UI 组件库 (按钮/消息/抽屉等) |
| @volcengine/rtc | 4.66 | 火山引擎 RTC SDK |
| react-router-dom | 6.28 | 客户端路由 |
| Less | 4.2 | CSS 预处理 |

### 后端

| 依赖 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.115 | Web 框架 |
| uvicorn | 0.34 | ASGI 服务器 |
| Pydantic | 2.10 | 数据校验/序列化 |
| httpx | 0.28 | 异步 HTTP 客户端 |
| python-dotenv | 1.0 | .env 加载 |
| cryptography | 44.0 | (volcengine SDK 依赖) |

### RTC 核心

- **SDK**: `@volcengine/rtc` — 提供 `createEngine`/`joinRoom`/`leaveRoom`/`startAudioCapture`/`publishStream` 等完整 RTC 能力
- **AI 降噪**: `@volcengine/rtc/extension-ainr` 扩展
- **Token 生成**: 自定义 `AccessToken` 类 (HMAC-SHA256)，参考 `volc-sdk-python`

## 项目配置管理

### 三层配置分离

```
凭证层 (.env)        → 敏感: VOLC_ACCESS_KEY_ID, VOLC_SECRET_KEY
                     → gitignore ✓

场景层 (Custom.json)  → 业务: AppId, AppKey, ASR, TTS, LLM, Avatar
                     → gitignore ✓
                     → 模板: Custom.example.json (git跟踪)

代码层               → LLM 渠道: server/services/llm_channel.py (_LLM_CONFIG)
                     → 前端地址: client/src/config/index.ts
```

配置加载流程:

1. 启动时 `load_dotenv()` 读取 `.env`
2. `read_files("./scenes", ".json")` 加载场景 JSON
3. `interpolate_env()` 递归替换 JSON 中的 `${VAR}` 为环境变量值
4. 优先加载 `.json`，不存在时 fallback 到 `.example.json`

## 前端代码组织

```
client/src/
├── api/               # API 层
│   ├── base.ts        # 请求封装 (requestPostMethod, resultHandler, generateAPIs)
│   ├── api.ts         # API 定义 (BasicAPIs, AigcAPIs)
│   ├── type.ts        # 请求/响应类型
│   └── index.ts       # 导出统一 API 对象
├── config/
│   └── index.ts       # AIGC_PROXY_HOST, 文档链接
├── lib/
│   ├── RtcClient.ts   # RTC SDK 封装类 (单例)
│   ├── useCommon.ts   # Hooks: useScene, useRTC, useDeviceState, useJoin, useLeave
│   └── listenerHooks.ts  # RTC 事件监听 Hook
├── pages/
│   ├── MainPage/      # 主页面
│   │   ├── MainArea/  # 主区域: Antechamber (准备) / Room (通话中)
│   │   └── Menu/      # 侧栏: 房间信息/操作/版本信息
│   └── Mobile/        # 移动端适配组件
├── store/
│   ├── index.ts       # Redux Store 创建
│   └── slices/
│       ├── room.ts    # 房间状态: 用户/场景/RTC配置/消息历史/字幕
│       └── device.ts  # 设备状态: 摄像头/麦克风列表/权限
├── components/
│   ├── AiChangeCard/  # 场景切换卡片
│   ├── AiAvatarCard/  # AI 形象展示
│   ├── FullScreenCard/# 全屏数字人视图
│   ├── Loading/       # 加载动画 (AudioLoading 波形动画等)
│   ├── LocalPlayerSet/# 本地视频预览
│   └── ...            # UserTag, Header, ResizeWrapper, NetworkIndicator 等
└── utils/
    ├── handler.ts     # 消息处理器 (字幕/状态/Function Call)
    ├── utils.ts       # TLV 编解码, isMobile
    └── logger.ts      # 日志封装
```

## 后端代码组织

```
server/
├── app.py             # 入口: 加载配置→创建 FastAPI→注册路由
├── routers/
│   ├── health.py      # GET /health
│   ├── scene.py       # POST /getScenes (场景列表 + Token 生成)
│   ├── proxy.py       # POST /proxy (代理火山引擎 OpenAPI，HMAC-SHA256 签名)
│   └── llm_callback.py # POST /llm/callback (CustomLLM 回调，SSE 流式返回)
├── services/
│   ├── scene_service.py  # 构建场景列表、生成 RTC Token
│   ├── proxy_service.py  # 发送签名请求到火山引擎
│   └── llm_channel.py    # 转发 CustomLLM 回调到真实 LLM
├── schemas/
│   ├── common.py      # ProxyRequest, WrapperResponse, HealthResponse
│   ├── scene.py       # SceneConfigOut, RTCConfigOut
│   └── llm.py         # CustomLLM 文档注释
├── rtcs_token.py      # AccessToken / Privileges (HMAC-SHA256)
├── util.py            # interpolate_env, read_files, wrapper_response
├── scenes/            # 场景 JSON 配置文件
└── requirements.txt
```

## 数据流 — 一次完整对话

1. **加载场景**: 前端调用 `POST /getScenes` → 后端从 JSON 加载场景 → 生成 RTC Token → 返回场景列表
2. **加入房间**: 前端 `RtcClient.joinRoom()` → 通过 WebRTC 加入火山引擎 RTC 房间
3. **启动 AI**: 前端调用 `POST /proxy?Action=StartVoiceChat` → 后端签名后转发 `rtc.volcengineapi.com`
4. **语音交互**:
   - 用户说话 → RTC 音频流推送到火山引擎 → ASR 转文字 → 字幕 (SubtitleMessage) 推回前端
   - LLM 调用 (CustomLLM 模式):
     1. 火山引擎向配置的 `Url` 发送 POST (OpenAI 格式消息体)
     2. 后端 `/llm/callback` 接收 → `llm_channel.py` 转发到真实 LLM API
     3. LLM 返回 SSE 流 → 转换为 CustomLLM 规范格式 → 返回火山引擎
   - TTS → RTC 音频流 → 前端播放
   - 状态消息 (BriefMessage): THINKING/SPEAKING/FINISHED/INTERRUPTED
5. **离开房间**: 前端调用 `POST /proxy?Action=StopVoiceChat` → `RtcClient.leaveRoom()`

## 当前版本与限制

- **版本**: 1.1.0
- **单场景**: 当前仅一个 `Custom` 场景，但框架支持多场景
- **无用户系统**: 无登录/鉴权，通过 RTC Token + RequestID 管理会话
- **无持久化**: 对话历史仅在内存中，刷新即丢失
- **CustomLLM URL**: 需要公网可访问地址 (开发时用 ngrok)
- **LLM 渠道配置**: 硬编码在 `llm_channel.py` 中，切换模型需修改代码重启
