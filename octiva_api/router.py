from __future__ import annotations

from .engines import ENGINES, EngineAdapter
from .models import GenerationRequest


class AutoRouter:
    """Deterministic V1 router. It never chooses a backend that is not READY."""

    def choose(self, request: GenerationRequest) -> EngineAdapter:
        if request.engine != "auto":
            engine = ENGINES[request.engine]
            status = engine.status()
            if status.state != "READY":
                raise RuntimeError(status.blocker or f"{engine.name} is not ready")
            return engine

        ready = [engine for engine in ENGINES.values() if engine.status().state == "READY"]
        if not ready:
            blockers = "; ".join(
                f"{engine.name}: {engine.status().blocker or engine.status().state}"
                for engine in ENGINES.values()
            )
            raise RuntimeError(f"No Octiva engine is READY. {blockers}")

        # Prefer capability fit before preference order.
        def score(engine: EngineAdapter) -> int:
            caps = engine.status().capabilities
            value = 0
            if request.reference_audio and caps.reference_audio:
                value += 20
            if request.bpm is not None and caps.bpm:
                value += 8
            if request.key and caps.key:
                value += 8
            if request.instrumental and caps.generate_instrumental:
                value += 10
            if engine.id == "ace-step":
                value += 3
            if engine.id == "levo2" and request.lyrics:
                value += 2
            return value

        return max(ready, key=score)
