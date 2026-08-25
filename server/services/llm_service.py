"""
LLM 服务 — 对接火山引擎方舟 Ark (OpenAI 兼容接口)
"""

import json
import logging
from typing import AsyncGenerator, Dict, List

import httpx

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# Ark System Prompt 模板
# ═══════════════════════════════════════════════════════════

_SYSTEM_PROMPT_TEMPLATE = """\
# 角色

# 核心任务

# 行为准则

"""


# ═══════════════════════════════════════════════════════════
# LLMService
# ═══════════════════════════════════════════════════════════


class LLMService:
    """方舟 Ark LLM 服务（OpenAI 兼容接口）"""

    def __init__(self):
        self._default_config: Dict = {}

    def configure(self, channel_config: dict) -> None:
        """运行时注入当前场景的 LLM 渠道配置。"""
        self._default_config = channel_config

    def _build_system_prompt(self, rag_context: str = "") -> str:
        blocks = [_SYSTEM_PROMPT_TEMPLATE]
        if rag_context:
            blocks.append(
                f"### 参考知识库（绝对准则）\n{rag_context.strip()}"
            )
        return "\n\n".join(blocks)

    async def chat_stream(
        self,
        history_messages: List[Dict[str, str]],
        rag_context: str = "",
        channel_config: dict | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        流式对话。

        Args:
            history_messages: 对话历史 [{"role":"user","content":"..."}, ...]
            rag_context: RAG 检索结果
            channel_config: 覆盖默认配置的渠道参数

        Yields:
            SSE chunk 字符串
        """
        config = channel_config or self._default_config
        api_key = config.get("api_key", "")
        base_url = config.get("base_url", "https://ark.cn-beijing.volces.com/api/v3")
        model = config.get("model", "doubao-seed-1-6")
        temperature = config.get("temperature", 0.3)
        max_tokens = config.get("max_tokens", 4096)

        if not api_key:
            logger.warning("LLMService: api_key 为空")
            yield _error_chunk("LLM 配置缺失：api_key 未设置")
            yield "data: [DONE]\n\n"
            return

        system_content = self._build_system_prompt(rag_context)
        messages = [{"role": "system", "content": system_content}]
        messages.extend(history_messages)

        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream_options": {"include_usage": True},
        }

        logger.info(
            "Ark stream: model=%s messages=%d rag_len=%d",
            model,
            len(messages),
            len(rag_context),
        )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST", url, headers=headers, json=payload
                ) as resp:
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
                            chunk = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue

                        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

        except Exception as e:
            logger.error("LLMService stream error: %s", e)
            yield _error_chunk(str(e))
            yield "data: [DONE]\n\n"

    async def chat(
        self,
        history_messages: List[Dict[str, str]],
        rag_context: str = "",
        channel_config: dict | None = None,
    ) -> str:
        """
        非流式对话，一次性返回完整回复。

        Args:
            history_messages: 对话历史
            rag_context: RAG 检索结果
            channel_config: 覆盖默认配置的渠道参数

        Returns:
            模型完整回复文本
        """
        config = channel_config or self._default_config
        api_key = config.get("api_key", "")
        base_url = config.get("base_url", "https://ark.cn-beijing.volces.com/api/v3")
        model = config.get("model", "doubao-seed-1-6")
        temperature = config.get("temperature", 0.3)
        max_tokens = config.get("max_tokens", 4096)

        if not api_key:
            return "LLM 配置缺失：api_key 未设置"

        system_content = self._build_system_prompt(rag_context)
        messages = [{"role": "system", "content": system_content}]
        messages.extend(history_messages)

        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        logger.info(
            "Ark non-stream: model=%s messages=%d rag_len=%d",
            model,
            len(messages),
            len(rag_context),
        )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                content = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )
                return content
        except Exception as e:
            logger.error("LLMService non-stream error: %s", e)
            return f"调用失败: {e}"


def _error_chunk(message: str) -> str:
    return f"data: {json.dumps({'error': message}, ensure_ascii=False)}\n\n"


llm_service = LLMService()
