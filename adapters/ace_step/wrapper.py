from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests


def main() -> int:
    request_path = Path(os.environ["OCTIVA_REQUEST"])
    output_dir = Path(os.environ["OCTIVA_OUTPUT_DIR"])
    result_path = Path(os.environ["OCTIVA_RESULT"])
    base = os.getenv("OCTIVA_ACE_API", "http://127.0.0.1:8001").rstrip("/")
    timeout = int(os.getenv("OCTIVA_ENGINE_TIMEOUT", "1800"))

    request = json.loads(request_path.read_text(encoding="utf-8"))
    payload = {
        "prompt": request.get("prompt", ""),
        "lyrics": request.get("lyrics", ""),
        "thinking": True,
        "audio_format": "wav",
        "use_random_seed": request.get("seed") is None,
        "seed": request.get("seed") if request.get("seed") is not None else -1,
        "batch_size": 1,
    }
    if request.get("bpm") is not None:
        payload["bpm"] = request["bpm"]
    if request.get("key"):
        payload["key_scale"] = request["key"]
    if request.get("duration") is not None:
        payload["audio_duration"] = request["duration"]
    if request.get("reference_audio"):
        payload["reference_audio_path"] = request["reference_audio"]

    response = requests.post(f"{base}/release_task", json=payload, timeout=60)
    response.raise_for_status()
    envelope = response.json()
    if envelope.get("code") != 200:
        raise RuntimeError(envelope.get("error") or "ACE-Step task submission failed")
    task_id = envelope["data"]["task_id"]

    started = time.time()
    item = None
    while time.time() - started < timeout:
        query = requests.post(f"{base}/query_result", json={"task_id_list": [task_id]}, timeout=60)
        query.raise_for_status()
        q = query.json()
        rows = q.get("data") or []
        if rows:
            item = rows[0]
            status = int(item.get("status", 0))
            if status == 1:
                break
            if status == 2:
                raise RuntimeError(item.get("progress_text") or "ACE-Step generation failed")
        time.sleep(2)
    else:
        raise TimeoutError(f"ACE-Step task {task_id} exceeded {timeout}s")

    result_rows = json.loads(item.get("result") or "[]")
    if not result_rows or not result_rows[0].get("file"):
        raise RuntimeError("ACE-Step returned success without an audio file")
    remote_file = result_rows[0]["file"]
    audio = requests.get(f"{base}/v1/audio?path={quote(remote_file, safe='')}", timeout=120)
    audio.raise_for_status()
    output_dir.mkdir(parents=True, exist_ok=True)
    out = output_dir / "ace-step.wav"
    out.write_bytes(audio.content)
    if not out.exists() or out.stat().st_size == 0:
        raise RuntimeError("ACE-Step audio download was empty")

    result_path.write_text(json.dumps({
        "audio_path": str(out.resolve()),
        "task_id": task_id,
        "native_result": result_rows[0],
    }, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ACE WRAPPER ERROR: {exc}", file=sys.stderr)
        raise
