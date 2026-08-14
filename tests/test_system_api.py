import unittest

from fastapi.testclient import TestClient

from octiva_api.server import app


class SystemApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_system_audit_exposes_versioned_live_contract(self):
        response = self.client.get("/api/system/audit")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["schema_version"], "1.0")
        self.assertIn(payload["verdict"], {"NOT_READY", "RUNTIME_READY"})
        self.assertIn("engines", payload)
        self.assertIn("findings", payload)
        self.assertIn(payload["runtime"]["acceptance_report"], {"AVAILABLE", "UNAVAILABLE"})

    def test_runtime_results_reports_unavailable_when_no_measurement_exists(self):
        response = self.client.get("/api/runtime-results")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], "UNAVAILABLE")

    def test_build_status_never_invents_a_commit(self):
        response = self.client.get("/api/build-status")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn(payload["state"], {"AVAILABLE", "UNAVAILABLE"})
        if payload["state"] == "UNAVAILABLE":
            self.assertIsNone(payload["commit"])
