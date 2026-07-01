"""
RAG 服务 — 对接火山引擎知识库检索
"""

import json
import logging
from collections import OrderedDict
from typing import Dict, List

import httpx
from volcengine.auth.SignerV4 import Request as V4Request  # type: ignore
from volcengine.Credentials import Credentials  # type: ignore

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# RagService
# ═══════════════════════════════════════════════════════════


class RagService:
    """火山引擎知识库检索服务"""

    def __init__(self):
        self._signer = None  # SignerV4 实例

    async def retrieve(
        self,
        query: str,
        config: Dict,
        access_key_id: str = "",
        secret_key: str = "",
    ) -> str:
        """
        检索知识库。

        Args:
            query: 用户查询语句
            config: RAG 配置 {
                collection_name, project_name, account_id, limit,
                host, region, service
            }
            access_key_id: 火山引擎 AK
            secret_key: 火山引擎 SK

        Returns:
            拼接后的上下文文本
        """
        collection_name = config.get("collection_name", "dw_ai")
        project_name = config.get("project_name", "default")
        account_id = config.get("account_id", "")
        limit = config.get("limit", 3)
        host = config.get("host", "api-knowledgebase.mlp.cn-beijing.volces.com")
        region = config.get("region", "cn-north-1")
        service = config.get("service", "air")

        if not access_key_id or not secret_key or not account_id:
            logger.warning("RagService: 配置缺失 (ak/sk/account_id)")
            return ""

        path = "/api/knowledge/collection/search_knowledge"
        body = {
            "project": project_name,
            "name": collection_name,
            "query": query,
            "limit": limit,
            "pre_processing": {
                "need_instruction": True,
                "return_token_usage": True,
                "messages": [{"role": "user", "content": query}],
            },
            "post_processing": {"get_attachment_link": True},
        }

        headers = OrderedDict()
        headers["Host"] = host
        headers["Content-Type"] = "application/json"
        headers["V-Account-Id"] = account_id

        try:
            # SignerV4 签名
            from volcengine.auth.SignerV4 import SignerV4

            signer = SignerV4()
            req = V4Request()
            req.method = "POST"
            req.host = host
            req.path = path
            req.headers = headers
            req.body = json.dumps(body)
            req.query = OrderedDict()

            credentials = Credentials(access_key_id, secret_key, service, region)
            signer.sign(req, credentials)

            url = f"https://{host}{path}"
            signed_headers = dict(req.headers)

            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    headers=signed_headers,
                    json=body,
                    timeout=15.0,
                )

            if resp.status_code != 200:
                logger.error(
                    "RagService: HTTP %d — %s", resp.status_code, resp.text[:300]
                )
                return ""

            data = resp.json()
            result_list = data.get("data", {}).get("result_list", [])
            contents: List[str] = [
                item.get("content", "")
                for item in result_list
                if item.get("content")
            ]

            if not contents:
                logger.info("RagService: 未检索到匹配内容")
                return ""

            context_text = "\n\n".join(contents)
            logger.info("RagService: 检索到 %d 条内容", len(contents))
            return context_text

        except Exception as e:
            logger.error("RagService 异常: %s", e)
            return ""


rag_service = RagService()
