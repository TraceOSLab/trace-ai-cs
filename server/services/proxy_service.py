"""
代理服务 — 构造并签名火山引擎 OpenAPI 请求
"""

import json
import logging
from collections import OrderedDict
from typing import Any, Dict, Tuple

import httpx
from volcengine.auth.SignerV4 import SignerV4, Request as V4Request
from volcengine.Credentials import Credentials

logger = logging.getLogger(__name__)


async def proxy_request(
    action: str,
    version: str,
    access_key_id: str,
    secret_key: str,
    body: Dict[str, Any],
) -> Dict[str, Any]:
    """签名并发送请求到火山引擎 OpenAPI。"""
    signer = SignerV4()
    req = V4Request()
    req.method = "POST"
    req.host = "rtc.volcengineapi.com"
    req.path = "/"
    req.headers = OrderedDict()
    req.headers["Host"] = "rtc.volcengineapi.com"
    req.headers["Content-Type"] = "application/json"
    req.query = OrderedDict()
    req.query["Action"] = action
    req.query["Version"] = version
    req.body = json.dumps(body)

    credentials = Credentials(access_key_id, secret_key, "rtc", "cn-north-1")
    signer.sign(req, credentials)

    url = f"https://rtc.volcengineapi.com?Action={action}&Version={version}"

    logger.info("Proxying %s request to %s", action, url)

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=dict(req.headers), content=req.body)

    try:
        return response.json()
    except Exception:
        return {"raw": response.text}
