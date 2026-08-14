# Codex Handoff — Octiva Studios

Codex should execute the engine bring-up work in this order and commit verified results back to this repository.

## Upstream engines

1. ACE-Step 1.5 — https://github.com/ace-step/ACE-Step-1.5
2. LeVo 2 / SongGeneration 2 — https://github.com/tencent-ailab/SongGeneration
3. DiffRhythm 2 — https://github.com/ASLP-lab/DiffRhythm2

## Required sequence

CLONE → VERIFY → INSTALL → GENERATE REAL AUDIO → TEST → RESKIN → ADAPT → UNIFY → END-TO-END TEST

Do not build the final dashboard before the engines have been tested independently.

## Workspace recommendation

Keep Octiva and upstream engines as sibling repositories:

```text
octiva-workspace/
├── Octiva-Studios/
└── engines/
    ├── ACE-Step-1.5/
    ├── SongGeneration/
    └── DiffRhythm2/
```

Do not vendor the upstream repositories into Octiva's Git history.

## Before installing

Detect OS, CPU, RAM, GPU, VRAM, driver, CUDA, ROCm, Python versions and disk space. Follow current upstream documentation. Do not guess commands or force CUDA packages onto AMD hardware.

Update `docs/ENGINE_MATRIX.md` with verified information before deep integration.

## Working definition

An engine is WORKING only after it produces a playable audio file. A loading UI or healthy HTTP process alone does not count.

Save tests outside Git tracking or under ignored output paths and update `docs/ENGINE_TEST_RESULTS.md` with results.

## Reskin rule

Only reskin after an engine works. Use Octiva tokens and branding, but avoid rewriting model inference logic for appearance.

## Adapter rule

Implement the contract in `adapters/base/README.md`. Never expose unsupported capabilities in the dashboard.

## Final product

Octiva Studios should provide a simple Create experience first, then deeper Studio tools including Projects, Lyrics, Stems, Vocals, Mix, Master, Engines and Settings.

No mock generators or placeholder audio may be used to claim completion.
