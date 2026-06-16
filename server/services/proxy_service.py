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


def _sign_request(
    access_key_id: str,
    secret_key: str,
    action: str,
    version: str,
    body: Dict[str, Any],
) -> Tuple[str, Dict[str, str], str]:
    """
    使用火山引擎 SignerV4 对请求进行签名。

    Returns:
        (url, signed_headers, body_json_string)
    """
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
    signed_headers = dict(req.headers)

    return url, signed_headers, req.body


def build_start_body(voice_chat: Dict[str, Any]) -> Dict[str, Any]:
    """构造 StartVoiceChat 的请求体"""
    return dict(voice_chat)


def build_stop_body(voice_chat: Dict[str, Any]) -> Dict[str, Any]:
    """构造 StopVoiceChat 的请求体"""
    return {
        "AppId": voice_chat.get("AppId", ""),
        "RoomId": voice_chat.get("RoomId", ""),
        "TaskId": voice_chat.get("TaskId", ""),
    }


async def proxy_request(
    action: str,
    version: str,
    access_key_id: str,
    secret_key: str,
    body: Dict[str, Any],
) -> Dict[str, Any]:
    """
    签名并发送请求到火山引擎 OpenAPI。

    Returns:
        火山引擎返回的 JSON（或 {"raw": ...}）
    """
    url, headers, body_str = _sign_request(
        access_key_id, secret_key, action, version, body
    )

    logger.info("Proxying %s request to %s", action, url)

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, content=body_str)

    try:
        return response.json()
    except Exception:
        return {"raw": response.text}
