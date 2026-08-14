# Octiva Engine Adapter Contract

Every engine integration must implement a normalized boundary without pretending unsupported features exist.

## Required lifecycle methods

- `get_status()`
- `get_capabilities()`
- `health_check()`
- `cancel_generation()` when the backend supports cancellation

## Generation capabilities

Implement only when supported by the underlying engine:

- `generate_song()`
- `generate_instrumental()`
- `continue_song()`
- `remix_song()`
- `edit_section()`
- `use_reference_audio()`

## Capability declaration

Each adapter must explicitly declare which controls it supports, including BPM, key, duration, lyrics, structure, instrumental mode, reference audio, vocal reference, seed and variation count.

The dashboard must query capabilities dynamically and hide unsupported controls.

## Status vocabulary

- READY
- LOADING
- GENERATING
- OFFLINE
- MISSING_MODEL
- MISSING_DEPENDENCY
- INSUFFICIENT_VRAM
- UNSUPPORTED_HARDWARE
- BLOCKED

No hardcoded READY state. Readiness must come from a real health check.
