"""
LLM 渠道转发层

火山引擎通过 CustomLLM 回调 /llm/callback，
我们把回调请求转发到真实的 LLM 服务（OpenAI / DeepSeek / 自研）。

修改渠道：编辑 _LLM_CONFIG 中的配置即可。
"""

import json
import logging
import uuid
from typing import AsyncGenerator, Dict, List

import httpx

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# LLM 渠道配置（在这里修改即可切换模型）
# ═══════════════════════════════════════════════════════════

_LLM_CONFIG = {
    "channel_id": "openai",  # 标识，仅做日志用
    "api_key": "",  # API Key（可从环境变量读取）
    "model": "gpt-4o",  # 模型名
    "base_url": "https://api.openai.com/v1",  # API 地址
    "system_prompt": "你是智能客服助手，请简洁准确地回答用户的问题。",
    "max_tokens": 4096,
    "temperature": 0.7,
}


# ═══════════════════════════════════════════════════════════
# 流式转发
# ═══════════════════════════════════════════════════════════


async def _stream_openai_compatible(
    client: httpx.AsyncClient,
    config: dict,
    messages: List[Dict[str, str]],
    max_tokens: int,
    temperature: float,
    top_p: float = 0.9,
) -> AsyncGenerator[str, None]:
    """
    调用 OpenAI 兼容接口，将 SSE chunk 转换为火山引擎 CustomLLM 规范格式。
    """
    url = f"{config['base_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": config["model"],
        "messages": messages,
        "stream": True,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "stream_options": {"include_usage": True},
    }

    session_id = str(uuid.uuid4())

    async with client.stream("POST", url, headers=headers, json=payload) as resp:
        async for line in resp.aiter_lines():
            line = line.strip()
            if not line:
                continue
            if not line.startswith("data: "):
                continue

            data_str = line[6:]
            if data_str == "[DONE]":
                yield "data: [DONE]\n\n"
                return

            try:
                openai_chunk = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            choices = openai_chunk.get("choices", [])
            ve_choices = []
            for ch in choices:
                ve_choices.append(
                    {
                        "finish_reason": ch.get("finish_reason"),
                        "index": ch.get("index", 0),
                        "delta": ch.get("delta", {}),
                    }
                )

            ve_chunk = {
                "id": session_id,
                "object": "chat.completion.chunk",
                "choices": ve_choices,
                "model": config["model"],
                "created": openai_chunk.get("created", 0),
            }

            usage = openai_chunk.get("usage")
            if usage:
                ve_chunk["usage"] = usage

            yield f"data: {json.dumps(ve_chunk, ensure_ascii=False)}\n\n"


# ═══════════════════════════════════════════════════════════
# 对外接口
# ═══════════════════════════════════════════════════════════


async def chat_completion_stream(
    messages: List[Dict[str, str]],
    max_tokens: int = 4096,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> AsyncGenerator[str, None]:
    """
    将 CustomLLM 回调请求转发到配置的 LLM 渠道，流式返回。

    Args:
        messages: 火山引擎回调的消息列表
        max_tokens, temperature, top_p: 模型参数

    Yields:
        SSE 格式字符串，符合火山引擎 CustomLLM 回调规范。
    """
    config = _LLM_CONFIG

    # 插入 system prompt（火山引擎回调的消息中没有 system role）
    full_messages = [{"role": "system", "content": config["system_prompt"]}]
    full_messages.extend(messages)

    logger.info(
        "LLM channel=%s model=%s messages=%d",
        config["channel_id"],
        config["model"],
        len(full_messages),
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        async for chunk in _stream_openai_compatible(
            client,
            config,
            full_messages,
            max_tokens,
            temperature,
            top_p,
        ):
            yield chunk
