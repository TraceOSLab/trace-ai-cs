"""
LLM Debug 路由 — 无需前端+RTC，直接调试 LLM / RAG 服务

POST /llm/debug/chat       → SSE 流式对话
POST /llm/debug/chat/sync  → JSON 非流式对话（一次性返回）
POST /llm/debug/rag        → JSON 知识库检索
"""

import json
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from ..services.llm_service import llm_service
from ..services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm/debug", tags=["LLM Debug"])

# 场景配置引用（由 app.py 注入）
_SCENES_REF: dict = {}


def init_debug_scenes(scenes: dict) -> None:
    """注入场景配置（由 app.py 调用）。"""
    global _SCENES_REF  # noqa: PLW0603
    _SCENES_REF = scenes


# ═══════════════════════════════════════════════════════════
# 请求模型
# ═══════════════════════════════════════════════════════════


class Message(BaseModel):
    role: str
    content: str


class ChatDebugRequest(BaseModel):
    messages: list[Message] = Field(
        default_factory=list,
        description="对话历史，role 为 user/assistant",
    )
    scene: str = Field(
        default="Custom",
        description="场景名称",
    )
    system_prompt: str = Field(
        default="",
        description="自定义 system prompt，为空则使用默认",
    )
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=4096, ge=1, le=32768)
    enable_rag: bool = Field(default=True, description="是否启用 RAG 检索增强")


class RagDebugRequest(BaseModel):
    query: str = Field(..., description="检索查询语句")
    scene: str = Field(
        default="Custom",
        description="场景名称",
    )
    limit: int = Field(default=3, ge=1, le=10)


# ═══════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════


def _get_scene_config(scene_name: str) -> dict:
    if not _SCENES_REF:
        raise HTTPException(status_code=404, detail="无可用场景配置")
    scene = _SCENES_REF.get(scene_name)
    if not scene:
        available = list(_SCENES_REF.keys())
        raise HTTPException(
            status_code=404,
            detail=f"场景 '{scene_name}' 不存在，可用: {available}",
        )
    return scene


async def _prepare_rag(req: ChatDebugRequest) -> str:
    """RAG 检索辅助函数。"""
    scene = _get_scene_config(req.scene)
    rag_config = scene.get("RAGConfig", {})
    account = scene.get("AccountConfig", {})

    if not req.enable_rag or not rag_config.get("enabled", True):
        return ""

    user_query = req.messages[-1].content if req.messages else ""
    if not user_query:
        return ""

    logger.info("debug: RAG query='%s'", user_query[:80])
    return await rag_service.retrieve(
        query=user_query,
        config=rag_config,
        access_key_id=account.get("accessKeyId", ""),
        secret_key=account.get("secretKey", ""),
    )


def _resolve_llm_config(req: ChatDebugRequest) -> dict:
    scene = _get_scene_config(req.scene)
    config = {**scene.get("LLMChannel", {})}
    config["temperature"] = req.temperature
    config["max_tokens"] = req.max_tokens
    return config


# ═══════════════════════════════════════════════════════════
# POST /llm/debug/chat  (流式)
# ═══════════════════════════════════════════════════════════


@router.post("/chat", summary="Debug: 流式对话")
async def debug_chat(req: ChatDebugRequest):
    llm_config = _resolve_llm_config(req)
    llm_service.configure(llm_config)
    rag_context = await _prepare_rag(req)
    messages = [m.model_dump() for m in req.messages]

    async def _gen():
        async for chunk in llm_service.chat_stream(
            history_messages=messages,
            rag_context=rag_context,
        ):
            yield chunk

    return StreamingResponse(
        _gen(),  # type: ignore[arg-type]
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


# ═══════════════════════════════════════════════════════════
# POST /llm/debug/chat/sync  (非流式)
# ═══════════════════════════════════════════════════════════


@router.post("/chat/sync", summary="Debug: 非流式对话（一次性返回）")
async def debug_chat_sync(req: ChatDebugRequest):
    llm_config = _resolve_llm_config(req)
    llm_service.configure(llm_config)
    rag_context = await _prepare_rag(req)
    messages = [m.model_dump() for m in req.messages]

    reply = await llm_service.chat(
        history_messages=messages,
        rag_context=rag_context,
    )

    return JSONResponse(
        {
            "success": True,
            "scene": req.scene,
            "messages": messages,
            "reply": reply,
            "rag_context": rag_context,
        }
    )


# ═══════════════════════════════════════════════════════════
# POST /llm/debug/rag
# ═══════════════════════════════════════════════════════════


@router.post("/rag", summary="Debug: 知识库检索")
async def debug_rag(req: RagDebugRequest):
    scene = _get_scene_config(req.scene)
    rag_config = scene.get("RAGConfig", {})
    account = scene.get("AccountConfig", {})

    if req.limit:
        rag_config = {**rag_config, "limit": req.limit}

    context = await rag_service.retrieve(
        query=req.query,
        config=rag_config,
        access_key_id=account.get("accessKeyId", ""),
        secret_key=account.get("secretKey", ""),
    )

    contents = context.split("\n\n") if context else []

    return JSONResponse(
        {
            "success": True,
            "query": req.query,
            "scene": req.scene,
            "contents": contents,
            "context": context,
            "count": len(contents),
        }
    )
