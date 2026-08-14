from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def normalize_lyrics(text: str) -> str:
    lines = [line.rstrip() for line in text.splitlines()]
    if not any(line.strip().lower() == "[start]" for line in lines):
        lines.insert(0, "[start]")
    if not any(line.strip().lower() == "[end]" for line in lines):
        lines.append("[end]")
    return "\n".join(lines).strip() + "\n"


def main() -> int:
    request_path = Path(os.environ["OCTIVA_REQUEST"])
    output_dir = Path(os.environ["OCTIVA_OUTPUT_DIR"])
    result_path = Path(os.environ["OCTIVA_RESULT"])
    repo = Path(os.environ["OCTIVA_DIFFRHYTHM_REPO"]).resolve()
    request = json.loads(request_path.read_text(encoding="utf-8"))

    output_dir.mkdir(parents=True, exist_ok=True)
    lyrics_path = output_dir / "lyrics.lrc"
    lyrics_path.write_text(normalize_lyrics(request.get("lyrics", "")), encoding="utf-8")

    prompt = ", ".join(x for x in [request.get("genre"), request.get("mood"), request.get("prompt")] if x)
    input_jsonl = output_dir / "input.jsonl"
    input_jsonl.write_text(json.dumps({
        "song_name": "octiva",
        "style_prompt": prompt or "Original song",
        "lyrics": str(lyrics_path.resolve()),
    }, ensure_ascii=False) + "\n", encoding="utf-8")

    command = [
        sys.executable,
        "inference.py",
        "--repo-id", "ASLP-lab/DiffRhythm2",
        "--output-dir", str(output_dir.resolve()),
        "--input-jsonl", str(input_jsonl.resolve()),
        "--cfg-strength", os.getenv("OCTIVA_DIFFRHYTHM_CFG", "2.0"),
    ]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo) + os.pathsep + env.get("PYTHONPATH", "")
    completed = subprocess.run(command, cwd=repo, env=env, capture_output=True, text=True)
    (output_dir / "native.stdout.log").write_text(completed.stdout or "", encoding="utf-8")
    (output_dir / "native.stderr.log").write_text(completed.stderr or "", encoding="utf-8")
    if completed.returncode != 0:
        raise RuntimeError("DiffRhythm 2 inference failed; inspect native.stderr.log")

    audio_exts = {".wav", ".flac", ".mp3", ".ogg", ".m4a"}
    candidates = sorted(
        [p for p in output_dir.rglob("*") if p.is_file() and p.suffix.lower() in audio_exts],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates or candidates[0].stat().st_size == 0:
        raise RuntimeError("DiffRhythm 2 completed without a non-empty audio file")

    result_path.write_text(json.dumps({
        "audio_path": str(candidates[0].resolve()),
        "native_input": str(input_jsonl.resolve()),
    }, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"DIFFRHYTHM WRAPPER ERROR: {exc}", file=sys.stderr)
        raise
