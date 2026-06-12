# Trace AI CS Server

基于 FastAPI 的实时对话式 AI 后端服务。

## 技术栈

- Python 3.12+
- FastAPI
- httpx
- 火山引擎 OpenAPI / RTC SDK

## 本地开发

```bash
# 创建虚拟环境
cd trace-ai-cs
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r server/requirements.txt

# 启动开发服务
uvicorn server.app:app --reload --host 0.0.0.0 --port 3001
```

## API 接口

### POST /getScenes
获取场景配置列表，自动生成 RTC Token。

### POST /proxy
代理 AIGC OpenAPI 请求。

支持 Action:
- StartVoiceChat: 启动语音对话
- StopVoiceChat: 停止语音对话

### GET /health
健康检查。

## 场景配置

场景配置文件位于 `scenes/` 目录下，每个文件为一个场景的 JSON 配置。

配置说明:

| 字段 | 说明 |
|------|------|
| SceneConfig | 场景展示配置 |
| AccountConfig | 火山引擎账号配置 |
| RTCConfig | RTC 配置 |
| VoiceChat | 语音对话配置 |
| VoiceChat.Config.ASRConfig | 语音识别配置 |
| VoiceChat.Config.TTSConfig | 语音合成配置 |
| VoiceChat.Config.LLMConfig | 大语言模型配置 |
| VoiceChat.Config.AvatarConfig | 数字人配置 |

## 配置管理

### 场景配置

场景配置文件位于 `scenes/` 目录，使用 `.example.json` 作为模板，`.json` 作为你的真实配置。

```bash
# 从模板创建配置
cp scenes/Custom.example.json scenes/Custom.json

# 编辑 scenes/Custom.json，填入你的火山引擎凭证
```

`.gitignore` 已配置排除 `scenes/*.json`，只有 `.example.json` 会被提交到仓库。

### 方式二：使用 .env（推荐）

在项目根目录创建 `.env` 文件，参考 `.env.example`：

```bash
cp .env.example .env
# 编辑 .env 填入你的火山引擎凭据
```

然后在场景 JSON 中使用 `${VAR_NAME}` 引用环境变量（参考 `Custom.example.json`）。
系统会在加载配置时自动将 `${VAR}` 替换为 `.env` 中的值。

```json
{
  "AccountConfig": {
    "accessKeyId": "${VOLC_ACCESS_KEY_ID}",
    "secretKey": "${VOLC_SECRET_KEY}"
  }
}
```

### 支持的环境变量

| 变量名 | 说明 |
|--------|------|
| `VOLC_ACCESS_KEY_ID` | 火山引擎 Access Key ID |
| `VOLC_SECRET_KEY` | 火山引擎 Secret Key |
| `RTC_APP_ID` | RTC 应用 ID |
| `RTC_APP_KEY` | RTC 应用 Key（用于 Token 签名） |
| `RTC_ROOM_ID` | RTC 房间 ID |
| `RTC_USER_ID` | 用户 ID |
| `ASR_APP_ID` | 语音识别 AppId |
| `TTS_APP_ID` | 语音合成 AppId |
| `LLM_ENDPOINT_ID` | LLM 接入点 ID |
| `AVATAR_APP_ID` | 数字人 AppId（可选） |
