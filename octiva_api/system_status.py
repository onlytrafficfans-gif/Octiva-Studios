from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .models import EngineStatus, Project, WORKSPACE_ROOT


RUNTIME_RESULTS_PATH = WORKSPACE_ROOT / "system" / "runtime-results.json"


def load_runtime_results(path: Path = RUNTIME_RESULTS_PATH) -> tuple[dict[str, Any], bool]:
    """Load measured runtime evidence without turning a missing or malformed record into a pass."""
    if not path.exists() or not path.is_file():
        return {}, False
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}, False
    return (payload, True) if isinstance(payload, dict) else ({}, False)


def engine_evidence(engine_id: str, report: dict[str, Any]) -> dict[str, Any]:
    engines = report.get("engines")
    item = engines.get(engine_id) if isinstance(engines, dict) else None
    reported_at = report.get("generated_at") or report.get("timestamp")

    if not isinstance(item, dict):
        return {"state": "UNPROVEN", "reported_at": reported_at}

    status = item.get("status")
    generation_id = item.get("generation_id")
    byte_count = item.get("bytes")
    has_playable_artifact = status == "PASS" and isinstance(generation_id, str) and isinstance(byte_count, int) and byte_count > 44
    if has_playable_artifact:
        return {
            "state": "VERIFIED",
            "reported_at": reported_at,
            "generation_id": generation_id,
            "bytes": byte_count,
            "elapsed_seconds": item.get("elapsed_seconds"),
        }
    if isinstance(status, str) and status.startswith("BLOCKED"):
        return {"state": "BLOCKED", "reported_at": reported_at}
    return {"state": "UNPROVEN", "reported_at": reported_at}


def build_system_audit(
    engine_statuses: list[EngineStatus],
    projects: list[Project],
    runtime_report: dict[str, Any],
    runtime_report_available: bool,
    build_sha: str | None = None,
) -> dict[str, Any]:
    evidence_by_engine = {status.id: engine_evidence(status.id, runtime_report) for status in engine_statuses}
    engine_payload = [
        {
            **status.model_dump(),
            "runtime_evidence": evidence_by_engine[status.id],
        }
        for status in engine_statuses
    ]
    ready_count = sum(status.state == "READY" for status in engine_statuses)
    verified_count = sum(item["runtime_evidence"]["state"] == "VERIFIED" for item in engine_payload)
    generation_count = sum(len(project.generations) for project in projects)

    findings: list[dict[str, str]] = []
    for item in engine_payload:
        if item["state"] != "READY":
            findings.append({
                "id": f"engine-{item['id']}-not-ready",
                "severity": "HIGH",
                "area": "Engine readiness",
                "title": f"{item['name']} is {item['state']}",
                "evidence": item.get("blocker") or "The engine did not report READY from the live adapter check.",
                "required_fix": "Resolve the stated live blocker, then refresh the System / Audit view.",
            })
        elif item["runtime_evidence"]["state"] != "VERIFIED":
            findings.append({
                "id": f"engine-{item['id']}-runtime-unproven",
                "severity": "CRITICAL",
                "area": "Runtime acceptance",
                "title": f"{item['name']} has no verified playable-audio evidence",
                "evidence": "The live readiness check is not a playable-audio acceptance result.",
                "required_fix": "Run the runtime acceptance harness and retain a non-empty audio artifact record for this engine.",
            })

    all_engines_ready = bool(engine_payload) and ready_count == len(engine_payload)
    all_engines_verified = bool(engine_payload) and verified_count == len(engine_payload)
    return {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "verdict": "RUNTIME_READY" if all_engines_ready and all_engines_verified else "NOT_READY",
        "build": {
            "state": "AVAILABLE" if build_sha else "UNAVAILABLE",
            "commit": build_sha,
        },
        "runtime": {
            "acceptance_report": "AVAILABLE" if runtime_report_available else "UNAVAILABLE",
            "active_generation": {
                "state": "UNAVAILABLE",
                "reason": "The current synchronous generation API does not publish in-progress telemetry.",
            },
        },
        "summary": {
            "engine_count": len(engine_payload),
            "ready_engine_count": ready_count,
            "verified_runtime_count": verified_count,
            "project_count": len(projects),
            "generation_count": generation_count,
        },
        "engines": engine_payload,
        "findings": findings,
    }


def build_status() -> dict[str, str | None]:
    build_sha = os.getenv("OCTIVA_BUILD_SHA")
    return {
        "state": "AVAILABLE" if build_sha else "UNAVAILABLE",
        "commit": build_sha,
        "reason": None if build_sha else "Set OCTIVA_BUILD_SHA during deployment to publish a build identifier.",
    }
