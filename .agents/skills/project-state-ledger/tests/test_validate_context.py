from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "validate_context.py"
SPEC = importlib.util.spec_from_file_location("context_guard", SCRIPT)
guard = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(guard)


class ContextGuardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        (self.root / ".ai-work").mkdir()
        (self.root / "docs").mkdir()
        self.lock = self.root / ".ai-work/task-lock.json"
        self.lock.write_text(json.dumps({"schema_version": 1, "project": "alpha", "repository_root": str(self.root), "task_id": "TASK-1", "revision": 1, "status": "confirmed", "evidence_cutoff": "abc123", "allowed_write_paths": ["docs/**", ".ai-work/**"], "canonical_requirement_ids": ["REQ-1"], "acceptance_criteria": [{"id": "AC-1", "statement": "works", "verification": "test"}], "worktree_clean_at_start": True}), encoding="utf-8")
        (self.root / ".ai-work/TASK_CONTEXT.md").write_text("\n".join(["<!-- task-context:v1 -->", "- Project: alpha", f"- Repository root: {self.root}", "- Task ID: TASK-1", "- Requested outcome: test", "- Evidence cutoff: abc123", "- Status: confirmed", "- Lock revision: 1", "- Canonical lock: .ai-work/task-lock.json", "- In scope: docs", "- Out of scope: src", "- Allowed write paths: docs/**, .ai-work/**", "- Canonical requirement IDs: REQ-1"]), encoding="utf-8")
        (self.root / "docs/PROJECT_STATE.md").write_text("\n".join(["<!-- project-state-ledger:v1 -->", f"- Repository root: {self.root}", "- Product / app: alpha", "- Updated at: now", "- Evidence cutoff: abc123", "- Canonical requirements: PRD.md", "- Lock revision: 1", "- Active Task ID: TASK-1", "- Status: confirmed"]), encoding="utf-8")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def acquire(self) -> str:
        result = guard.acquire(type("Args", (), {"repo_root": str(self.root), "lock": ".ai-work/task-lock.json", "owner": "test", "ttl_minutes": 5})())
        self.assertEqual(result, 0)
        return json.loads(guard.lease_file(self.lock).read_text())["lease_id"]

    def validate(self, lease_id: str, *writes: str) -> int:
        return guard.validate(type("Args", (), {"repo_root": str(self.root), "context": ".ai-work/TASK_CONTEXT.md", "state": "docs/PROJECT_STATE.md", "lock": ".ai-work/task-lock.json", "lease_id": lease_id, "write_path": list(writes), "require_confirmed": True, "check_working_tree": False})())

    def test_valid_context_and_allowed_path_pass(self) -> None:
        self.assertEqual(self.validate(self.acquire(), "docs/PROJECT_STATE.md"), 0)

    def test_task_id_mismatch_fails(self) -> None:
        path = self.root / "docs/PROJECT_STATE.md"
        path.write_text(path.read_text().replace("Active Task ID: TASK-1", "Active Task ID: TASK-2"), encoding="utf-8")
        self.assertEqual(self.validate(self.acquire(), "docs/PROJECT_STATE.md"), 1)

    def test_manifest_escape_fails(self) -> None:
        self.assertEqual(self.validate(self.acquire(), "src/other-game.ts"), 1)

    def test_duplicate_identity_field_fails(self) -> None:
        path = self.root / ".ai-work/TASK_CONTEXT.md"
        path.write_text(path.read_text() + "\n- Task ID: TASK-1\n", encoding="utf-8")
        self.assertEqual(self.validate(self.acquire(), "docs/PROJECT_STATE.md"), 1)

    def test_second_lease_fails(self) -> None:
        self.acquire()
        self.assertEqual(guard.acquire(type("Args", (), {"repo_root": str(self.root), "lock": ".ai-work/task-lock.json", "owner": "other", "ttl_minutes": 5})()), 1)

    def test_only_lease_owner_can_release(self) -> None:
        lease_id = self.acquire()
        wrong = type("Args", (), {"repo_root": str(self.root), "lock": ".ai-work/task-lock.json", "lease_id": "wrong"})()
        right = type("Args", (), {"repo_root": str(self.root), "lock": ".ai-work/task-lock.json", "lease_id": lease_id})()
        self.assertEqual(guard.release(wrong), 1)
        self.assertEqual(guard.release(right), 0)
        self.assertFalse(guard.lease_file(self.lock).exists())

    def test_worktree_manifest_check_fails_for_out_of_scope_change(self) -> None:
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True)
        subprocess.run(["git", "add", "."], cwd=self.root, check=True)
        subprocess.run(["git", "-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], cwd=self.root, check=True)
        (self.root / "src").mkdir()
        (self.root / "src/outside.ts").write_text("changed", encoding="utf-8")
        lease_id = self.acquire()
        args = type("Args", (), {"repo_root": str(self.root), "context": ".ai-work/TASK_CONTEXT.md", "state": "docs/PROJECT_STATE.md", "lock": ".ai-work/task-lock.json", "lease_id": lease_id, "write_path": [], "require_confirmed": True, "check_working_tree": True})()
        self.assertEqual(guard.validate(args), 1)

    def test_installed_hook_blocks_out_of_scope_commit(self) -> None:
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True)
        subprocess.run(["git", "add", "."], cwd=self.root, check=True)
        subprocess.run(["git", "-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], cwd=self.root, check=True)
        self.assertEqual(guard.install(type("Args", (), {"repo_root": str(self.root), "force": False})()), 0)
        (self.root / "src").mkdir()
        (self.root / "src/outside.ts").write_text("changed", encoding="utf-8")
        subprocess.run(["git", "add", "src/outside.ts"], cwd=self.root, check=True)
        commit = subprocess.run(["git", "-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-qm", "blocked"], cwd=self.root, capture_output=True, text=True, check=False)
        self.assertNotEqual(commit.returncode, 0)
        self.assertIn("outside allowed manifest", commit.stdout + commit.stderr)


if __name__ == "__main__":
    unittest.main()
