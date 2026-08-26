#!/usr/bin/env python3
"""Task-context guard: cross-document identity, path manifest, and lease checks."""
from __future__ import annotations

import argparse
import fnmatch
import json
import os
import secrets
import shutil
import subprocess
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

CONTEXT = ("Project:", "Repository root:", "Task ID:", "Requested outcome:", "Evidence cutoff:", "Status:", "Lock revision:", "Canonical lock:", "In scope:", "Out of scope:", "Allowed write paths:", "Canonical requirement IDs:")
STATE = ("Repository root:", "Product / app:", "Updated at:", "Evidence cutoff:", "Canonical requirements:", "Lock revision:", "Active Task ID:", "Status:")
STATUSES = {"proposed", "confirmed", "executing", "review", "completed", "blocked"}


def resolve(root: Path, raw: str) -> Path:
    path = Path(raw).expanduser()
    return path.resolve() if path.is_absolute() else (root / path).resolve()


def under(root: Path, path: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def markdown(path: Path, marker: str, keys: tuple[str, ...], label: str) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return {}, [f"cannot read {label}: {exc}"]
    if marker not in text:
        errors.append(f"{label} marker is missing")
    values: dict[str, str] = {}
    for key in keys:
        matches = [line.strip()[2 + len(key):].strip() for line in text.splitlines() if line.strip().startswith("- " + key)]
        if len(matches) != 1:
            errors.append(f"{label} must contain exactly one '{key}'")
        elif not matches[0] or "<" in matches[0] or ">" in matches[0]:
            errors.append(f"{label} field is unfilled: {key}")
        else:
            values[key] = matches[0]
    return values, errors


def lock(path: Path, root: Path) -> tuple[dict, list[str]]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return {}, [f"cannot read task lock: {exc}"]
    required = ("schema_version", "project", "repository_root", "task_id", "revision", "status", "evidence_cutoff", "allowed_write_paths", "canonical_requirement_ids", "acceptance_criteria", "worktree_clean_at_start")
    errors = [f"lock required value is missing: {key}" for key in required if key not in value or value[key] in (None, "", [], {})]
    if value.get("schema_version") != 1 or not isinstance(value.get("revision"), int) or value.get("revision", 0) < 1:
        errors.append("lock schema_version/revision is invalid")
    if value.get("status") not in STATUSES:
        errors.append("lock status is invalid")
    if value.get("worktree_clean_at_start") is not True:
        errors.append("safe task lock requires worktree_clean_at_start: true")
    if Path(str(value.get("repository_root", ""))).expanduser().resolve() != root:
        errors.append("lock repository_root does not match --repo-root")
    patterns = value.get("allowed_write_paths", [])
    if not isinstance(patterns, list) or any(not isinstance(p, str) or not p or Path(p).is_absolute() or ".." in Path(p).parts for p in patterns):
        errors.append("lock allowed_write_paths is unsafe")
    criteria = value.get("acceptance_criteria", [])
    if not isinstance(criteria, list) or any(not isinstance(c, dict) or not all(c.get(k) for k in ("id", "statement", "verification")) for c in criteria):
        errors.append("lock acceptance_criteria is invalid")
    return value, errors


def lease_file(lock_path: Path) -> Path:
    return lock_path.with_name(lock_path.name + ".lease.json")


def valid_lease(lock_path: Path, lease_id: str | None, errors: list[str]) -> None:
    if not lease_id:
        errors.append("--lease-id is required before writes")
        return
    try:
        value = json.loads(lease_file(lock_path).read_text(encoding="utf-8"))
        expired = datetime.fromisoformat(value["expires_at"]) <= datetime.now(UTC)
    except (OSError, KeyError, ValueError, json.JSONDecodeError) as exc:
        errors.append(f"a valid lease is required: {exc}")
        return
    if value.get("lease_id") != lease_id or expired:
        errors.append("lease is missing, expired, or belongs to another worker")


def permitted(root: Path, raw: str, patterns: list[str]) -> bool:
    path = Path(raw)
    if path.is_absolute() or ".." in path.parts:
        return False
    resolved = (root / path).resolve()
    if not under(root, resolved):
        return False
    return any(fnmatch.fnmatchcase(resolved.relative_to(root).as_posix(), pattern) for pattern in patterns)


def acquire(args: argparse.Namespace) -> int:
    root = Path(args.repo_root).expanduser().resolve()
    lock_path = resolve(root, args.lock)
    value, errors = lock(lock_path, root)
    target = lease_file(lock_path)
    if target.exists():
        errors.append("an existing lease blocks this task; do not auto-take it over")
    if errors:
        print(json.dumps({"ok": False, "errors": errors}, ensure_ascii=False)); return 1
    result = {"task_id": value["task_id"], "owner": args.owner, "lease_id": secrets.token_urlsafe(18), "expires_at": (datetime.now(UTC) + timedelta(minutes=args.ttl_minutes)).isoformat()}
    try:
        fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as file: json.dump(result, file)
    except FileExistsError:
        print(json.dumps({"ok": False, "errors": ["lease was acquired concurrently"]}, ensure_ascii=False)); return 1
    print(json.dumps({"ok": True, **result}, ensure_ascii=False)); return 0


def changed_paths(root: Path) -> list[str]:
    result = subprocess.run(["git", "status", "--porcelain=v1", "-z"], cwd=root, capture_output=True, check=False)
    if result.returncode: raise RuntimeError("--check-working-tree requires a git repository")
    return [item[3:] for item in result.stdout.decode("utf-8", "replace").split("\0") if item and len(item) >= 4]


def validate(args: argparse.Namespace) -> int:
    root = Path(args.repo_root).expanduser().resolve()
    paths = {"context": resolve(root, args.context), "state": resolve(root, args.state), "lock": resolve(root, args.lock)}
    errors = [] if root.is_dir() else ["--repo-root is not a directory"]
    errors += [f"{name} is outside repository root" for name, path in paths.items() if not under(root, path)]
    if not errors:
        context, a = markdown(paths["context"], "<!-- task-context:v1 -->", CONTEXT, "context")
        state, b = markdown(paths["state"], "<!-- project-state-ledger:v1 -->", STATE, "state")
        value, c = lock(paths["lock"], root); errors += a + b + c
        if not errors:
            pairs = ((context["Project:"], value["project"], "context Project"), (context["Repository root:"], str(root), "context root"), (context["Task ID:"], value["task_id"], "context Task ID"), (context["Evidence cutoff:"], value["evidence_cutoff"], "context evidence"), (context["Status:"], value["status"], "context status"), (context["Lock revision:"], str(value["revision"]), "context revision"), (state["Repository root:"], str(root), "state root"), (state["Product / app:"], value["project"], "state project"), (state["Active Task ID:"], value["task_id"], "state Task ID"), (state["Evidence cutoff:"], value["evidence_cutoff"], "state evidence"), (state["Status:"], value["status"], "state status"), (state["Lock revision:"], str(value["revision"]), "state revision"))
            errors += [f"{label} does not match task lock" for actual, expected, label in pairs if actual != expected]
            listed = [part.strip() for part in context["Allowed write paths:"].split(",") if part.strip()]
            if listed != value["allowed_write_paths"]: errors.append("context allowed_write_paths does not match task lock")
            if args.require_confirmed and value["status"] not in {"confirmed", "executing", "review"}: errors.append("task status is not write-allowed")
            if not getattr(args, "audit_only", False):
                valid_lease(paths["lock"], args.lease_id, errors)
            errors += [f"write path is outside allowed manifest: {item}" for item in args.write_path if not permitted(root, item, value["allowed_write_paths"])]
            if args.check_working_tree:
                if value["worktree_clean_at_start"] is not True: errors.append("task did not start from a clean worktree")
                else:
                    try: errors += [f"working-tree change is outside allowed manifest: {item}" for item in changed_paths(root) if not permitted(root, item, value["allowed_write_paths"])]
                    except RuntimeError as exc: errors.append(str(exc))
    print(json.dumps({"ok": not errors, "repo_root": str(root), "errors": errors}, ensure_ascii=False, indent=2)); return 0 if not errors else 1


def release(args: argparse.Namespace) -> int:
    root, path = Path(args.repo_root).expanduser().resolve(), resolve(Path(args.repo_root).expanduser().resolve(), args.lock)
    errors: list[str] = []; valid_lease(path, args.lease_id, errors)
    if errors: print(json.dumps({"ok": False, "errors": errors}, ensure_ascii=False)); return 1
    lease_file(path).unlink(); print(json.dumps({"ok": True}, ensure_ascii=False)); return 0


def install(args: argparse.Namespace) -> int:
    root = Path(args.repo_root).expanduser().resolve()
    target = root / ".ai-work/task_guard.py"
    result = subprocess.run(["git", "rev-parse", "--git-dir"], cwd=root, capture_output=True, text=True, check=False)
    if result.returncode:
        print(json.dumps({"ok": False, "errors": ["install requires a git repository"]}, ensure_ascii=False)); return 1
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(Path(__file__), target)
    git_dir = resolve(root, result.stdout.strip())
    hook = git_dir / "hooks/pre-commit"
    if hook.exists() and not args.force:
        print(json.dumps({"ok": False, "errors": [f"existing hook is preserved: {hook}"], "guard": str(target)}, ensure_ascii=False)); return 1
    hook.write_text("#!/bin/sh\nset -eu\nroot=$(git rev-parse --show-toplevel)\nexec python3 \"$root/.ai-work/task_guard.py\" audit --repo-root \"$root\" --context .ai-work/TASK_CONTEXT.md --state docs/PROJECT_STATE.md --lock .ai-work/task-lock.json --check-working-tree\n", encoding="utf-8")
    hook.chmod(0o755)
    print(json.dumps({"ok": True, "guard": str(target), "hook": str(hook)}, ensure_ascii=False)); return 0


def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest="command", required=True)
    for name in ("acquire", "release"):
        item = sub.add_parser(name); item.add_argument("--repo-root", required=True); item.add_argument("--lock", required=True)
    sub.choices["acquire"].add_argument("--owner", required=True); sub.choices["acquire"].add_argument("--ttl-minutes", type=int, default=30)
    sub.choices["release"].add_argument("--lease-id", required=True)
    for name in ("validate", "audit"):
        item = sub.add_parser(name); item.add_argument("--repo-root", required=True); item.add_argument("--context", required=True); item.add_argument("--state", required=True); item.add_argument("--lock", required=True); item.add_argument("--lease-id"); item.add_argument("--write-path", action="append", default=[]); item.add_argument("--require-confirmed", action="store_true"); item.add_argument("--check-working-tree", action="store_true")
    item = sub.add_parser("install"); item.add_argument("--repo-root", required=True); item.add_argument("--force", action="store_true")
    args = parser.parse_args(); args.audit_only = args.command == "audit"; return {"acquire": acquire, "validate": validate, "audit": validate, "release": release, "install": install}[args.command](args)


if __name__ == "__main__": sys.exit(main())
