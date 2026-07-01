"""
Trace AI Conversational Server 入口
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

from .util import read_files
from .routers import (
    health_router,
    scene_router,
    proxy_router,
    llm_callback_router,
)
from .routers.scene import init_scenes as init_scene_router
from .routers.proxy import init_scenes as init_proxy_router

# 加载 .env
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 加载场景配置
SCENES = read_files("./scenes", ".json")
init_scene_router(SCENES)
init_proxy_router(SCENES)

# ── FastAPI 应用 ──────────────────────────────────────────

app = FastAPI(
    title="Trace AI Conversational Server",
    description=("基于火山引擎 RTC 的实时对话式 AI 后端服务\n\n"),
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(scene_router)
app.include_router(proxy_router)
app.include_router(llm_callback_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.app:app", host="127.0.0.1", port=3001, reload=True)
