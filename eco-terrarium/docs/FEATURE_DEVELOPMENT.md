# 기능 개발 프로토콜

이 문서는 새 기능이나 수정을 기존 경량 DDD 컨텍스트와 제품 근거에 맞춰 구현하기 위한 짧은 운영 절차다. 필수 DoD 게이트는 [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)를 우선한다.

## 구현 전 최소 점검

1. [FEATURES.md](../FEATURES.md)에서 대상 기능의 현재 상태와 소유 컨텍스트를 찾는다.
2. [REQUIREMENTS.md](../REQUIREMENTS.md)에서 대상 FR/NFR을 특정한다. 존재하지 않는 요구사항이라면 먼저 요건을 추가하거나 사용자에게 확인한다.
3. [PRD.md](../PRD.md)에서 플레이어 경험, 데이터, 게임 루프에 미치는 영향을 확인한다.
4. [contexts/](contexts/)의 해당 컨텍스트 SPEC에서 공개 계약과 불변 조건을 확인한다. 여기서 깨뜨리면 안 되는 성질이 무엇인지 미리 안다.
5. [ARCHITECTURE.md](ARCHITECTURE.md)의 컨텍스트 맵으로 기능의 소유자를 하나 정한다.
6. [specs/](specs/)에 작업 폴더를 만들어 범위·비범위·리스크·FR·관측 가능한 DoD·검증을 기록한다. 작은 변경은 [TASK_TEMPLATE.md](TASK_TEMPLATE.md)의 단일 카드로 대신해도 된다.

`PLAN.md`는 초기 10개 페이즈의 완료 기록이다. 앞으로의 작업 목록은 `PLAN.md`가 아니라 [FEATURES.md](../FEATURES.md)와 [specs/](specs/)가 관리한다.

## 구현 규칙

- 규칙과 불변 조건은 `features/<context>/domain`에 둔다.
- 화면이나 입력 경로를 둘 이상 조율하는 동작은 `application`에 둔다. 필요 없으면 추가하지 않는다.
- 브라우저, HTTP, 저장, 압축, Web Audio는 `infrastructure`에 가둔다.
- React, Canvas, 모달, 접근성 표시는 `presentation`에 둔다.
- 다른 컨텍스트나 `app`이 쓰는 것만 `features/<context>/index.ts`에서 공개한다.
- 공유 커널은 안정적인 어휘로 제한한다. 기능 고유의 판단 로직을 두지 않는다.
- 플레이어에게 보이는 문구는 `features/i18n`의 언어 카탈로그에 둔다. 컴포넌트에 문자열을 직접 써넣지 않으며, 도메인은 문구 대신 안정적인 id를 돌려준다.

## 요구사항별 추가 확인

| 변경 종류 | 필수 추가 확인 |
| --- | --- |
| 생태계·유전 | 극단값, 정지 상태, 상한, 불변 조건, 난수 재현 방법 |
| UI | 키보드, 표시명/상태, 320px 상당의 작은 화면, 빈 상태·오류 상태 |
| DNA·저장·공유 | 신·구 왕복, 손상 입력, 상한, 복원 실패가 앱 전체를 멈추지 않을 것 |
| Audio | 사용자 조작 후 초기화, 음소거, 미지원 브라우저에서의 안전한 실패 |
| Canvas | 장시간 갱신, 상한 개체수, 리소스 해제, 터치 입력 |
| 다국어 | 세 언어 모두에 키가 있을 것, 문구가 길어져도 레이아웃이 깨지지 않을 것, `<html lang>` 갱신 |

## PR 리뷰 종료 조건

- 요구사항 ID와 DoD가 대응한다.
- 변경을 하나의 컨텍스트가 소유하고, 경계를 넘는 의존은 공개 API를 경유한다.
- 도메인 규칙 테스트와, 영향받은 공개 계약의 테스트가 있다.
- `pnpm test`, `pnpm build`, 필요한 수동 확인의 증거가 있다.
- `ARCHITECTURE.md`, 컨텍스트 SPEC, PRD, 요구사항, 코드 사이에 모순이 없다.
- 계약이나 불변 조건이 바뀌었다면 `docs/contexts/<context>.md`를, 상태가 바뀌었다면 `FEATURES.md`와 `docs/PROJECT_STATE.md`를 함께 갱신했다.
