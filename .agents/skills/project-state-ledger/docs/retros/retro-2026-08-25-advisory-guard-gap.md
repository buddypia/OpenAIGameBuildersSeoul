# Retro 2026-08-25 — Advisory guard gap

## Trigger

near-miss: 초기 validator는 문서의 `Allowed write paths` 존재만 확인했고, 실제 변경 경로와 대조하지 않았다.

## Facts

- 첫 적대적 리뷰에서 manifest 밖 변경, Context-State Task ID 불일치, validator 중복, 회귀 테스트 부재가 확인됐다.
- 이후 `task-lock.json`, cross-document validator, lease, unit tests가 추가됐다.
- validator 호출 자체를 생략하면 검사도 생략될 수 있다는 잔여 경로가 확인됐다.

## 5 Whys → Root Cause

1. 왜 범위 밖 변경이 가능한가? → validator 호출이 협조적 절차였다.
2. 왜 호출을 생략해도 완료할 수 있는가? → 커밋 경로에 독립 gate가 없었다.
3. 왜 독립 gate가 없었는가? → 문서 지침을 강제 장치로 취급했다.
4. 왜 그 구분이 누락됐는가? → 설계가 “판정 신호”와 “행위 차단 위치”를 분리하지 않았다.
5. 왜 재발 위험이 남는가? → 위반 입력을 실제 commit 단계에서 시험하는 회귀 테스트가 없었다.

**Root cause(s) (the class-blocking point(s)):**
occurrence: advisory-only governance control · detection: no independent commit-time gate

## Class

advisory-guard-gap
recurrence_of: none
반복 가능한 거버넌스 결함이며, 범위 밖 변경이 커밋되면 외부적으로 보이는 상태가 된다.

## Decision

- Tier: ③ commit gate + ④ skill procedure
- **Why this tier:** Codex tool hook의 런타임 설정을 가정하지 않고도, 저장소에서 실제 배포 단위인 commit을 독립적으로 차단한다.
- Rejected tiers + reason: ② tool hook은 현재 실행 환경의 hook 계약이 확인되지 않아 C3의 false-block/운영 근거를 충족하지 못했다. ⑤ 안내 규칙만으로는 이미 발생한 우회 경로를 막지 못했다.

## Cure (existing instances)

- [x] 두 validator 사본을 하나의 `project-state-ledger` guard로 통합했다.
- [x] Task ID·프로젝트·근거 시점·revision 교차 검증과 manifest 검증을 추가했다.

## Prevent (prevention mechanism)

- `install` 명령이 저장소의 `.ai-work/task_guard.py`와 `pre-commit` hook을 설치한다.
- negative test: `src/outside.ts`를 dirty worktree에 추가 → `working-tree change is outside allowed manifest` 오류로 거부되어야 한다.
- positive test: `docs/PROJECT_STATE.md`만 허용 manifest에 둔 valid lock → validator exit 0.

## Verify cmd

```bash
python -m unittest discover -s skills/project-state-ledger/tests -v
```

## Next

none

Closure: hook 설치 후 manifest 밖 `src/outside.ts`의 실제 Git commit이 non-zero로 끝나는 회귀 테스트를 추가하고 실행했다.
