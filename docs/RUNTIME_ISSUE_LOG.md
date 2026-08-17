# Octiva Studios — Runtime Issue Log

Chronological log of runtime failures encountered on the target machine, their
diagnosed root cause, the fix applied, and how the fix was verified.

Target machine (measured, see `docs/HARDWARE_REPORT.json`):

| Item | Value |
|---|---|
| OS | Windows 11 Home 10.0.26200, 64-bit |
| CPU | AMD Ryzen 5 5600X (6C/12T) |
| RAM | 31.93 GB |
| GPU | AMD Radeon RX 6700 XT |
| GPU arch | **gfx1031 (RDNA2)** |
| VRAM | 11.98 GB (`hipinfo` totalGlobalMem; Win32_VideoController under-reports as 4 GB) |
| GPU driver | 32.0.21045.1000 |
| CUDA | **Not present** — `nvidia-smi` not found (no NVIDIA hardware) |
| ROCm | `rocminfo` not on PATH; `hipinfo` present and functional |
| Python | 3.14, 3.12.10, 3.10, 3.11.15 (uv) |
| Git | 2.54.0.windows.1 |
| ffmpeg | present (WinGet Links) |
| espeak-ng | **not installed** at audit time |
| Disk (C:) | 50.72 GB free at audit start |

---

## ISSUE-001 — `uv sync` failed downloading scipy

**SYMPTOM**
`uv sync` for ACE-Step 1.5 exited 1:
```
× Failed to download `scipy==1.17.0`
╰─▶ Failed to download distribution due to network timeout (current value: 30s).
```

**CAUSE**
Transport-layer timeout, not a dependency-resolution or platform defect. uv's
default `UV_HTTP_TIMEOUT` of 30s is too short for the 34.6 MiB scipy wheel on
this connection.

**FIX**
Re-ran `uv sync --python 3.12` with `UV_HTTP_TIMEOUT=300`.

**VERIFICATION**
`uv sync` exited 0; `.venv` populated; `import torch` succeeds in the venv.

---

## ISSUE-002 — ACE-Step venv installed CUDA PyTorch on an AMD GPU

**SYMPTOM**
After a successful `uv sync`:
```
torch: 2.7.1+cu128
cuda_available: False
device_count: 0
hip_version: None
```

**CAUSE**
`uv sync` resolves ACE-Step's default dependency set, which pins CUDA PyTorch
wheels (`+cu128`). This machine has no NVIDIA GPU, so the CUDA runtime finds no
device. This is expected upstream behaviour, and is documented in ACE-Step's
own install guide:

> ⚠️ `uv run acestep` installs CUDA PyTorch wheels and may overwrite an existing
> ROCm setup.

Not an Octiva defect and not an ACE-Step defect — the wrong wheel family for
this hardware.

**FIX**
Followed ACE-Step's official AMD path: a separate `venv_rocm` (Python 3.12, as
AMD ships Python 3.12 wheels only for ROCm 7.2 on Windows), then
`requirements-rocm.txt` Step 1 (ROCm SDK) and Step 2 (ROCm PyTorch wheels).

**VERIFICATION**
ROCm SDK installed (`rocm-7.2.0.dev0`, `rocm-sdk-core`, `rocm-sdk-devel`,
`rocm-sdk-libraries-custom`), then `torch-2.9.1+rocmsdk20260116`. In that venv:
```
torch: 2.9.1+rocmsdk20260116
hip: 7.2.26024-f6f897bd3d
```
The ROCm build installed correctly. See ISSUE-003 for what happened next.

---

## ISSUE-003 — ROCm PyTorch hard-crashes on GPU enumeration (RX 6700 XT)

**SYMPTOM**
In the ROCm venv, any call that enumerates the GPU terminates the process with
Windows exit code `-1073741819` (`0xC0000005`, access violation):

| Call | Result |
|---|---|
| `import torch` | OK — `2.9.1+rocmsdk20260116` |
| `torch.version.hip` | OK — `7.2.26024-f6f897bd3d` |
| `torch.cuda.device_count()` | **crash 0xC0000005** |
| `torch.cuda.is_available()` | **crash 0xC0000005** |

