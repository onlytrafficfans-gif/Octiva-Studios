# Octiva Studios Architecture

## Product boundary

Octiva Studios owns the user experience, project system, engine routing, production workflow, shared design system, and adapter contracts.

The open-source music models remain external engines with isolated environments and their own upstream history.

## Runtime model

```text
Octiva UI
  ↓
Project / Studio layer
  ↓
Octiva Router
  ↓
Adapter contract
  ├─ ACE-Step adapter
  ├─ LeVo 2 adapter
  └─ DiffRhythm 2 adapter
  ↓
External engine processes
```

## Rules

- Do not copy upstream repositories into Octiva Git history.
- Do not merge Python environments across engines unless compatibility is proven.
- Do not expose a capability in the UI unless the selected engine supports it.
- Prefer wrappers, adapters, configuration and theme overrides over changes to model internals.
- Keep project metadata engine-independent.
- Treat future engines as replaceable providers.

## Planned Octiva product areas

Create, Projects, Studio, Library, Lyrics, Stems, Vocals, Mix, Master, Engines and Settings.

## Auto routing

V1 should use deterministic rules based on engine readiness, requested capability, hardware/VRAM, vocals vs instrumental, reference-audio needs, edit type and duration.

Later versions may generate with multiple engines and compare candidates, but this should not be faked before real scoring exists.
