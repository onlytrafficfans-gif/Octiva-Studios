# Engine Matrix

Verified against current upstream documentation on 2026-08-14. Runtime status remains separate from documentation status: an engine is not `WORKING` until Octiva produces a playable audio file through it.

| Engine | Upstream repo | Verified upstream commit | Code license | Weight license | Python / platform | GPU path | Documented memory | Native interface | Octiva adapter | Runtime status |
|---|---|---|---|---|---|---|---|---|---|---|
| ACE-Step 1.5 | https://github.com/ace-step/ACE-Step-1.5 | `6d467e4b5081ccb0abf1ec1bf4fdf9051a2d34b0` | MIT | MIT (official HF model card) | Python 3.11-3.12; Windows/Linux/macOS | CUDA, ROCm, MPS, Intel XPU, CPU documented | 2B can run under 4GB with constrained config; XL requires >=12GB with offload/quantization, >=20GB recommended | Gradio + REST API; `uv run acestep-api` / upstream launch scripts | Native REST adapter implemented | BLOCKED pending real GPU generation |
| LeVo 2 / SongGeneration 2 | https://github.com/tencent-ailab/SongGeneration | Must record from actual clone because GitHub connector cannot resolve the current commit endpoint | Repository LICENSE must be captured after clone | HF v2-large card currently exposes no explicit license metadata; do not assume | Python >=3.8.12; upstream documents CUDA >=11.8 | CUDA/NVIDIA documented; no ROCm support verified | v2-large: 22GB without prompt audio / 28GB with prompt audio | `sh generate.sh ckpt_path lyrics.jsonl output_path`; Gradio script documented | Native command adapter implemented | BLOCKED pending NVIDIA/CUDA runtime + checkpoint |
| DiffRhythm 2 | https://github.com/ASLP-lab/DiffRhythm2 | `7804f821b797b4f276090e1a9dcd37e97d9915d5` | Apache-2.0 | Apache-2.0 | Windows/Linux/macOS install notes; `espeak-ng` required | Upstream README does not claim ROCm/Windows GPU parity; verify runtime | Not stated in upstream README; do not guess | `python inference.py --repo-id ASLP-lab/DiffRhythm2 --output-dir ... --input-jsonl ...`; weights auto-download | Native inference adapter implemented | BLOCKED pending dependency/GPU generation test |

## Capability truth table

| Capability | ACE-Step 1.5 | LeVo 2 | DiffRhythm 2 |
|---|---|---|---|
| Full song with vocals | Yes | Yes | Yes |
| Lyrics input | Yes | Yes | Yes |
| Reference audio | Yes | Yes (10s prompt consumed) | Yes via style-prompt WAV example |
| BPM control | Yes | Not documented as direct generation field | Not documented |
| Key control | Yes | Not documented as direct generation field | Not documented |
| Duration control | Yes (10-600s) | Model-dependent max length up to 4m30s | Framework handles full songs; direct duration field not documented |
| Instrumental mode | Yes | Upstream documents `--bgm` | TODO in DiffRhythm 2 README |
| Vocal-only/separated tracks | ACE track separation/multi-track tools documented | Upstream documents `--vocal` and `--separate` | Not documented |
| Repaint/edit | Yes | Not documented | Not documented |
| Extend/continue | `complete` task documented | Not documented | TODO in upstream README |
| Existing UI | Gradio | Gradio launcher documented | No Gradio; TODO |

## Integration rules

1. `WORKING` requires a real non-empty audio artifact generated on the target runtime.
2. Octiva must hide controls unsupported by the selected adapter.
3. The runtime clone script records the actual checked-out commit; do not substitute this matrix for the target-machine report.
4. LeVo license/commercial conclusions remain unresolved until the repository LICENSE and checkpoint terms are captured from the actual clone. This is a deliberate blocker, not an assumption.
5. Model weights and generated audio remain outside the Octiva Git repository.
