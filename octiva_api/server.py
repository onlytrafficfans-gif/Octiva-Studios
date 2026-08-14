from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .engines import ENGINES
from .models import GenerationRequest, Project
from .projects import ProjectStore
from .router import AutoRouter

app = FastAPI(title="Octiva Studios", version="0.1.0")
store = ProjectStore()
router = AutoRouter()


@app.get("/api/health")
def health() -> dict[str, object]:
    return {"ok": True, "product": "Octiva Studios", "engines": [e.status() for e in ENGINES.values()]}


@app.get("/api/engines")
def engines():
    return [engine.status() for engine in ENGINES.values()]


@app.get("/api/projects")
def list_projects():
    return store.list()


@app.post("/api/projects")
def create_project(payload: dict[str, str] | None = None):
    return store.create((payload or {}).get("name", "Untitled Project"))


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    try:
        return store.get(project_id)
    except FileNotFoundError:
        raise HTTPException(404, "Project not found")


@app.put("/api/projects/{project_id}")
def update_project(project_id: str, project: Project):
    if project.id != project_id:
        raise HTTPException(400, "Project id mismatch")
    return store.save(project)


@app.post("/api/generate")
def generate(request: GenerationRequest):
    try:
        project = store.get(request.project_id)
    except FileNotFoundError:
        raise HTTPException(404, "Project not found")
    try:
        engine = router.choose(request)
        result = engine.generate(request)
    except RuntimeError as exc:
        raise HTTPException(409, str(exc))

    project.prompt = request.prompt
    project.lyrics = request.lyrics
    project.bpm = request.bpm
    project.key = request.key
    project.seed = request.seed
    project.generations.append(result)
    store.save(project)
    return result


@app.get("/api/audio/{project_id}/{engine_id}/{filename}")
def audio(project_id: str, engine_id: str, filename: str):
    path = Path("workspace") / "projects" / project_id / "generations" / engine_id / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(404, "Audio not found")
    return FileResponse(path)


ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "dashboard"
THEME = ROOT / "shared-theme"
if THEME.exists():
    app.mount("/theme", StaticFiles(directory=THEME), name="theme")
if DASHBOARD.exists():
    app.mount("/assets", StaticFiles(directory=DASHBOARD), name="assets")

    @app.get("/")
    def index():
        return FileResponse(DASHBOARD / "index.html")
