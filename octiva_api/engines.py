from __future__ import annotations

import json
import os
import shutil
import subprocess
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
from uuid import uuid4

import requests

from .models import EngineCapabilities, EngineStatus, GenerationRequest, GenerationResult, WORKSPACE_ROOT


class EngineAdapter(ABC):
    id: str
    name: str

    @abstractmethod
    def status(self) -> EngineStatus: ...

    @abstractmethod
    def generate(self, request: GenerationRequest) -> GenerationResult: ...


class CommandEngineAdapter(EngineAdapter):
    """Run a verified native wrapper command and reject missing prerequisites/output."""

    def __init__(
        self,
        *,
        engine_id: str,
        name: str,
        repo_env: str,
        command_env: str,
        checkpoint_env: str,
        capabilities: EngineCapabilities,
        vram_requirement: str,
        required_envs: tuple[str, ...] = (),
        required_executables: tuple[str, ...] = (),
        health_url_env: str | None = None,
        health_path: str = "/health",
    ) -> None:
        self.id = engine_id
        self.name = name
        self.repo_env = repo_env
        self.command_env = command_env
        self.checkpoint_env = checkpoint_env
        self.capabilities = capabilities
        self.vram_requirement = vram_requirement
        self.required_envs = required_envs
        self.required_executables = required_executables
        self.health_url_env = health_url_env
        self.health_path = health_path

    @property
    def repo(self) -> Path | None:
        value = os.getenv(self.repo_env)
        return Path(value).expanduser() if value else None

    def status(self) -> EngineStatus:
        repo = self.repo
        command = os.getenv(self.command_env)
        checkpoint = os.getenv(self.checkpoint_env)
        blocker = None
        state = "READY"

        if repo is None or not repo.exists() or not (repo / ".git").exists():
            state = "MISSING_DEPENDENCY"
            blocker = f"Set {self.repo_env} to a verified local Git checkout."
        elif not command:
            state = "BLOCKED"
            blocker = f"Set {self.command_env} to the verified native wrapper command."
        else:
            missing_envs = [key for key in self.required_envs if not os.getenv(key)]
            missing_bins = [name for name in self.required_executables if shutil.which(name) is None]
            if missing_envs:
                state = "MISSING_MODEL"
                blocker = "Missing required configuration: " + ", ".join(missing_envs)
            elif missing_bins:
                state = "MISSING_DEPENDENCY"
                blocker = "Missing executable(s): " + ", ".join(missing_bins)
            elif self.health_url_env:
                base = os.getenv(self.health_url_env, "").rstrip("/")
                if not base:
                    state = "OFFLINE"
                    blocker = f"{self.health_url_env} is not configured."
                else:
                    try:
                        response = requests.get(f"{base}{self.health_path}", timeout=2)
                        if response.status_code >= 400:
                            raise RuntimeError(f"HTTP {response.status_code}")
                    except Exception as exc:
                        state = "OFFLINE"
                        blocker = f"Native service health check failed at {base}{self.health_path}: {exc}"

        return EngineStatus(
            id=self.id,
            name=self.name,
            state=state,
            checkpoint=checkpoint,
            backend=str(repo) if repo else None,
            vram_requirement=self.vram_requirement,
            capabilities=self.capabilities,
            blocker=blocker,
        )

    def generate(self, request: GenerationRequest) -> GenerationResult:
        status = self.status()
        if status.state != "READY":
            raise RuntimeError(status.blocker or f"{self.name} is not ready")

        generation_id = uuid4().hex
        run_dir = WORKSPACE_ROOT / "projects" / request.project_id / "generations" / self.id / generation_id
        run_dir.mkdir(parents=True, exist_ok=False)
        request_path = run_dir / "request.json"
        result_path = run_dir / "result.json"
        request_path.write_text(request.model_dump_json(indent=2), encoding="utf-8")

        command = os.environ[self.command_env]
        env = os.environ.copy()
        env.update({
            "OCTIVA_REQUEST": str(request_path.resolve()),
            "OCTIVA_OUTPUT_DIR": str(run_dir.resolve()),
            "OCTIVA_RESULT": str(result_path.resolve()),
        })
        completed = subprocess.run(
            command,
            cwd=self.repo,
            env=env,
            shell=True,
            capture_output=True,
            text=True,
        )
        (run_dir / "stdout.log").write_text(completed.stdout or "", encoding="utf-8")
        (run_dir / "stderr.log").write_text(completed.stderr or "", encoding="utf-8")
        if completed.returncode != 0:
            raise RuntimeError(f"{self.name} generation failed; see {run_dir / 'stderr.log'}")
        if not result_path.exists():
            raise RuntimeError(f"{self.name} wrapper did not create {result_path}")

        payload: dict[str, Any] = json.loads(result_path.read_text(encoding="utf-8"))
        if "audio_path" not in payload:
            raise RuntimeError(f"{self.name} wrapper result lacks audio_path")
        audio_path = Path(payload["audio_path"])
        if not audio_path.is_absolute():
            audio_path = (self.repo / audio_path).resolve()
        if not audio_path.exists() or audio_path.stat().st_size == 0:
            raise RuntimeError(f"{self.name} reported audio that does not exist or is empty: {audio_path}")

        copied = run_dir / audio_path.name
        if audio_path.resolve() != copied.resolve():
            shutil.copy2(audio_path, copied)
        return GenerationResult(
            id=generation_id,
            project_id=request.project_id,
            engine=self.id,
            audio_path=str(copied.resolve()),
            metadata={k: v for k, v in payload.items() if k != "audio_path"},
        )


ACE = CommandEngineAdapter(
    engine_id="ace-step",
    name="ACE-Step 1.5",
    repo_env="OCTIVA_ACE_REPO",
    command_env="OCTIVA_ACE_COMMAND",
    checkpoint_env="OCTIVA_ACE_CHECKPOINT",
    health_url_env="OCTIVA_ACE_API",
    vram_requirement="2B: <4GB possible; XL: >=12GB with offload/quantization per upstream docs",
    capabilities=EngineCapabilities(
        generate_song=True, generate_instrumental=True, continue_song=True, remix_song=True,
        edit_section=True, reference_audio=True, bpm=True, key=True, duration=True,
        stems=True, lrc=True,
    ),
)

LEVO = CommandEngineAdapter(
    engine_id="levo2",
    name="LeVo 2 / SongGeneration 2",
    repo_env="OCTIVA_LEVO_REPO",
    command_env="OCTIVA_LEVO_COMMAND",
    checkpoint_env="OCTIVA_LEVO_CHECKPOINT",
    required_envs=("OCTIVA_LEVO_CKPT_PATH",),
    required_executables=("sh",),
    vram_requirement="v2-large: 22GB without prompt audio / 28GB with prompt audio per upstream README",
    capabilities=EngineCapabilities(
        generate_song=True, generate_instrumental=True, reference_audio=True, duration=True, lyrics=True,
    ),
)

DIFFRHYTHM = CommandEngineAdapter(
    engine_id="diffrhythm2",
    name="DiffRhythm 2",
    repo_env="OCTIVA_DIFFRHYTHM_REPO",
    command_env="OCTIVA_DIFFRHYTHM_COMMAND",
    checkpoint_env="OCTIVA_DIFFRHYTHM_CHECKPOINT",
    required_executables=("espeak-ng",),
    vram_requirement="Verify against current upstream checkpoint before runtime acceptance",
    capabilities=EngineCapabilities(generate_song=True, reference_audio=True, lyrics=True),
)

ENGINES: dict[str, EngineAdapter] = {e.id: e for e in (ACE, LEVO, DIFFRHYTHM)}
