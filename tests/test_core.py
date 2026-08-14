import tempfile
import unittest
from pathlib import Path

from octiva_api.models import Project
from octiva_api.projects import ProjectStore
from octiva_api.router import AutoRouter
from octiva_api.models import GenerationRequest


class ProjectStoreTests(unittest.TestCase):
    def test_project_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = ProjectStore(Path(tmp))
            project = store.create("Test Session")
            project.lyrics = "[Verse]\nOriginal words"
            store.save(project)
            loaded = store.get(project.id)
            self.assertEqual(loaded.name, "Test Session")
            self.assertEqual(loaded.lyrics, "[Verse]\nOriginal words")

    def test_project_list_survives_new_store_instance(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = ProjectStore(root)
            project = first.create("Persistent")
            second = ProjectStore(root)
            self.assertEqual(second.list()[0].id, project.id)


class RouterTests(unittest.TestCase):
    def test_auto_refuses_when_no_engine_is_ready(self):
        request = GenerationRequest(project_id="x", prompt="test")
        with self.assertRaises(RuntimeError):
            AutoRouter().choose(request)


if __name__ == "__main__":
    unittest.main()
