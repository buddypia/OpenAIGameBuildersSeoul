# 컨텍스트 SPEC

이 디렉터리는 [`ARCHITECTURE.md`](../ARCHITECTURE.md)의 컨텍스트 맵에 있는 bounded context마다 하나씩, **요구사항(FR/NFR)과 코드 사이의 계약**을 기술한다.

## 세 층의 역할 분담

| 층 | 문서 | 쪼개는 축 | 답하는 질문 |
| --- | --- | --- | --- |
| 제품 | [`PRD.md`](../../PRD.md) | 없음(전역 1벌) | 왜, 누구를 위해 만드는가 |
| 요구사항 | [`REQUIREMENTS.md`](../../REQUIREMENTS.md) | 없음(전역 1벌) | 무엇을 만족해야 하는가 (FR/NFR ID 레지스트리) |
| **계약** | **`docs/contexts/<context>.md`** | **도메인(컨텍스트)** | **어떤 규칙·불변 조건·공개 API로 동작하는가** |
| 실행 | [`docs/specs/`](../specs/) | 변경 단위 | 이번에 무엇을, 어떻게, 어디까지 바꾸는가 |

전체 목록과 상태는 [`FEATURES.md`](../../FEATURES.md)에 있다.

## 왜 PRD와 REQUIREMENTS는 쪼개지 않는가

- PRD를 컨텍스트마다 두면 게임 루프가 10개로 갈라져 서로 모순된다. 제품 서사는 하나여야 한다.
- FR/NFR ID는 이 저장소의 **유일한 추적 키**다. 레지스트리가 분산되면 중복 ID와 고아 ID가 생기고, 추적성 자체가 무너진다.
- 반대로 계약은 컨텍스트가 소유한다. `src/features/<context>/`와 1:1로 대응하므로 코드를 바꾸는 사람이 갱신할 문서가 명확하다.

## 작성 규칙

- **없는 것을 쓰지 않는다.** 각 절의 내용은 `REQUIREMENTS.md`의 ID, `src/features/<context>/index.ts`의 실제 export, `src/test/`의 실제 테스트에서만 가져온다.
- **§3 공개 계약은 `index.ts`가 원본이다.** 이 문서는 요약이며, 불일치가 있으면 `index.ts`가 옳다.
- **§6 검증은 실재하는 테스트 이름만 적는다.** 계획 중인 테스트는 `docs/specs/`의 작업 폴더에 쓴다.
- 새 컨텍스트를 추가하면 이 디렉터리의 SPEC, `ARCHITECTURE.md` 컨텍스트 맵, `FEATURES.md` 요약 표, `src/test/architecture.test.ts`의 기대 목록을 함께 갱신한다.

`_TEMPLATE.md`를 복사해서 시작한다.
