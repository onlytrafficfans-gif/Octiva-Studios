# CODEX HANDOFF GATE — DO NOT HAND OFF YET

Octiva Studios is **not ready for Codex handoff** while any required runtime acceptance item remains blocked.

This file is a gate, not a handoff instruction.

## Handoff is allowed only when all of these are true

- [ ] `scripts/clone-engines.ps1` has cloned the three official upstream repositories and recorded their actual commits.
- [ ] `scripts/inspect-hardware.ps1` has produced `docs/HARDWARE_REPORT.json` on the target machine.
- [ ] ACE-Step has generated a real non-empty audio file through the Octiva adapter.
- [ ] LeVo 2 has generated a real non-empty audio file through the Octiva adapter, or has a documented target-hardware blocker accepted as a remote-engine requirement.
- [ ] DiffRhythm 2 has generated a real non-empty audio file through the Octiva adapter.
- [ ] `scripts/runtime-acceptance.ps1` has produced `docs/RUNTIME_ACCEPTANCE_RESULTS.json` and every required local engine is PASS.
- [ ] `docs/ENGINE_TEST_RESULTS.md` contains measured generation results rather than estimates.
- [ ] Each engine that passed runtime generation has received its Octiva-native UI reskin or a documented decision to keep its upstream UI developer-only.
- [ ] Octiva project persistence has been verified after an actual process restart.
- [ ] AUTO routing has been verified with real READY/OFFLINE engine states.
- [ ] `docs/SELF_AUDIT.md` has no unresolved critical defect.
- [ ] GitHub CI is green on the final commit.

## Current design already completed in this repository

Octiva owns the product UI, project system, adapter boundary, deterministic AUTO router, engine manager, real-output verification gate, immutable generation history, launch scripts and runtime acceptance harness.

The upstream model repositories remain external sibling checkouts and must not be vendored into Octiva's Git history.

## Non-negotiable success rule

An engine is never marked WORKING merely because a UI/server launches. It must generate playable, non-empty audio through Octiva.

No mock generation, placeholder audio, hardcoded success status or invented capability can satisfy this gate.
