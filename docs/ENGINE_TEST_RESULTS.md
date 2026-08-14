# Engine Test Results

An engine is only `WORKING` after it produces a real playable audio file through Octiva.

## Standard runtime test

Where supported:

- Genre: Dark melodic R&B / trap
- Mood: Cinematic, emotional, reflective
- Tempo: 155 BPM
- Key: D minor
- Structure: Intro → Verse → Hook → Verse → Hook → Outro
- Lyrics: original placeholder lyrics only

The executable version of this test is `scripts/runtime-acceptance.ps1`.

## Current results — repository/GitHub environment

| Engine | Runtime status | Playable output | Generation time | Peak VRAM | Peak RAM | What is verified now | Remaining gate |
|---|---|---|---|---|---|---|---|
| ACE-Step 1.5 | BLOCKED | Not claimed | Not measured | Not measured | Not measured | Native REST adapter implemented against documented `/release_task` → `/query_result` → `/v1/audio` flow; upstream `/health` endpoint verified | Clone/install/weights/API start on target GPU and real audio generation |
| LeVo 2 | BLOCKED | Not claimed | Not measured | Not measured | Not measured | Native wrapper implemented around documented `generate.sh`; reference audio and `--bgm` mapping included | Actual upstream clone, license/checkpoint verification, NVIDIA/CUDA runtime or explicitly configured remote GPU, real audio generation |
| DiffRhythm 2 | BLOCKED | Not claimed | Not measured | Not measured | Not measured | Native wrapper implemented around documented `inference.py`; LRC and text/reference style prompt mapping included | Install `espeak-ng` + dependencies on target runtime, download weights on first run, real audio generation |

## Why these are BLOCKED rather than FAILED

The current GitHub/ChatGPT execution environment does not expose the user's target GPU, model weights, or persistent local model processes. The project specification forbids treating server/UI availability or code construction as successful model generation, so no audio-quality, lyric-accuracy, structure, speed, VRAM or RAM score is invented here.

## Required measured update

After running on the target machine, `docs/RUNTIME_ACCEPTANCE_RESULTS.json` must be generated and this table must be updated with:

- exact engine checkout commit
- exact checkpoint
- output file and byte size
- generation wall time
- peak VRAM/RAM where measurable
- vocal quality listening note
- lyric accuracy listening note
- song structure listening note
- stability/errors/fixes

Only then may an engine's status change from `BLOCKED` to `WORKING`.
