# System / Audit API

Octiva’s System / Audit data is a **live operational contract**, not a hand-maintained product-status document. Consumers, including the mobile Octiva Control companion, must display unavailable or unproven states exactly as returned rather than substituting cached audit claims.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/system/audit` | Canonical live System / Audit payload. `GET /api/audit` is a compatible alias. |
| `GET /api/engines` | Live adapter readiness checks and capability flags. |
| `GET /api/projects` | Disk-backed project records and generation history. |
| `GET /api/runtime-results` | The latest measured runtime-acceptance record, if one exists. |
| `GET /api/build-status` | Deployment build identifier, when `OCTIVA_BUILD_SHA` is configured. |

## Readiness rules

`READY` is an adapter-precondition result. It establishes that the configured checkout, command, dependencies, and applicable health check are currently acceptable. It does **not** prove that the engine has generated a valid song.

`runtime_evidence.state = VERIFIED` requires a runtime-acceptance record with a `PASS` status, a generation identifier, and a non-empty audio response larger than a WAV header. A missing, malformed, stale, or incomplete record returns `UNPROVEN` or `BLOCKED`; it must never become `VERIFIED` by inference.

The top-level `verdict` is `RUNTIME_READY` only when every reported engine is currently `READY` **and** has verified runtime evidence. Otherwise it is `NOT_READY`.

## Runtime acceptance record

The committed acceptance harness writes its mutable result to `workspace/system/runtime-results.json`. The workspace is intentionally ignored by Git because it contains machine-local operational evidence. The record has a versioned shape:

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-08-14T00:00:00.0000000Z",
  "octiva": "PASS",
  "engines": {
    "ace-step": {
      "status": "PASS",
      "generation_id": "immutable-generation-id",
      "bytes": 123456,
      "elapsed_seconds": 42.8
    }
  },
  "persistence": "PASS (disk-backed reload via API)"
}
```

The current generation API is synchronous and does not publish in-progress work telemetry. `runtime.active_generation.state` is therefore `UNAVAILABLE` until the backend introduces a measured job-status mechanism. Consumers must show that limitation rather than simulate a progress bar.
