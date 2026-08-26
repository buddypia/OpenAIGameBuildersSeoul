---
name: project-orchestrator
description: 하나의 기능·버그·마일스톤을 처음부터 완료·리뷰·인수인계까지 조율한다. 사용자가 "이 기능 진행해", "개발 계획부터 구현·리뷰까지", "프로젝트를 계속 진행", "오케스트레이션", "다음 작업을 맡아", "태스크를 관리하며 개발"을 요청할 때 반드시 사용한다. 요구사항 갱신, 구현, 테스트, 리뷰를 넘나드는 작업에서 프로젝트·태스크·범위를 혼동하지 않도록 Task Context를 생성·검증하고, 상태 문서는 project-state-ledger 방식으로 갱신한다.
compatibility: project-state-ledger 스킬이 함께 설치되어 있어야 한다.
---

# Project Orchestrator

이 스킬의 우선순위는 속도가 아니라 **올바른 대상에서 올바른 약속을 이행하는 것**이다. 한 번의 작업은 하나의 repository root, 하나의 `Task ID`, 하나의 수용 기준 집합만 가진다. 이 세 가지가 바뀌면 새 작업이다.

## 시작 게이트: Task Context를 만든다

1. 먼저 정확한 대상 앱/저장소를 정한다. 작업공간에 여러 프로젝트가 있거나 사용자 표현이 모호하면 경로나 파일을 확인한다. 추측으로 인접 프로젝트를 선택하지 않는다.
2. `project-state-ledger`의 `TASK_CONTEXT.template.md`, `PROJECT_STATE.template.md`, `task-lock.template.json`을 실제 값으로 채운다. 이전 `completed` 또는 다른 요구의 문맥을 재사용하지 않는다.
3. 문서에는 다음 잠금 정보를 반드시 채운다.
   - `Project`, 절대 `Repository root`, 고유 `Task ID`, 요청 결과
   - 명시적 `In scope` / `Out of scope`, 허용된 쓰기 경로
   - 측정 가능한 수용 기준과 검증 방법
   - 확정 사실·가정·사용자 결정을 출처와 함께 구분한 항목
4. `<repo>/docs/PROJECT_STATE.md`도 만들거나 갱신한다. 형식은 `project-state-ledger`의 템플릿과 호환되어야 한다.
5. `project-state-ledger`의 lease를 얻고 구현 전 검증을 통과해야 한다. validator를 복제하거나 우회하지 않는다.
6. 대상 저장소에 guard가 아직 없으면 `project-state-ledger`의 `install` 명령으로 fail-closed pre-commit hook을 설치한다. 기존 hook은 소유자 확인 없이 바꾸지 않는다.

   ```bash
   python <project-state-ledger-dir>/scripts/validate_context.py validate \
     --repo-root <absolute-repo-root> \
     --context .ai-work/TASK_CONTEXT.md \
     --state docs/PROJECT_STATE.md \
     --lock .ai-work/task-lock.json --lease-id <lease_id> --require-confirmed
   ```

검증 실패 시 변경하지 않는다. 경로·Task ID·수용 기준을 고친 뒤 처음부터 다시 확인한다.

## 작업 루프

각 단계 직전에 `TASK_CONTEXT.md`와 `task-lock.json`을 다시 읽고, 현재 변경 경로를 `--write-path`로 넘겨 `allowed_write_paths` 안에 있는지 확인한다. manifest 밖 경로는 수정하지 않는다.

1. **Plan** — 수용 기준별로 가장 작은 구현·검증 단위를 적고, `PROJECT_STATE.md`에 `proposed` 계획으로 직접 갱신한다.
2. **Build** — 현재 단위만 구현한다. 문제를 발견하면 증상 완화나 TODO로 닫지 말고, 재현·원인·전체 영향 범위·회귀 테스트를 포함한 근본 해결 Task로 승격한다. 원인이 현재 manifest 밖에 있으면 lock의 scope와 수용 기준을 먼저 갱신·검증한 후 진행한다.
3. **Verify** — 각 수용 기준의 테스트 또는 관찰을 실행한다. 실행하지 못한 검증은 `not run`으로 기록한다.
4. **Review** — 아래 독립 점검을 한다. 변경 자체를 설명한 다음, Task Context와 비교해 범위·요구사항·회귀 위험을 찾는다.
5. **Record** — `project-state-ledger` 절차에 따라 PRD, `PROJECT_STATE.md`, Task Context에 확정 결과와 근거를 갱신한다.

## 필수 리뷰 게이트

완료 전에 다음 네 관점으로 점검하고, 발견 사항과 해결 여부를 Task Context에 남긴다.

| 관점 | 질문 |
| --- | --- |
| 요구사항 | 각 수용 기준이 구현·검증 근거와 1:1로 연결되는가? |
| 범위 | 변경 파일이 허용 경로에 있고, 다른 프로젝트/작업의 변경을 섞지 않았는가? |
| 품질 | 오류 경로, 데이터 손실, 보안, 접근성, 유지보수성에 새 위험이 없는가? |
| 운영 | 문서의 완료·진척도·다음 계획이 실제 코드와 테스트 결과와 일치하는가? |

치명적 또는 높은 위험의 미해결 항목이 있으면 `completed`로 바꾸지 않는다. 사소한 후속 작업은 별도 `Task ID`를 만들고 현재 기록에서 연결한다.

## 맥락 혼동 방지 규칙

- 파일을 열기 전과 쓰기 직전에 repository root를 확인한다. 절대 경로를 우선한다.
- 대화가 길어지거나 요약·재개가 발생한 뒤에는 이전 기억을 신뢰하지 말고 Task Context, PROJECT_STATE, 현재 diff를 다시 읽는다.
- 사용자가 새 목표·앱·성공 조건을 말하면 기존 작업의 연장이 아니라 새 Task Context 후보로 처리한다. 서로 독립임이 확인된 경우에만 병렬 작업한다.
- 복수 에이전트나 하위 작업자를 쓸 때는 각자에게 Task Context의 복사본과 허용 경로만 준다. 결과는 증거·변경 파일·검증 명령을 포함해야 하며, 원본 Context를 직접 수정하게 하지 않는다.
- 타인의 변경, 기존 diff, 미확인 문서는 현재 작업의 근거가 아니다. 발견만 기록하고 소유·의도를 확인한다.

## 종료 조건과 인수인계

완료를 선언하려면 다음을 모두 충족한다.

1. 모든 수용 기준이 통과했거나 명시적으로 사용자 승인된 예외다.
2. 필요한 테스트·리뷰 결과가 근거로 연결되어 있다.
3. `PROJECT_STATE.md`는 확정 결과와 다음 계획을, PRD는 요구 변경을, Task Context는 handoff를 반영한다.
4. validator를 `--check-working-tree`로 마지막 실행해 통과하고, lease를 release한다.

사용자에게는 아래 형식으로만 요약한다.

```markdown
작업 결과: <Project> / <Task ID>
- 완료: <수용 기준 기준 결과>
- 리뷰: <발견 사항과 조치>
- 다음: <다음 실행 단위 또는 blocker>
- 기록: <PRD, PROJECT_STATE, TASK_CONTEXT 경로>
```
