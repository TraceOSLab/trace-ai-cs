# CONFIGURATION.md — 完整配置参考

## 配置体系概览

项目配置分**三层**，由上至下：

```
.env                        ← 账号凭证 (gitignore)
  └── server/scenes/*.json   ← 场景业务配置 (gitignore)
        └── server/services/llm_channel.py ← LLM 渠道配置 (git 跟踪)
```

加载链路：`load_dotenv()` → `read_files()` → `interpolate_env()` — 最终所有 `${VAR}` 被替换为环境变量真实值。

---

## 第一层: `.env` — 账号凭证

**模板文件**: `.env.example` (git 跟踪)  
**真实文件**: `.env` (gitignore)

| 变量 | 必填 | 说明 |
|------|:--:|------|
| `VOLC_ACCESS_KEY_ID` | ✅ | 火山引擎 AccessKey，从控制台"密钥管理"获取 |
| `VOLC_SECRET_KEY` | ✅ | 火山引擎 SecretKey |
| `CUSTOMLLM_CALLBACK_URL` | ❌ | CustomLLM 模式时的回调地址，必须是**公网 URL**（开发用 ngrok） |

示例 `.env`：

```bash
VOLC_ACCESS_KEY_ID=AKLTxxxxxxxxxxxxxxxx
VOLC_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CUSTOMLLM_CALLBACK_URL=https://your-domain.com/llm/callback
```

---

## 第二层: `server/scenes/Custom.json` — 场景配置

**模板文件**: `Custom.example.json` (git 跟踪，字段留空/占位)  
**真实文件**: `Custom.json` (gitignore)

### 2.1 顶级结构

```json
{
  "SceneConfig": { ... },     // 前端展示
  "AccountConfig": { ... },   // 火山引擎账号 (引用 .env)
  "RTCConfig": { ... },       // RTC 连接信息
  "VoiceChat": { ... }        // AIGC 对话配置
}
```

### 2.2 SceneConfig — 前端展示

| 字段 | 类型 | 说明 |
|------|------|------|
| `icon` | string | 场景图标 URL (前端展示) |
| `name` | string | 场景显示名称 |

### 2.3 AccountConfig — 账号引用

| 字段 | 类型 | 说明 |
|------|------|------|
| `accessKeyId` | string | 填 `${VOLC_ACCESS_KEY_ID}` |
| `secretKey` | string | 填 `${VOLC_SECRET_KEY}` |

### 2.4 RTCConfig — RTC 连接

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `AppId` | string | ✅ | 火山引擎 RTC 应用 ID |
| `AppKey` | string | ✅ | RTC 应用 AppKey |
| `RoomId` | string | ❌ | 房间 ID，留空则自动生成 UUID |
| `UserId` | string | ❌ | 用户 ID，留空则自动生成 UUID |
| `Token` | string | ❌ | Token，**留空** — 由 `/getScenes` 动态生成 |

### 2.5 VoiceChat — AIGC 对话

| 字段 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `AppId` | string | ✅ | 同 RTCConfig.AppId |
| `RoomId` | string | ❌ | 由后端自动填充 |
| `TaskId` | string | ✅ | AIGC 任务 ID，自定义字符串 |
| `AgentConfig` | object | ✅ | AI 智能体配置 |
| `Config` | object | ✅ | ASR/TTS/LLM/Avatar 配置 |

#### AgentConfig

| 字段 | 类型 | 说明 |
|------|------|------|
| `TargetUserId` | string[] | 服务的目标用户 ID 列表，由后端自动填充 |
| `WelcomeMessage` | string | AI 接入时的欢迎语 |
| `UserId` | string | AI 在 RTC 房间中的 UserId |
| `EnableConversationStateCallback` | boolean | 启用对话状态回调 |

#### Config.ASRConfig — 语音识别

| 字段 | 说明 |
|------|------|
| `Provider` | 固定 `"volcano"` |
| `ProviderParams.Mode` | `"smallmodel"` 或 `"bigmodel"` |
| `ProviderParams.AppId` | ASR 应用 ID (火山引擎语音识别服务) |
| `ProviderParams.Cluster` | 固定 `"volcengine_streaming_common"` |

#### Config.TTSConfig — 语音合成