Crash reproduces with `HSA_OVERRIDE_GFX_VERSION` set to `10.3.0`, `10.3.1`, and
`11.0.0` (the value ACE-Step's own `start_api_server_rocm.bat` sets by default).

**CAUSE — PROVEN, NOT INFERRED**
The ROCm 7.2 Windows wheels contain no RDNA2 device code. Enumerating every
gfx-tagged artifact shipped in the installed ROCm/PyTorch packages yields
exactly:

```
gfx1100  gfx1101  gfx1102     (RDNA3)
gfx1150  gfx1151              (RDNA3.5 APU)
gfx1200  gfx1201              (RDNA4)
gfx11xx  gfx120x              (fat-binary group tags)
```

There is **no `gfx103x` artifact of any kind**. This machine's GPU is
**gfx1031** (RX 6700 XT, RDNA2).

`HSA_OVERRIDE_GFX_VERSION` cannot fix this. That variable only spoofs the
architecture string the runtime reports; it does not synthesise device code. With
the override set, the runtime selects an RDNA3 code object and executes it against
an RDNA2 device, which faults — hence the access violation rather than a clean
"unsupported device" error.

**Layer: HARDWARE / VENDOR TOOLCHAIN.** Not an Octiva defect, not an ACE-Step
defect, and not fixable from this repository.

**FIX**
None available for GPU acceleration on this card. Removed `venv_rocm` (it is
unusable and consumed disk needed for model weights) and switched to ACE-Step's
officially supported CPU inference path, which upstream documents:

> ACE-Step can run on CPU for **inference only**, but performance will be
> significantly slower. […] Using DiT-only mode with `ACESTEP_INIT_LLM=false`.

This satisfies the project rule "determine whether CPU/offload/quantization is
officially supported" rather than disguising insufficient hardware as an
application bug.

**VERIFICATION**
Architecture enumeration above is reproducible:
```powershell
Get-ChildItem .\venv_rocm\Lib\site-packages -Recurse -File |
  ForEach-Object { if ($_.Name -match '(gfx[0-9]{3,4}[a-z]*|gfx[0-9]{2}xx)') { $Matches[1] } } |
  Sort-Object -Unique
```
Returns the RDNA3/RDNA4-only list, with no gfx103x entry.

**CONSEQUENCE FOR THE PROJECT**
Any engine on this machine is limited to CPU inference. Engines whose documented
minimum is a large CUDA VRAM budget cannot run here at all; that is recorded as a
hardware blocker with evidence, not as a failure of the engine or of Octiva.

---

## ISSUE-004 — LeVo 2 / SongGeneration upstream repository returns 404

**SYMPTOM**
`scripts/clone-engines.ps1` fails for this engine only:
```
remote: Repository not found.
fatal: repository 'https://github.com/tencent-ailab/SongGeneration.git/' not found
```

**CAUSE**
The upstream repository recorded in `README.md`, `docs/ENGINE_MATRIX.md` and
`scripts/clone-engines.ps1` is not reachable. Confirmed by two independent
methods:

| Method | Result |
|---|---|
| `git ls-remote https://github.com/tencent-ailab/SongGeneration.git` | exit 128, `Repository not found` |
| `HEAD https://github.com/tencent-ailab/SongGeneration` | HTTP **404** |

Both ACE-Step and DiffRhythm2 clone successfully from the same machine, network
and Git credentials in the same script run, so this is specific to the LeVo
repository and not a local Git, TLS, proxy or auth fault.

**Layer: EXTERNAL / UPSTREAM AVAILABILITY.** Not fixable from this machine.

**FIX**
None possible. No substitute repository was adopted: mirrors and third-party
re-uploads are not the official upstream, and the project rule forbids guessing
license or provenance for this engine.

**VERIFICATION**
Re-checked at time of writing; still 404 by both methods.

**SECONDARY BLOCKER (independent of availability)**
Even if the repository were reachable, upstream documents v2-large as requiring
**22 GB VRAM without prompt audio / 28 GB with prompt audio**, on CUDA ≥ 11.8.
This machine has 11.98 GB of VRAM on a non-CUDA AMD device that ROCm cannot
target at all (ISSUE-003). LeVo 2 therefore has two independent blockers.

---

## ISSUE-005 — espeak-ng missing (DiffRhythm 2 prerequisite)

**SYMPTOM**
`espeak-ng` not found on PATH, and not present at either standard install
location (`C:\Program Files\eSpeak NG`, `C:\Program Files (x86)\eSpeak NG`).

**CAUSE**
DiffRhythm 2 requires `espeak-ng` for phonemisation. Upstream directs Windows
users to the `.msi` installer from the espeak-ng releases page.

**STATUS**
Open at time of writing. `winget` is available on this machine and is the
intended install route. Tracked so DiffRhythm 2 is not reported as failing for
the wrong reason.

---

## Status summary

| ID | Layer | Fixable here | State |
|---|---|---|---|
| ISSUE-001 | Network/tooling | Yes | FIXED |
| ISSUE-002 | Dependency/platform | Yes | FIXED (superseded by ISSUE-003) |
| ISSUE-003 | Hardware/vendor toolchain | **No** | BLOCKER — proven, CPU fallback adopted |
| ISSUE-004 | External upstream | **No** | BLOCKER — proven 404 + VRAM shortfall |
| ISSUE-005 | Dependency | Yes | OPEN |
