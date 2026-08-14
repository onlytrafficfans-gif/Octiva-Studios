# Octiva Studios — Build Report

Date: 2026-08-14

## Current verdict

**Product/integration code: BUILT AND SELF-AUDITED.**  
**Model runtime acceptance: BLOCKED pending execution on the target GPU/runtime.**  
**Codex handoff: NOT READY.**

Octiva follows a strict rule: no model is `WORKING` until it produces a real non-empty audio artifact through the Octiva adapter.

## Upstream engines

| Engine | Repository | Reference commit currently verified | Integration |
|---|---|---|---|
| ACE-Step 1.5 | https://github.com/ace-step/ACE-Step-1.5 | `6d467e4b5081ccb0abf1ec1bf4fdf9051a2d34b0` | Async REST wrapper implemented |
| LeVo 2 / SongGeneration 2 | https://github.com/tencent-ailab/SongGeneration | Record from target clone | `generate.sh` wrapper implemented |
| DiffRhythm 2 | https://github.com/ASLP-lab/DiffRhythm2 | `7804f821b797b4f276090e1a9dcd37e97d9915d5` | `inference.py` wrapper implemented |

The runtime clone script records the actual commit checked out on the target machine; those values take precedence over reference commits in this document.

## Octiva product architecture delivered

- FastAPI local API
- engine status/capability model
- persistent engine-independent project store
- deterministic AUTO router
- native adapter wrappers for all three engines
- strict non-empty-audio success validation
- immutable generation/version history
- secured generation-ID audio serving
- Octiva CREATE dashboard
- PROJECTS view
- STUDIO timeline and audio version player
- ENGINES manager with live blockers/capabilities
- capability-gated controls so unsupported fields disappear
- shared premium dark Octiva theme
- Windows hardware inspection
- official-repo clone/update automation
- per-engine launch guards
- all-in-one local launcher
- real-audio runtime acceptance harness
- unit tests and GitHub CI
- model/audio artifact commit protection

## Native engine mappings

### ACE-Step 1.5

Octiva maps generation to ACE's native async REST service:

1. `POST /release_task`
2. poll `POST /query_result` with `task_id_list`
3. require native success
4. fetch returned audio through `/v1/audio`
5. reject missing/empty bytes
6. persist output under a unique generation ID

Mapped controls include prompt, lyrics, BPM, key, duration, seed and reference audio. ACE's native service health is checked before Octiva reports it READY.

### LeVo 2

Octiva builds a native input JSONL and invokes the documented `generate.sh` contract. It maps:

- lyrics → `gt_lyric`
- text description → `descriptions`
- reference audio → `prompt_audio_path`
- instrumental request → `--bgm`
- optional low-memory and flash-attention flags

The adapter requires an explicit verified checkpoint path and `sh`. Its runtime is not accepted until real audio is produced.

### DiffRhythm 2

Octiva writes a sectioned LRC and JSONL, then invokes `inference.py` with the official repository ID, output directory, input JSONL and CFG strength. `style_prompt` is either the Octiva text style or a supplied reference WAV path. `espeak-ng` is a required runtime dependency.

## Workspace convention

```text
<parent>/
├── Octiva-Studios/
└── octiva-engines/
    ├── ACE-Step-1.5/
    ├── SongGeneration/
    └── DiffRhythm2/
```

No model source, model weights or generated audio are vendored into Octiva Git history.

## Exact Windows startup sequence

From the Octiva repository:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\clone-engines.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\inspect-hardware.ps1
Copy-Item .env.example .env
# Review .env, especially LeVo checkpoint path.
powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

After Octiva and native engines are available:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runtime-acceptance.ps1
```

The acceptance harness writes `docs/RUNTIME_ACCEPTANCE_RESULTS.json` and exits nonzero if any required engine does not return real audio.

## Hardware/runtime status

No target-machine hardware report has been generated in this GitHub work session. `scripts/inspect-hardware.ps1` must run on the actual target machine and its output becomes the authoritative hardware record.

No runtime benchmark is fabricated here.

## Generation test status

| Engine | Adapter | Real audio through Octiva | Current status |
|---|---|---|---|
| ACE-Step 1.5 | Implemented | Not executed here | BLOCKED |
| LeVo 2 | Implemented | Not executed here | BLOCKED |
| DiffRhythm 2 | Implemented | Not executed here | BLOCKED |

See `docs/ENGINE_TEST_RESULTS.md` for the measured-results gate.

## Reskin status

The **Octiva Studios product interface and shared visual system are implemented**. The individual upstream native interfaces are **not marked reskinned yet**, because the project requires each engine to generate real audio before its native UI is modified. Reskin patches should only be applied to an engine after that engine passes its runtime test.

This preserves upstream inference logic and avoids spending time styling a backend that may be incompatible with the target runtime.

## Self-audit status

See `docs/SELF_AUDIT.md`.

Important defects already found and fixed include generation history overwrite, unsafe audio-path routing, false READY states, a broken theme path, incorrect sibling wrapper paths, capability mismatches and premature handoff wording.

## Unresolved blockers

1. Execute engine cloning/install/checkpoint downloads on the target runtime.
2. Produce real audio through each required engine.
3. Record measured speed/VRAM/RAM and listening results.
4. Reskin each engine that passes runtime generation.
5. Run real process-restart project-persistence acceptance.
6. Run live AUTO-routing acceptance.
7. Refresh this report after those tests.
8. Keep Codex handoff locked until `docs/CODEX_HANDOFF.md` gate clears.

## Final status

Octiva's own application architecture is no longer a blank scaffold: it contains a functioning local product/API design, real native integration boundaries, persistence, UI, routing, safety gates, launch tooling and acceptance automation.

It is **not yet valid to claim the music engines are working** because the target GPU runtime has not executed them. That distinction is intentional and required by the project specification.
