# `progression` SPEC

최종 확인: 2026-08-30 · 공개 입구: `src/features/progression/index.ts`

## 1. 책임

플레이어에게 다음에 시도할 목표를 주고, 달성을 판정해 보상을 해금한다.

**소유한다**: 퀘스트 정의와 달성 조건, 진행 상태의 표시.
**소유하지 않는다**: 달성 여부의 원천 데이터(생태 지표·해금 종). `ecosystem`의 공개 API로 읽는다.

## 2. 소유 요구사항

| ID | 요구 | 구현 위치 |
| --- | --- | --- |
| FR-PROG-01 | 10개 이상의 튜토리얼·챌린지 퀘스트와 클리어 보상 해금 — **현 빌드 10개** | `domain/questData.ts`, `presentation/QuestsModal.tsx` |

현행 퀘스트 id: `quest_first_steps`, `quest_trio_balance`, `quest_apex_predator`, `quest_solar_evolution`, `quest_ice_age`, `quest_mutagen_catalyst`, `quest_biodiversity_master`, `quest_night_whisper`, `quest_harmony_maestro`, `quest_encyclopedia_collector`.

## 3. 공개 계약

| 종류 | 이름 | 용도 |
| --- | --- | --- |
| 데이터 | `INITIAL_QUESTS` | 퀘스트 정의의 원본 |
| 컴포넌트 | `QuestsModal` | 진행 현황과 보상 표시 |

## 4. 규칙과 불변 조건

- **퀘스트 id는 안정적이다.** 저장본(`hive`의 `LocalSaveSnapshot`)이 id로 진행 상황을 복원하므로, 이름을 바꾸면 기존 저장본의 진행이 사라진다.
- **퀘스트 문구는 `i18n`의 `getQuestText`에서 온다.** `INITIAL_QUESTS`는 id와 조건만 갖는다.
- **달성 판정은 생태 지표를 다시 계산하지 않는다.** `ecosystem`이 계산한 값을 읽는다.

## 5. 의존 방향

- 의존하는 곳: `ecosystem`(지표·해금 상태), `i18n`(`getQuestText`), `shared/kernel`.
- 이 컨텍스트에 의존하는 곳: `app`, `hive`(저장 대상으로서의 진행 상태).

## 6. 검증

| 테스트 파일 | 지키는 성질 |
| --- | --- |
| `src/test/localSave.test.ts` | 퀘스트 진행이 테라리움과 함께 왕복 저장·복원됨 |
| `src/test/architecture.test.ts` | 공개 API 경유, 컴포넌트에 플레이어용 한국어 문구 없음 |

수동 확인: 각 퀘스트를 조건대로 달성했을 때 클리어 표시와 보상 해금이 되는지.

## 7. 변경 시 주의

- 퀘스트를 추가하면 `i18n` 3개 언어의 `questText`를 함께 추가한다. 하나라도 빠지면 TypeScript 빌드가 실패한다.
- id를 바꾸는 것은 저장 호환성을 깨는 변경이다. FR-HIVE-04의 복원 동작을 함께 확인한다.
