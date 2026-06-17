# DEVELOPMENT.md — 开发指南

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python >= 3.11 (推荐 3.12+)

## 首次环境搭建

```bash
# 1. 进入项目
cd trace-ai-cs

# 2. 安装 Node 依赖 (monorepo)
pnpm install

# 3. 创建 Python 虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 4. 安装 Python 依赖
pip install -r server/requirements.txt

# 5. 配置
cp .env.example .env
cp server/scenes/Custom.example.json server/scenes/Custom.json
# → 编辑 .env 和 Custom.json

# 6. 启动
pnpm dev
```

## 开发服务器

| 命令 | 端口 | 说明 |
|------|------|------|
| `pnpm dev` | :3000 + :3001 | 前后端同时启动 |
| `pnpm dev:client` | :3000 | 仅前端 (Vite) |
| `pnpm dev:server` | :3001 | 仅后端 (uvicorn --reload) |

前端开发时 Vite 配置了代理：`/getScenes` 和 `/proxy` 自动转发到 `:3001`。

## 目录约定

```
trace-ai-cs/
├── client/src/        # 前端源码
│   ├── api/           # API 请求层 (不写 UI 逻辑)
│   ├── lib/           # RTC 核心 + Hooks (不写 UI)
│   ├── store/slices/  # Redux Slice (纯状态)
│   ├── pages/         # 页面级组件 (通过路由访问)
│   ├── components/    # 可复用组件 (不依赖路由)
│   └── utils/         # 纯函数工具
├── server/
│   ├── routers/       # 路由 (参数校验 + 响应)
│   ├── services/      # 业务逻辑 (被 routers 调用)
│   ├── schemas/       # Pydantic 模型
│   └── scenes/        # 配置文件
└── docs/              # 文档
```

**原则**: routers 不写业务逻辑，services 不操作请求/响应，schemas 只定义数据结构。

## 日常开发流程

```bash
# 1. 激活虚拟环境
source .venv/bin/activate

# 2. 启动开发服务器
pnpm dev

# 3. 修改代码 → 热更新
#    后端: uvicorn --reload 自动重启
#    前端: Vite HMR 自动刷新

# 4. 修改 Python 依赖后
pip install -r server/requirements.txt

# 5. 修改前端依赖后
pnpm install
```

## 前端类型检查

```bash
cd client
npx tsc --noEmit
```

## 后端接口调试

启动后端后访问 `http://localhost:3001/docs` (Swagger UI)，可直接调试所有接口。

## CustomLLM 模式本地调试

由于火山引擎需要**公网回调地址**，本地开发时使用 ngrok 内网穿透：

```bash
# 安装 ngrok (一次性)
brew install ngrok

# 启动内网穿透 (3001 是后端端口)
ngrok http 3001

# 获取公网地址，例如 https://xxxx.ngrok-free.app
# 将其填入 .env:
# CUSTOMLLM_CALLBACK_URL=https://xxxx.ngrok-free.app/llm/callback
```

## 常见问题

### Server 启动报错 `ImportError: ... from 'token'`

**原因**: `server/rtc_token.py` 原名 `token.py`，与 Python 标准库 `token` 模块冲突。

**解决**: 确认文件名为 `server/rtc_token.py`，`scene_service.py` 中 import 为 `from ..rtc_token import ...`。

### TypeScript 编译报错 `Property 'at' does not exist` / `Property 'replaceAll' does not exist`

**原因**: `tsconfig.json` 中 `lib` 未包含 ES2022。

**解决**: `lib` 配置为 `["ES2022", "DOM", "DOM.Iterable"]`。

### 前端一直显示"AI 准备中, 请稍候"

**可能原因** (按概率排序):

1. `Custom.json` 中 AppId/AppKey 未配置或错误
2. `.env` 中 VOLC_ACCESS_KEY_ID/VOLC_SECRET_KEY 未配置或错误
3. 火山引擎控制台 AIGC 智能体未配置或已挂断
4. `StartVoiceChat` 返回错误 (查看后端日志)
5. CustomLLM 模式的 `Url` 不可达 (检查 ngrok)

**排查方法**: 打开浏览器控制台 → Network 标签 → 查看 `/proxy?Action=StartVoiceChat` 的响应。

### 浏览器控制台 `_SDKError: token_error`

**原因**: RTC Token 无效。常见原因:
- AppId/AppKey 不匹配
- Token 过期 (重新调用 `/getScenes`)
- 房间 ID/用户 ID 与 Token 签名时不一致

### 前端端口冲突

修改 `client/vite.config.ts`:
```ts
server: { port: 3000 }  // 改为其他端口
```

修改 `client/src/config/index.ts`:
```ts
export const AIGC_PROXY_HOST = 'http://localhost:3001';  // 后端地址
```

## 打包构建

```bash
# 前端生产构建
pnpm build
# 输出: client/dist/

# 后端无需构建，直接运行
uvicorn server.app:app --host 0.0.0.0 --port 3001
```

## 代码规范

### Python
- 遵循 PEP 8
- 类型注解: 函数签名必须标注参数和返回类型
- Pydantic v2 语法 (`.model_dump()` 非 `.dict()`)
- 日志: 使用 `logging.getLogger(__name__)`，不用 `print()`

### TypeScript / React
- 所有组件 props 必须定义 interface
- 避免 `any`，优先 `unknown` + 类型守卫
- Redux: 状态通过 action 修改，不直接 mutate
- 文件名: 组件 PascalCase，其他 camelCase
- API 调用: 通过 `api/` 层，不在组件中直接 fetch

### Commit 规范

```
type(scope): description

feat(server): add /rag/search endpoint
fix(client): resolve AudioController undefined type
docs: update configuration guide
refactor(server): extract token generation to service
```

类型: `feat` / `fix` / `docs` / `refactor` / `chore` / `style` / `test`
