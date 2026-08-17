from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


EngineId = Literal["auto", "ace-step", "levo2", "diffrhythm2"]
EngineState = Literal[
    "READY",
    "LOADING",
    "GENERATING",
    "OFFLINE",
    "MISSING_MODEL",
    "MISSING_DEPENDENCY",
    "INSUFFICIENT_VRAM",
    "UNSUPPORTED_HARDWARE",
    "BLOCKED",
]


class EngineCapabilities(BaseModel):
    generate_song: bool = False
    generate_instrumental: bool = False
    continue_song: bool = False
    remix_song: bool = False
    edit_section: bool = False
    reference_audio: bool = False
    bpm: bool = False
    key: bool = False
    duration: bool = False
    lyrics: bool = True
    stems: bool = False
    lrc: bool = False


class EngineStatus(BaseModel):
    id: str
    name: str
    state: EngineState
    version: str | None = None
    checkpoint: str | None = None
    backend: str | None = None
    vram_requirement: str | None = None
    capabilities: EngineCapabilities = Field(default_factory=EngineCapabilities)
    blocker: str | None = None


class GenerationRequest(BaseModel):
    project_id: str
    engine: EngineId = "auto"
    prompt: str = ""
    lyrics: str = ""
    genre: str | None = None
    mood: str | None = None
    bpm: int | None = None
    key: str | None = None
    duration: int | None = None
    instrumental: bool = False
    reference_audio: str | None = None
    seed: int | None = None
    advanced: dict[str, Any] = Field(default_factory=dict)


class GenerationResult(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex)
    project_id: str
    engine: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    audio_path: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class Project(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex)
    name: str = "Untitled Project"
    lyrics: str = ""
    prompt: str = ""
    bpm: int | None = None
    key: str | None = None
    seed: int | None = None
    reference_files: list[str] = Field(default_factory=list)
    generations: list[GenerationResult] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def _resolve_workspace_root() -> Path:
    """Absolute workspace root.

    This must not depend on the process working directory. Generation
    directories are recorded as absolute paths inside project.json, and audio
    serving re-derives the project root to constrain what may be served. If the
    root moved with cwd, a server started from a different directory would fail
    containment checks against generations written by an earlier run.

    OCTIVA_WORKSPACE overrides the location; otherwise it is the repository's
    own `workspace/` directory.
    """
    override = os.getenv("OCTIVA_WORKSPACE")
    if override:
        return Path(override).expanduser().resolve()
    return (Path(__file__).resolve().parents[1] / "workspace").resolve()


WORKSPACE_ROOT = _resolve_workspace_root()
