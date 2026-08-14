# Octiva Studios

**Octiva Studios** is a local-first, multi-engine AI music creation and production platform. Octiva is the product; open-source music models are replaceable backend engines.

## Current status

**Octiva product/integration layer:** built and self-audited.  
**Engine runtime acceptance:** BLOCKED until the target GPU/runtime generates real audio.  
**Codex handoff:** NOT READY.

No model is marked `WORKING` because a UI or server launches. Octiva requires a real non-empty audio artifact from the engine.

See:

- `docs/BUILD_REPORT.md` — current build state
- `docs/SELF_AUDIT.md` — phase-by-phase audit and defects found/fixed
- `docs/ENGINE_MATRIX.md` — verified upstream capabilities and blockers
- `docs/ENGINE_TEST_RESULTS.md` — measured-runtime gate
- `docs/CODEX_HANDOFF.md` — locked handoff checklist

## Engines

- ACE-Step 1.5 / XL — https://github.com/ace-step/ACE-Step-1.5
- LeVo 2 / SongGeneration 2 — https://github.com/tencent-ailab/SongGeneration
- DiffRhythm 2 — https://github.com/ASLP-lab/DiffRhythm2

Upstream source stays in separate sibling repositories. Model code, weights and generated music are not vendored into Octiva.

## Architecture

```text
<parent>/
├── Octiva-Studios/
│   ├── octiva_api/          # local API, projects, routing, engine manager
│   ├── adapters/            # native ACE / LeVo / DiffRhythm wrappers
│   ├── dashboard/           # Octiva CREATE / PROJECTS / STUDIO / ENGINES UI
│   ├── shared-theme/        # Octiva visual tokens
│   ├── scripts/             # clone, inspect, start, acceptance automation
│   ├── tests/
│   └── docs/
└── octiva-engines/
    ├── ACE-Step-1.5/
    ├── SongGeneration/
    └── DiffRhythm2/
```

## What is implemented

- persistent engine-independent projects
- immutable generation history
- deterministic `AUTO` routing
- capability-aware controls
- real native adapter boundaries for all three engines
- strict missing/empty-audio rejection
- ACE native REST health and generation integration
- LeVo native `generate.sh` integration
- DiffRhythm native `inference.py` integration
- Octiva CREATE experience
- project browser
- Studio timeline/version playback
- live engine status/capability page
- premium dark DAW-inspired Octiva design system
- Windows hardware detection and launch guards
- GitHub CI and core persistence/routing tests
- real-audio runtime acceptance harness

## Windows bring-up

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\clone-engines.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\inspect-hardware.ps1
Copy-Item .env.example .env
# Review .env, especially LeVo checkpoint configuration.
powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

Then run the real acceptance test:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runtime-acceptance.ps1
```

That script must produce real audio bytes. Any unavailable engine is reported as `BLOCKED`, never converted into a fake success.

## Required phase order

`CLONE → VERIFY → INSTALL → GENERATE REAL AUDIO → TEST → RESKIN → ADAPT → UNIFY → END-TO-END TEST`

The Octiva application and integration code have been built ahead where work was independent, but **native engine UI reskins and final acceptance remain gated behind real engine generation**.

## Product direction

Octiva opens with a simple song-generation workflow, then exposes deeper production surfaces: Projects, Studio, Lyrics, Stems, Vocals, Mix, Master and Engines. Unsupported backend functionality is not rendered as a working control.

The long-term product value is Octiva's workflow, project memory, routing, production UX and ability to replace engines without rebuilding the studio.
