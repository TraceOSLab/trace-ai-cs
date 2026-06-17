# GLOSSARY.md — 术语表

## 火山引擎 / RTC

### RTC (Real-Time Communication)
实时音视频通信技术，基于 WebRTC 协议。本项目通过火山引擎 RTC SDK (`@volcengine/rtc`) 在浏览器和云端之间建立低延迟的音视频通道。

### AIGC (AI-Generated Content)
火山引擎的实时对话式 AI 产品，集成 ASR → LLM → TTS 的完整语音对话流水线，通过 RTC 通道交付。

### AppId / AppKey
火山引擎 RTC 应用的唯一标识和密钥。从 [火山引擎 RTC 控制台](https://console.volcengine.com/rtc) 获取。

### OpenAPI
火山引擎提供的 HTTP API，用于管理 AIGC 智能体生命周期 (`StartVoiceChat` / `StopVoiceChat`)。

### SignerV4 (HMAC-SHA256 签名)
火山引擎 OpenAPI 的请求签名算法。`proxy_service.py` 使用 `volcengine.auth.SignerV4` 对每个请求进行 HMAC-SHA256 签名，防止请求被篡改。

### RTC Token
用于加入 RTC 房间的临时凭证，通过 HMAC-SHA256 算法生成。Token 包含:
- AppId + RoomId + UserId
- 权限 (PublishStream / SubscribeStream)
- 过期时间 (24 小时)

本项目通过 `server/rtc_token.py` 中的 `AccessToken` 类动态生成，不预存。

---

## AI / LLM 相关

### ASR (Automatic Speech Recognition)
自动语音识别。将用户的语音转换为文本，作为 LLM 的输入。

### TTS (Text-to-Speech)
文本转语音。将 LLM 的输出文本合成为语音，通过 RTC 推送给用户。

### LLM (Large Language Model)
大语言模型。接收文本消息，生成回复文本。本项目支持通过 CustomLLM 回调模式接入任意模型。

### CustomLLM
火山引擎 AIGC 的一种 LLM 模式。当 `LLMConfig.Mode = "CustomLLM"` 时，火山引擎会将对话消息 POST 到指定的回调 URL，由回调服务调用真实的 LLM API 并返回结果。

**数据流**: 
```
火山引擎 → POST /llm/callback → llm_channel.py → OpenAI 兼容 API → SSE 流式返回
```

### System Prompt
系统提示词。设定 AI 的角色、语气和行为规范，作为 messages 的第一条 (`role: "system"`) 发送给 LLM。

### SSE (Server-Sent Events)
服务器推送事件。HTTP 协议的长连接流式传输方式。火山引擎与 CustomLLM 之间、后端与 LLM API 之间均使用 SSE 格式。

格式: `data: {json}\n\n` 结尾 `data: [DONE]\n\n`。

---

## 通信协议

### TLV (Type-Length-Value)
一种二进制消息编码格式。RTC DataChannel 中所有的控制消息均使用 TLV 编码：

```
[Type: 4 字节] [Length: 4 字节 (大端序)] [Value: 变长 (UTF-8 JSON)]
```

**Type 取值**:

| Type 字符串 | 对应枚举 | 含义 |
|------------|---------|------|
| `subv` | SUBTITLE | 字幕消息 |
| `conv` | BRIEF | AI 状态消息 |
| `tool` | FUNCTION_CALL | Function Calling 请求 |
| `ctrl` | - | 客户端控制指令 (打断等) |
| `func` | - | Function Calling 响应 |

实现: `client/src/utils/utils.ts` — `string2tlv()` / `tlv2String()`

### BriefMessage (状态消息)
Type = `conv`，Value 为 JSON: `{"Stage": {"Code": n, "Description": "..."}}`

**Stage.Code 取值**:

| Code | 状态 | 含义 |
|------|------|------|
| 0 | UNKNOWN | 未知 |
| 1 | LISTENING | AI 正在听用户说话 |
| 2 | THINKING | AI 正在思考 (LLM 推理中) |
| 3 | SPEAKING | AI 正在说话 (TTS 播放中) |
| 4 | INTERRUPTED | AI 被打断 |
| 5 | FINISHED | AI 完成本轮对话 |

### SubtitleMessage (字幕消息)
Type = `subv`，Value 为 JSON: `{"data": [{"text": "...", "userId": "...", "definite": bool, "paragraph": bool}]}`

- `definite`: 是否为最终字幕 (false 表示后续可能修改)
- `paragraph`: 是否为段落结束

---

## 项目概念

### 场景 (Scene)
一个完整的 AIGC 对话配置单元。包含 RTC 房间信息、AI 智能体配置、ASR/TTS/LLM 参数。定义在 `server/scenes/*.json` 中。

当前仅有 1 个场景 `Custom`，但框架支持多场景扩展。

### 房间 (Room)
RTC 的基本会话单元。一个房间内可以有多个用户 (包括 AI 智能体)，通过 RTC 同步音视频流。

### 智能体 (Agent)
运行在火山引擎云端的 AI 对话实体。由 `StartVoiceChat` 创建，`StopVoiceChat` 销毁。在 RTC 房间中作为一个虚拟用户存在。

### 渠道 (Channel)
LLM 的转发管道。`llm_channel.py` 中的 `_LLM_CONFIG` 定义了将 CustomLLM 回调请求转发到哪个 LLM 服务。

### 打断 (Interrupt)
用户在 AI 说话时插入新消息的机制。支持两种模式:
- **语音打断** (`InterruptMode=0`): 用户开口说话自动打断 AI
- **手动打断** (`InterruptMode=1`): 用户点击"打断"按钮

打断命令通过 `sendUserBinaryMessage` → TLV(`ctrl`) 发送。

### monorepo
单一代码仓库管理多个子项目。本项目使用 pnpm workspace 管理 `client/` 和 `server/`。

---

## 外部服务

| 服务 | 用途 | 地址 |
|------|------|------|
| 火山引擎 RTC | 实时音视频传输 | `rtc.volcengineapi.com` |
| 火山引擎 OpenAPI | AIGC 智能体管理 | `rtc.volcengineapi.com` |
| OpenAI API | LLM 推理 | `api.openai.com` (可替换) |
| ngrok | 本地公网穿透 | `*.ngrok-free.app` |
