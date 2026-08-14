# Octiva Studios

Octiva Studios is a local-first, multi-engine AI music creation and production platform.

## Core idea

Octiva Studios is the product. Open-source music models are replaceable backend engines.

Initial engine targets:

- ACE-Step 1.5 / 1.5 XL — https://github.com/ace-step/ACE-Step-1.5
- LeVo 2 / SongGeneration 2 — https://github.com/tencent-ailab/SongGeneration
- DiffRhythm 2 — https://github.com/ASLP-lab/DiffRhythm2

## Build order

1. Verify upstream repositories and licenses.
2. Install each engine independently.
3. Produce real playable audio with each engine.
4. Benchmark and document results.
5. Reskin working native interfaces with the Octiva theme.
6. Add standardized adapters.
7. Build the unified Octiva Studios dashboard.
8. Connect real engines and test end-to-end.

No mock generators, fake outputs, placeholder model responses, or fake success states.

## Architecture

```text
octiva-studios/
├── adapters/
│   ├── base/
│   ├── ace_step/
│   ├── levo2/
│   └── diffrhythm2/
├── dashboard/
├── docs/
├── engines/
├── scripts/
├── shared-theme/
├── test-output/
└── workspace/
```

The upstream model repositories should remain isolated from Octiva's application code and retain their own Git history and dependencies.

## Product direction

Octiva should feel simple at first launch, with a fast song-generation flow, then reveal deeper production tools after a track is created or imported.

Planned product areas:

- Create
- Projects
- Studio
- Library
- Lyrics
- Stems
- Vocals
- Mix
- Master
- Engines
- Settings

The long-term value is Octiva's interface, workflow, project system, routing layer, production tools, and ability to adopt better engines over time.
