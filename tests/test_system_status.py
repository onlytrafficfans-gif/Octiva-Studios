import json
import tempfile
import unittest
from pathlib import Path

from octiva_api.models import EngineStatus
from octiva_api.system_status import build_system_audit, engine_evidence, load_runtime_results


class SystemAuditTests(unittest.TestCase):
    def test_missing_runtime_report_never_proves_an_engine(self):
        status = EngineStatus(id="ace-step", name="ACE-Step 1.5", state="READY")
        audit = build_system_audit([status], [], {}, False)

        self.assertEqual(audit["verdict"], "NOT_READY")
        self.assertEqual(audit["engines"][0]["runtime_evidence"]["state"], "UNPROVEN")
        self.assertEqual(audit["runtime"]["acceptance_report"], "UNAVAILABLE")

    def test_pass_requires_generation_identity_and_nonempty_audio_bytes(self):
        report = {
            "generated_at": "2026-08-14T00:00:00Z",
            "engines": {"ace-step": {"status": "PASS", "generation_id": "g-123", "bytes": 45}},
        }
        self.assertEqual(engine_evidence("ace-step", report)["state"], "VERIFIED")
        self.assertEqual(engine_evidence("missing", report)["state"], "UNPROVEN")

    def test_historical_pass_does_not_override_a_current_live_blocker(self):
        report = {"engines": {"ace-step": {"status": "PASS", "generation_id": "g-123", "bytes": 45}}}
        status = EngineStatus(id="ace-step", name="ACE-Step 1.5", state="OFFLINE")
        audit = build_system_audit([status], [], report, True)

        self.assertEqual(audit["engines"][0]["runtime_evidence"]["state"], "VERIFIED")
        self.assertEqual(audit["verdict"], "NOT_READY")

    def test_malformed_evidence_file_is_unavailable_not_a_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "runtime-results.json"
            path.write_text("{not-json", encoding="utf-8")
            payload, available = load_runtime_results(path)

        self.assertEqual(payload, {})
        self.assertFalse(available)

    def test_valid_json_runtime_report_is_loaded(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "runtime-results.json"
            path.write_text(json.dumps({"engines": {}}), encoding="utf-8")
            payload, available = load_runtime_results(path)

        self.assertTrue(available)
        self.assertEqual(payload["engines"], {})
