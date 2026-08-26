---
name: project-state-ledger
description: 프로젝트의 요구사항, PRD, 의사결정, 개발 범위, 구현 상태, 진척도 또는 다음 계획을 사실에 근거해 직접 갱신한다. "PRD 갱신", "요구사항 정리", "진척도 업데이트", "의사결정 로그", "프로젝트 현황", "리뷰 반영" 또는 기능 작업 뒤 문서화가 필요할 때 반드시 사용한다. 여러 저장소가 있는 작업공간에서는 machine-readable task-lock, 허용 경로 manifest, 단일 작업 lease를 검증한 뒤에만 문서를 변경한다.
---

# Project State Ledger

사람이 읽는 `TASK_CONTEXT.md`와 `PROJECT_STATE.md`는 기록이고, `.ai-work/task-lock.json`은 기계가 판정하는 단일 기준이다. `confirmed` 사실, `proposed` 계획, `assumption`을 섞지 않는다.

## 파일과 단일 기준

- `<repo>/docs/PROJECT_STATE.md`: 요구사항 추적, 결정, 진척도, 근거.
- `<repo>/.ai-work/TASK_CONTEXT.md`: 현재 작업의 사람용 handoff.
- `<repo>/.ai-work/task-lock.json`: Project, 절대 root, Task ID, revision, 상태, 증거 시점, 허용 쓰기 경로, 수용 기준의 canonical 값.
- 없으면 `references/` 템플릿을 채운다. Markdown의 lock 관련 필드는 JSON과 **정확히 한 번씩** 그리고 같은 값으로 존재해야 한다.

## 안전한 직접 갱신 순서

1. 정확한 repository root를 확인하고, 더티 worktree면 사용자가 명시적으로 정리 또는 새 범위로 채택할 때까지 멈춘다. 안전 모드의 lock은 `worktree_clean_at_start: true`여야 한다.
2. lease를 얻는다. 다른 lease는 자동 탈취하지 않는다.

   ```bash
   python <skill-dir>/scripts/validate_context.py acquire \
     --repo-root <absolute-repo-root> --lock .ai-work/task-lock.json --owner <worker-id>
   ```

3. 새 대상 저장소에는 guard와 fail-closed pre-commit hook을 한 번 설치한다. 기존 hook은 `--force` 없이 덮어쓰지 않는다. 설치 후에는 lease를 건너뛴 변경도 manifest 밖이면 커밋되지 않는다.

   ```bash
   python <skill-dir>/scripts/validate_context.py install \
     --repo-root <absolute-repo-root>
   ```

4. 출력된 `lease_id`를 보관하고, 쓰기 **직전** 실제 변경 예정 파일 전부를 manifest와 대조한다.

   ```bash
   python <skill-dir>/scripts/validate_context.py validate \
     --repo-root <absolute-repo-root> --context .ai-work/TASK_CONTEXT.md \
     --state docs/PROJECT_STATE.md --lock .ai-work/task-lock.json \
     --lease-id <lease_id> --require-confirmed \
     --write-path docs/PROJECT_STATE.md --write-path PRD.md
   ```

5. 계획은 `proposed`, 구현·테스트·사용자 결정으로 증명된 것만 `confirmed`/`done`으로 기록한다. 진척도 분자는 근거가 있는 수용 기준 수이고 분모는 전체 수용 기준 수다.
6. 종료 전에 실제 worktree 변경도 검사한다. manifest 밖 파일, 문서 간 Task ID 불일치, 중복 필드, lease 불일치는 완료를 막는다.

   ```bash
   python <skill-dir>/scripts/validate_context.py validate \
     --repo-root <absolute-repo-root> --context .ai-work/TASK_CONTEXT.md \
     --state docs/PROJECT_STATE.md --lock .ai-work/task-lock.json \
     --lease-id <lease_id> --check-working-tree
   python <skill-dir>/scripts/validate_context.py release \
     --repo-root <absolute-repo-root> --lock .ai-work/task-lock.json --lease-id <lease_id>
   ```

## 완료 전 리뷰

다음 모두를 충족하지 못하면 `completed`라고 쓰지 않는다.

1. Context·State·lock의 Project, root, Task ID, evidence cutoff, status, revision이 일치한다.
2. 실제 변경 파일과 예정 변경 파일이 모두 `allowed_write_paths`에 있다.
3. `done` 요구사항마다 구현/테스트/확정 결정의 근거가 있다.
4. lease가 현재 작업자를 가리키며, 다른 작업자가 같은 Context를 갱신하지 않았다.

## 문제의 근본 해결 규칙

문제·near-miss·반복 마찰을 발견하면 증상만 숨기거나 TODO로 미루지 않는다.

1. 재현 가능한 사실과 영향 범위를 기록하고 같은 클래스의 기존 사례를 찾는다.
2. 사람의 실수가 아니라 그 실수를 가능하게 한 시스템 조건까지 원인을 추적한다.
3. 가능한 가장 높은 예방 계층을 선택한다: 불변식/스키마 → tool hook → commit·CI gate → 스킬 절차 → 안내 규칙. 임시 완화는 복구 중에만 쓰고 만료 조건을 기록한다.
4. 기존 사례를 모두 고치고, 위반 입력이 실패하는 음성 테스트와 정상 입력이 통과하는 양성 테스트를 실행한다.
5. `<repo>/docs/retros/retro-YYYY-MM-DD-<class>.md`에 원인·결정·근거·검증을 append-only로 남긴다. 근본 수정에 새 경로가 필요하면 lock의 scope와 acceptance criteria를 먼저 갱신하고 다시 검증한다.

## 보고 형식

```markdown
갱신 완료: <repo> / <Task ID>
- 확정된 변화: ...
- 다음 계획: ...
- 진척도: <n>/<m> 수용 기준 충족
- 검증 및 남은 위험: ...
```
