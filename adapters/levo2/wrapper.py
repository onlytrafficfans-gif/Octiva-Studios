from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def normalize_sections(text: str) -> str:
    return text.strip()


def main() -> int:
    request_path = Path(os.environ["OCTIVA_REQUEST"])
    output_dir = Path(os.environ["OCTIVA_OUTPUT_DIR"])
    result_path = Path(os.environ["OCTIVA_RESULT"])
    repo = Path(os.environ["OCTIVA_LEVO_REPO"]).resolve()
    ckpt = os.getenv("OCTIVA_LEVO_CKPT_PATH")
    if not ckpt:
        raise RuntimeError("OCTIVA_LEVO_CKPT_PATH must point to the downloaded SongGeneration v2 checkpoint")

    request = json.loads(request_path.read_text(encoding="utf-8"))
    output_dir.mkdir(parents=True, exist_ok=True)
    input_path = output_dir / "input.jsonl"
    description = ", ".join(x for x in [request.get("genre"), request.get("mood"), request.get("prompt")] if x)
    native = {
        "idx": "octiva",
        "gt_lyric": normalize_sections(request.get("lyrics", "")),
    }
    if request.get("reference_audio"):
        native["prompt_audio_path"] = str(Path(request["reference_audio"]).resolve())
    elif description:
        native["descriptions"] = description
    input_path.write_text(json.dumps(native, ensure_ascii=False) + "\n", encoding="utf-8")

    # Upstream documents: sh generate.sh ckpt_path lyrics.jsonl output_path [flags]
    command = ["sh", "generate.sh", str(Path(ckpt).resolve()), str(input_path.resolve()), str(output_dir.resolve())]
    if request.get("instrumental"):
        command.append("--bgm")
    if os.getenv("OCTIVA_LEVO_LOW_MEM", "0") == "1":
        command.append("--low_mem")
    if os.getenv("OCTIVA_LEVO_DISABLE_FLASH_ATTN", "0") == "1":
        command.append("--not_use_flash_attn")

    completed = subprocess.run(command, cwd=repo, capture_output=True, text=True)
    (output_dir / "native.stdout.log").write_text(completed.stdout or "", encoding="utf-8")
    (output_dir / "native.stderr.log").write_text(completed.stderr or "", encoding="utf-8")
    if completed.returncode != 0:
        raise RuntimeError("LeVo 2 generation failed; inspect native.stderr.log")

    audio_exts = {".wav", ".flac", ".mp3", ".ogg", ".m4a"}
    candidates = sorted(
        [p for p in output_dir.rglob("*") if p.is_file() and p.suffix.lower() in audio_exts],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates or candidates[0].stat().st_size == 0:
        raise RuntimeError("LeVo 2 completed without a non-empty audio file")

    result_path.write_text(json.dumps({
        "audio_path": str(candidates[0].resolve()),
        "native_input": str(input_path.resolve()),
        "native_command": command,
    }, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"LEVO WRAPPER ERROR: {exc}", file=sys.stderr)
        raise
