<!-- task-context:v1 -->
# Task Context — <task id>

## Identity lock

- Project: <project name>
- Repository root: <absolute repository root>
- Task ID: <TASK-YYYYMMDD-short-slug>
- Requested outcome: <one sentence>
- Evidence cutoff: <commit SHA or working-tree timestamp>
- Status: confirmed
- Lock revision: 1
- Canonical lock: .ai-work/task-lock.json

## Scope lock

- In scope: <explicit paths / behaviours>
- Out of scope: <explicit exclusions>
- Allowed write paths: docs/**, .ai-work/**
- Canonical requirement IDs: <REQ-* list or none>

## Acceptance criteria

1. <observable condition and verification method>

## Evidence and decisions

- Confirmed facts: <fact → source>
- Assumptions to verify: <assumption → how to verify>
- Decisions: <DEC-* or user decision → source>

## Execution log

| Timestamp | Action | Result | Evidence |
| --- | --- | --- | --- |
| <timestamp> | context created | proposed | <user request> |

## Handoff

- Changed files: <paths>
- Verification: <commands and results>
- Next action / blocker: <one action or none>
