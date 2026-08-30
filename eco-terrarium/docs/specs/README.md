# 변경 단위 SPEC

이 디렉터리는 **한 번의 변경(기능 추가, 버그 수정, 리팩터링)마다 폴더 하나**를 갖는다. 컨텍스트별 계약은 [`docs/contexts/`](../contexts/)에, 전체 기능 목록은 [`FEATURES.md`](../../FEATURES.md)에 있다.

## 폴더 규칙

```
docs/specs/NNNN-<slug>/
├── spec.md    # 무엇을·왜 (범위·비범위·수용 기준)
├── plan.md    # 어떻게 (영향 컨텍스트·설계 판단·검증 계획)
└── tasks.md   # 실행 단위와 완료 기록 (T-01…, 각각 FR-ID 참조)
```

- `NNNN`은 4자리 연번이다. 브랜치 이름을 `NNNN-<slug>`로 맞추면 추적이 기계적으로 성립한다.
- 세 파일로 나누는 이유는 **읽는 쪽(사람이든 에이전트든)이 필요한 것만 읽게 하기 위해서**다. 구현 중에는 `tasks.md`만 열면 된다.
- 작은 변경은 폴더를 만들지 않고 [`docs/TASK_TEMPLATE.md`](../TASK_TEMPLATE.md)의 단일 카드 형식으로 이슈·PR·작업 응답에 남겨도 된다. 어느 쪽을 쓰든 DoD와 검증 증거는 생략하지 않는다.

`_TEMPLATE/`을 복사해서 시작한다.

## 추적성

이 저장소의 추적 키는 폴더 이름이 아니라 **`REQUIREMENTS.md`의 FR/NFR ID**다.

1. `spec.md`의 수용 기준은 FR-ID를 인용한다.
2. `tasks.md`의 각 작업은 자신이 만족시키는 FR-ID를 적는다.
3. 완료 후 [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md)의 추적표와 [`FEATURES.md`](../../FEATURES.md)의 상태를 갱신한다.
4. 대상 FR이 없으면 **먼저 `REQUIREMENTS.md`에 추가한다.** 요구사항 없는 기능은 추적되지 않는다.

필수 게이트는 [`docs/DEFINITION_OF_DONE.md`](../DEFINITION_OF_DONE.md), 구현 절차는 [`docs/FEATURE_DEVELOPMENT.md`](../FEATURE_DEVELOPMENT.md)를 따른다.

## 기록

| # | 작업 | 상태 | 형식 |
| --- | --- | --- | --- |
| 0001 | [수학적 유기체 모션(생명 조화장) 도입](0001-harmonic-motion-field.md) | 완료 | 단일 카드(구형) |
| 0002 | [UI/UX 관찰실 리디자인](0002-ui-ux-observatory-redesign.md) | 완료 | 단일 카드(구형) |
| 0003 | [경량 DDD 기능 컨텍스트로의 이관](0003-lightweight-ddd-migration.md) | 완료 | 단일 카드(구형) |

0001~0003은 이 디렉터리 규칙을 만들기 전에 완료된 작업이라 단일 카드 형식으로 보존한다. 완료된 기록을 소급해 쪼개지 않는다. 신규 작업은 폴더 형식을 쓴다.