| 字段 | 说明 |
|------|------|
| `Provider` | 固定 `"volcano"` |
| `ProviderParams.app.appid` | TTS 应用 ID |
| `ProviderParams.app.cluster` | 固定 `"volcano_tts"` |
| `ProviderParams.audio.voice_type` | 音色 ID，如 `"BV001_streaming"` |
| `ProviderParams.audio.speed_ratio` | 语速 (0.5~2.0) |
| `ProviderParams.audio.pitch_ratio` | 音调 (0.5~2.0) |
| `ProviderParams.audio.volume_ratio` | 音量 (0.1~2.0) |

#### Config.LLMConfig — 大模型配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `Mode` | string | `"CustomLLM"` 使用自定义回调模式 |
| `Url` | string | CustomLLM 回调地址，填 `${CUSTOMLLM_CALLBACK_URL}` |
| `APIKey` | string | 回调鉴权 Token (可选) |

> **火山方舟模式** (`Mode: "ArkV3"`): 配置 `EndPointId` + `SystemMessages`，不经过 `/llm/callback`。

#### Config.AvatarConfig — 数字人

| 字段 | 类型 | 说明 |
|------|------|------|
| `Enabled` | boolean | 是否启用数字人 |
| `AvatarType` | string | 数字人类型 (如 `"3min"`) |
| `AvatarRole` | string | 数字人角色 ID |
| `BackgroundUrl` | string | 数字人背景图 |
| `VideoBitrate` | number | 视频码率 (kbps)，默认 2000 |
| `AvatarAppID` | string | 数字人应用 ID |
| `AvatarToken` | string | 数字人 Token |

#### Config.InterruptMode

- `0` = 语音打断模式（用户开口即打断 AI）
- `1` = 手动打断模式（需点击"打断"按钮）

---

## 第三层: `server/services/llm_channel.py` — LLM 渠道

CustomLLM 模式的**真实 LLM 转发配置**，在代码中修改后生效：

```python
_LLM_CONFIG = {
    "channel_id": "openai",             # 渠道标识 (仅日志)
    "api_key": "",                     # LLM API Key
    "model": "gpt-4o",                 # 模型名称
    "base_url": "https://api.openai.com/v1",  # API 地址
    "system_prompt": "你是智能客服助手...",  # System Prompt
    "max_tokens": 4096,                # 最大输出 Token
    "temperature": 0.7,                # 采样温度
}
```

**支持的接口格式**: OpenAI Chat Completions 兼容 API (带 SSE stream)。任何实现 `POST /v1/chat/completions` + `stream: true` 的服务均可接入。

---

## 初次配置完整流程

```bash
# 1. 凭证
cp .env.example .env
# 编辑 .env → 填入 VOLC_ACCESS_KEY_ID / VOLC_SECRET_KEY

# 2. 场景
cp server/scenes/Custom.example.json server/scenes/Custom.json
# 编辑 Custom.json → 填入 AppId / AppKey / TaskId / ASR.AppId / TTS.appid

# 3. LLM (可选)
# 编辑 server/services/llm_channel.py → 修改 _LLM_CONFIG

# 4. 启动
source .venv/bin/activate
pnpm dev
```

---

## 配置加载逻辑

具体实现在 `server/util.py`：

```python
def read_files(dir_path: str, suffix: str = ".json"):
    # 1. 遍历 server/scenes/ 目录
    # 2. 优先加载 *.json (真实配置)
    # 3. 不存在时 fallback 到 *.example.json (模板)
    # 4. 对每个 JSON 递归调用 interpolate_env()
    #    将 ${VAR_NAME} 替换为 os.getenv("VAR_NAME") 的值

def interpolate_env(obj):
    # 递归遍历 str / dict / list
    # ${VAR} → os.getenv("VAR", "") (环境变量不存在则用空串)
```

**结果**: 即使 `Custom.json` 不存在，服务也能以示例模板启动（不会崩溃，但 RTC 功能不可用）。

---

## 敏感信息清单

| 信息 | 存储位置 | Git | 风险 |
|------|---------|:---:|------|
| VOLC_ACCESS_KEY_ID | `.env` | ❌ | 账号级凭证 |
| VOLC_SECRET_KEY | `.env` | ❌ | 账号级凭证 |
| RTC AppKey | `Custom.json` | ❌ | 应用级凭证 |
| RTC AppId | `Custom.json` | ❌ | 应用标识 (非敏感但属私有) |
| ASR/TTS AppId | `Custom.json` | ❌ | 服务标识 |
| LLM API Key | `llm_channel.py` | ✅ | ⚠️ 当前在 git 跟踪文件中，建议移到 `.env` |
