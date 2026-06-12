"""
Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
SPDX-license-identifier: BSD-3-Clause

工具模块
"""

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Optional


def interpolate_env(obj: Any) -> Any:
    """递归替换 JSON 中的 ${VAR_NAME} 为环境变量的值（用于加载 .env 中的账号级凭证）。"""
    if isinstance(obj, str):
        return re.sub(r'\$\{(\w+)\}', lambda m: os.getenv(m.group(1), ''), obj)
    elif isinstance(obj, dict):
        return {k: interpolate_env(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [interpolate_env(item) for item in obj]
    return obj


def read_files(dir_path: str, suffix: str = ".json") -> Dict[str, Any]:
    """
    读取指定目录下的场景配置文件。

    优先加载 .json（真实配置，被 gitignore），
    如果 .json 不存在则回退到 .example.json（模板文件）。

    加载后会对数据中的 ${VAR} 进行 env 插值。
    """
    scenes: Dict[str, Any] = {}
    base_dir = Path(__file__).parent / dir_path

    if not base_dir.exists():
        return scenes

    # 第一遍：加载 .json 文件（用户真实配置）
    for file_path in base_dir.iterdir():
        if file_path.suffix == suffix and not file_path.stem.endswith('.example'):
            scene_name = file_path.stem
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            scenes[scene_name] = interpolate_env(data)

    # 第二遍：如果同名的 .json 不存在，回退到 .example.json
    for file_path in base_dir.iterdir():
        if file_path.suffix == suffix and file_path.stem.endswith('.example'):
            scene_name = file_path.stem.replace('.example', '')
            if scene_name not in scenes:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                scenes[scene_name] = interpolate_env(data)

    return scenes


def assert_not_empty(value: Any, msg: str) -> None:
    if value is None or (isinstance(value, str) and value.strip() == ''):
        raise ValueError(msg)


def wrapper_response(
    success: bool = True,
    action: str = "",
    result: Any = None,
    error: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    response_metadata: Dict[str, Any] = {"Action": action}
    if request_id:
        response_metadata["RequestId"] = request_id
    if error:
        response_metadata["Error"] = error
    response: Dict[str, Any] = {"ResponseMetadata": response_metadata}
    if not error and result is not None:
        response["Result"] = result
    return response
