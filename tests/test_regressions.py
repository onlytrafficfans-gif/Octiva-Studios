"""Regression tests for defects found during target-machine runtime bring-up.

Each test here corresponds to a specific defect that was observed or proven on
the target machine and then fixed. They are written to fail against the
pre-fix behaviour.
"""

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from octiva_api import engines as engines_mod
from octiva_api.models import (
    EngineCapabilities,
    EngineStatus,
    GenerationRequest,
    WORKSPACE_ROOT,
)
from octiva_api.router import AutoRouter


class WorkspaceRootTests(unittest.TestCase):
    """WORKSPACE_ROOT must not depend on the process working directory.

    Pre-fix it was Path("workspace"), so generation directories and the audio
    containment check resolved differently depending on where the server was
    started from.
    """

    def test_workspace_root_is_absolute(self):
        self.assertTrue(WORKSPACE_ROOT.is_absolute())

    def test_workspace_root_is_stable_across_chdir(self):
        before = engines_mod.WORKSPACE_ROOT
        original = os.getcwd()
        with tempfile.TemporaryDirectory() as tmp:
            try:
                os.chdir(tmp)
                self.assertEqual(before, engines_mod.WORKSPACE_ROOT)
                self.assertTrue(engines_mod.WORKSPACE_ROOT.is_absolute())
            finally:
                os.chdir(original)


class ExecutableResolutionTests(unittest.TestCase):
    """A dependency installed outside PATH must not be reported missing."""

    def test_explicit_override_is_honoured(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake = Path(tmp) / "espeak-ng.exe"
            fake.write_text("", encoding="utf-8")
            with mock.patch.dict(os.environ, {"OCTIVA_ESPEAK_NG_PATH": str(fake)}):
                resolved = engines_mod.resolve_executable("espeak-ng")
            self.assertIsNotNone(resolved)
            self.assertEqual(Path(resolved), fake.resolve())

    def test_missing_executable_returns_none(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("OCTIVA_DEFINITELY_NOT_A_TOOL_PATH", None)
            self.assertIsNone(
                engines_mod.resolve_executable("definitely-not-a-tool")
            )


class _StubEngine:
    """Engine double that counts how many times status() is read."""

    def __init__(self, engine_id: str, state: str, caps: EngineCapabilities):
        self.id = engine_id
        self.name = engine_id
        self._state = state
        self._caps = caps
        self.status_calls = 0

    def status(self) -> EngineStatus:
        self.status_calls += 1
        return EngineStatus(
            id=self.id,
            name=self.name,
            state=self._state,
            capabilities=self._caps,
            blocker=None if self._state == "READY" else f"{self.id} blocked",
        )


class AutoRouterTests(unittest.TestCase):
    def _route(self, stubs: dict[str, _StubEngine], request: GenerationRequest):
        with mock.patch.object(engines_mod, "ENGINES", stubs), mock.patch(
            "octiva_api.router.ENGINES", stubs
        ):
            return AutoRouter().choose(request)

    def test_auto_never_selects_a_non_ready_engine(self):
        caps = EngineCapabilities(generate_song=True, bpm=True, key=True)
        stubs = {
            "ace-step": _StubEngine("ace-step", "OFFLINE", caps),
            "levo2": _StubEngine("levo2", "MISSING_MODEL", caps),
            "diffrhythm2": _StubEngine("diffrhythm2", "READY", caps),
        }
        chosen = self._route(stubs, GenerationRequest(project_id="p", prompt="x"))
        self.assertEqual(chosen.id, "diffrhythm2")

    def test_auto_raises_when_every_engine_is_blocked(self):
        caps = EngineCapabilities(generate_song=True)
        stubs = {
            "ace-step": _StubEngine("ace-step", "OFFLINE", caps),
            "diffrhythm2": _StubEngine("diffrhythm2", "MISSING_DEPENDENCY", caps),
        }
        with self.assertRaises(RuntimeError) as ctx:
            self._route(stubs, GenerationRequest(project_id="p", prompt="x"))
        self.assertIn("No Octiva engine is READY", str(ctx.exception))

    def test_auto_reads_each_engine_status_once(self):
        """status() performs network + filesystem probes.

        Pre-fix the router called it up to four times per engine for a single
        decision, which multiplied latency and allowed state to change mid-decision.
        """
        caps = EngineCapabilities(generate_song=True)
        stubs = {
            "ace-step": _StubEngine("ace-step", "READY", caps),
            "diffrhythm2": _StubEngine("diffrhythm2", "READY", caps),
        }
        self._route(stubs, GenerationRequest(project_id="p", prompt="x"))
        for stub in stubs.values():
            self.assertEqual(
                stub.status_calls, 1, f"{stub.id} status() called {stub.status_calls}x"
            )

    def test_explicit_engine_selection_rejects_blocked_engine(self):
        caps = EngineCapabilities(generate_song=True)
        stubs = {"ace-step": _StubEngine("ace-step", "OFFLINE", caps)}
        with self.assertRaises(RuntimeError):
            self._route(
                stubs, GenerationRequest(project_id="p", engine="ace-step", prompt="x")
            )


if __name__ == "__main__":
    unittest.main()
