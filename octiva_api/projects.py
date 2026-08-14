from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .models import Project, WORKSPACE_ROOT


class ProjectStore:
    def __init__(self, root: Path = WORKSPACE_ROOT / "projects") -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, project_id: str) -> Path:
        return self.root / project_id / "project.json"

    def list(self) -> list[Project]:
        projects: list[Project] = []
        if not self.root.exists():
            return projects
        for path in sorted(self.root.glob("*/project.json")):
            try:
                projects.append(Project.model_validate_json(path.read_text(encoding="utf-8")))
            except Exception:
                continue
        return sorted(projects, key=lambda p: p.updated_at, reverse=True)

    def get(self, project_id: str) -> Project:
        path = self._path(project_id)
        if not path.exists():
            raise FileNotFoundError(project_id)
        return Project.model_validate_json(path.read_text(encoding="utf-8"))

    def save(self, project: Project) -> Project:
        project.updated_at = datetime.now(timezone.utc).isoformat()
        path = self._path(project.id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(project.model_dump_json(indent=2), encoding="utf-8")
        return project

    def create(self, name: str = "Untitled Project") -> Project:
        return self.save(Project(name=name))

    def delete(self, project_id: str) -> None:
        path = self._path(project_id)
        if not path.exists():
            raise FileNotFoundError(project_id)
        for child in sorted(path.parent.rglob("*"), reverse=True):
            if child.is_file() or child.is_symlink():
                child.unlink()
            elif child.is_dir():
                child.rmdir()
        path.parent.rmdir()
