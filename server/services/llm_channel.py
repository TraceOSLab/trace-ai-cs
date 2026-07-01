"""
LLM 渠道转发层

火山引擎通过 CustomLLM 回调 /llm/callback，
我们将请求转发到 RAG 检索 + LLM 服务。

流程：用户消息 → RAG 检索 → 拼接 system prompt → 调用 LLM → SSE 流式返回
"""

import logging
from typing import AsyncGenerator, Dict, List

from .llm_service import llm_service
from .rag_service import rag_service

logger = logging.getLogger(__name__)


async def chat_completion_stream(
    messages: List[Dict[str, str]],
    llm_config: dict,
    rag_config: dict | None = None,
    access_key_id: str = "",
    secret_key: str = "",
) -> AsyncGenerator[str, None]:
    """
    执行 RAG 检索 + LLM 流式调用。

    Args:
        messages: 火山引擎回调的消息列表 (无 system role)
        llm_config: LLM 渠道配置 (api_key, base_url, model, temperature, max_tokens)
        rag_config: RAG 配置 (collection_name, project_name, account_id 等)，None 则跳过检索
        access_key_id: 火山引擎 AK (用于 RAG 签名)
        secret_key: 火山引擎 SK (用于 RAG 签名)

    Yields:
        SSE 格式字符串
    """
    # 注入 LLM 配置
    llm_service.configure(llm_config)

    # RAG 检索
    rag_context = ""
    if rag_config and rag_config.get("enabled", True):
        # 取最后一条 user 消息作为查询
        user_query = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_query = msg.get("content", "")
                break

        if user_query:
            rag_context = await rag_service.retrieve(
                query=user_query,
                config=rag_config,
                access_key_id=access_key_id,
                secret_key=secret_key,
            )
            logger.info("RAG context length: %d", len(rag_context))

    # LLM 流式调用
    async for chunk in llm_service.chat_stream(
        history_messages=messages,
        rag_context=rag_context,
    ):
        yield chunk
