from __future__ import annotations

import json
import os
import shutil
import subprocess
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .models import EngineCapabilities, EngineStatus, GenerationRequest, GenerationResult, WORKSPACE_ROOT


class EngineAdapter(ABC):
    id: str
    name: str

    @abstractmethod
    def status(self) -> EngineStatus: ...

    @abstractmethod
    def generate(self, request: GenerationRequest) -> GenerationResult: ...


class CommandEngineAdapter(EngineAdapter):
    """Runs a configured native engine command without pretending unsupported features exist.

    Each engine integration uses environment variables for its checkout, checkpoint and command.
    The command receives a JSON request file and output directory. The native wrapper must write
    result.json containing at minimum {"audio_path": "..."}. Missing configuration is BLOCKED.
    """

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
    ) -> None:
        self.id = engine_id
        self.name = name
        self.repo_env = repo_env
        self.command_env = command_env
        self.checkpoint_env = checkpoint_env
        self.capabilities = capabilities
        self.vram_requirement = vram_requirement

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
        if repo is None or not repo.exists():
            state = "MISSING_DEPENDENCY"
            blocker = f"Set {self.repo_env} to a verified local checkout."
        elif not command:
            state = "BLOCKED"
            blocker = f"Set {self.command_env} to the verified native wrapper command."
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

        run_dir = WORKSPACE_ROOT / "projects" / request.project_id / "generations" / self.id
        run_dir.mkdir(parents=True, exist_ok=True)
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
        audio_path = Path(payload["audio_path"])
        if not audio_path.is_absolute():
            audio_path = (self.repo / audio_path).resolve()
        if not audio_path.exists() or audio_path.stat().st_size == 0:
            raise RuntimeError(f"{self.name} reported audio that does not exist or is empty: {audio_path}")

        copied = run_dir / audio_path.name
        if audio_path != copied:
            shutil.copy2(audio_path, copied)
        return GenerationResult(
            project_id=request.project_id,
            engine=self.id,
            audio_path=str(copied),
            metadata={k: v for k, v in payload.items() if k != "audio_path"},
        )


ACE = CommandEngineAdapter(
    engine_id="ace-step",
    name="ACE-Step 1.5",
    repo_env="OCTIVA_ACE_REPO",
    command_env="OCTIVA_ACE_COMMAND",
    checkpoint_env="OCTIVA_ACE_CHECKPOINT",
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
    vram_requirement="v2-large: 22GB without prompt audio / 28GB with prompt audio per upstream README",
    capabilities=EngineCapabilities(
        generate_song=True, reference_audio=True, duration=True, lyrics=True,
    ),
)

DIFFRHYTHM = CommandEngineAdapter(
    engine_id="diffrhythm2",
    name="DiffRhythm 2",
    repo_env="OCTIVA_DIFFRHYTHM_REPO",
    command_env="OCTIVA_DIFFRHYTHM_COMMAND",
    checkpoint_env="OCTIVA_DIFFRHYTHM_CHECKPOINT",
    vram_requirement="Verify against current upstream checkpoint before runtime acceptance",
    capabilities=EngineCapabilities(generate_song=True, duration=True, lyrics=True),
)

ENGINES: dict[str, EngineAdapter] = {e.id: e for e in (ACE, LEVO, DIFFRHYTHM)}
