"""
Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
SPDX-license-identifier: BSD-3-Clause

火山引擎 RTC Token 生成模块
参考: https://github.com/volcengine/volc-sdk-python
"""

import base64
import hashlib
import hmac
import struct
import time
import os
from typing import Dict, Optional

VERSION = b"001"


class Privileges:
    """RTC Token 权限定义"""

    PublishStream = 0
    PublishAudioStream = 1
    PublishVideoStream = 2
    PublishDataStream = 3
    SubscribeStream = 4


def _encode_hmac(key: bytes, message: bytes) -> bytes:
    """HMAC-SHA256 签名"""
    return hmac.new(key, message, hashlib.sha256).digest()


class AccessToken:
    """RTC 访问令牌"""

    def __init__(self, app_id: str, app_key: str, room_id: str, user_id: str):
        self.app_id = app_id
        self.app_key = app_key.encode() if isinstance(app_key, str) else app_key
        self.room_id = room_id
        self.user_id = user_id
        self.issued_at = int(time.time())
        self.nonce = int.from_bytes(os.urandom(4), "big")
        self.expire_at = 0
        self._privileges: Dict[int, int] = {}

    def add_privilege(self, privilege: int, expire_timestamp: int) -> None:
        """添加权限"""
        self._privileges[privilege] = expire_timestamp
        if privilege == Privileges.PublishStream:
            self._privileges[Privileges.PublishAudioStream] = expire_timestamp
            self._privileges[Privileges.PublishVideoStream] = expire_timestamp
            self._privileges[Privileges.PublishDataStream] = expire_timestamp

    def expire_time(self, expire_timestamp: int) -> None:
        """设置令牌过期时间"""
        self.expire_at = expire_timestamp

    def _pack_msg(self) -> bytes:
        """打包消息体"""
        buf = _ByteBuf()
        buf.put_uint32(self.nonce)
        buf.put_uint32(self.issued_at)
        buf.put_uint32(self.expire_at)
        buf.put_string(self.room_id)
        buf.put_string(self.user_id)
        buf.put_tree_map_uint32(self._privileges)
        return buf.pack()

    def serialize(self) -> str:
        """生成 token 字符串"""
        msg_bytes = self._pack_msg()
        signature = _encode_hmac(self.app_key, msg_bytes)
        content = _ByteBuf().put_bytes(msg_bytes).put_bytes(signature).pack()
        return VERSION.decode() + self.app_id + base64.b64encode(content).decode()


class _ByteBuf:
    """二进制缓冲区"""

    def __init__(self):
        self.buffer = bytearray(1024)
        self.position = 0

    def pack(self) -> bytes:
        return bytes(self.buffer[: self.position])

    def put_uint16(self, v: int):
        struct.pack_into("<H", self.buffer, self.position, v)
        self.position += 2
        return self

    def put_uint32(self, v: int):
        struct.pack_into("<I", self.buffer, self.position, v)
        self.position += 4
        return self

    def put_bytes(self, data: bytes):
        length = len(data)
        self.put_uint16(length)
        self.buffer[self.position : self.position + length] = data
        self.position += length
        return self

    def put_string(self, s: str):
        return self.put_bytes(s.encode("utf-8"))

    def put_tree_map_uint32(self, m: Dict[int, int]):
        if not m:
            self.put_uint16(0)
            return self
        self.put_uint16(len(m))
        for key, value in m.items():
            self.put_uint16(key)
            self.put_uint32(value)
        return self
