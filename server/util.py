"""
工具模块
"""

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Optional


def interpolate_env(obj: Any) -> Any:
    """递归替换 ${VAR_NAME} 为环境变量的值。"""
    if isinstance(obj, str):
        return re.sub(r"\$\{(\w+)\}", lambda m: os.getenv(m.group(1), ""), obj)
    if isinstance(obj, dict):
        return {k: interpolate_env(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [interpolate_env(item) for item in obj]
    return obj


def read_files(dir_path: str, suffix: str = ".json") -> Dict[str, Any]:
    """
    读取指定目录下的场景配置文件。

    优先加载 .json（真实配置），不存在时回退到 .example.json。
    加载后自动对 ${VAR} 进行环境变量插值。
    """
    scenes: Dict[str, Any] = {}
    base_dir = Path(__file__).parent / dir_path

    if not base_dir.exists():
        return scenes

    # 优先加载用户真实配置
    for file_path in base_dir.iterdir():
        if file_path.suffix == suffix and not file_path.stem.endswith(".example"):
            scenes[file_path.stem] = interpolate_env(
                json.loads(file_path.read_text("utf-8"))
            )

    # 回退到示例模板
    for file_path in base_dir.iterdir():
        if file_path.suffix == suffix and file_path.stem.endswith(".example"):
            stem = file_path.stem.replace(".example", "")
            if stem not in scenes:
                scenes[stem] = interpolate_env(json.loads(file_path.read_text("utf-8")))

    return scenes


def wrapper_response(
    success: bool = True,
    action: str = "",
    result: Any = None,
    error: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """构造统一格式的 JSON 响应。"""
    meta: Dict[str, Any] = {"Action": action}
    if request_id:
        meta["RequestId"] = request_id
    if error:
        meta["Error"] = error
    resp: Dict[str, Any] = {"ResponseMetadata": meta}
    if not error and result is not None:
        resp["Result"] = result
    return resp
