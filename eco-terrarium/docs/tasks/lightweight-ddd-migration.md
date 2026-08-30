# 작업 카드: 경량 DDD 기능 컨텍스트로의 이관

## 1. 작업 개요

- **작업명**: 기술별 구조에서 경량 DDD 기능 컨텍스트 구조로의 이관
- **사용자 가치 / 해결할 문제**: 앞으로의 개발자·에이전트가 요구사항과 PRD를 출발점으로 기능의 소유 위치, 의존 방향, 검증 방법을 일관되게 판단할 수 있다.
- **관련 근거**: 사용자 요청, FR-ENV-01~05, FR-SIM-01~03, FR-BIO-01~02, FR-AUD-01~03, FR-PROG-01~03, FR-HIVE-01~03, FR-JUDGE-01~02, NFR-PERF-01~03, NFR-UX-01~02, `PRD.md` 전체, `PLAN.md` Phase 3~10.
- **범위**: 현존하는 모든 기능의 물리 배치를 컨텍스트별로 이관한다. 공개 API, 공통 어휘, 구조 테스트, 개발 프로토콜, README를 추가·갱신한다.
- **비범위**: 게임 규칙, 화면 디자인, DNA 스키마, 의존 패키지, 외부 Hive 백엔드의 변경.
- **영향 영역**: 시뮬레이션 / UI / 오디오 / 저장·공유 / 문서·설정.

## 2. 완료의 정의 (DoD)

| ID | 검증 가능한 인수 기준 | 검증 방법 | 판정 | 증거 |
| --- | --- | --- | --- | --- |
| DOD-01 | 모든 기존 기능이 소유 컨텍스트와 FR 근거를 가지며, 옛 기술별 디렉터리를 쓰지 않는다 | `ARCHITECTURE.md`의 컨텍스트 맵, 구조 테스트 | 통과 | 9개 컨텍스트를 FR에 대응시킴. `architecture.test.ts`가 옛 6개 디렉터리의 부재를 확인. |
| DOD-02 | `app`과 테스트가 각 컨텍스트의 공개 API를 사용하며, 내부 경로에 의존하지 않는다 | `architecture.test.ts`와 코드 리뷰 | 통과 | `App.tsx`와 기존 4개 테스트군이 feature root의 공개 API를 사용. 구조 테스트가 내부 레이어로의 app import를 거부. |
| DOD-03 | 도메인이 React/Canvas/Web Audio에 직접 의존하지 않고, 외부 기술이 적절한 레이어에 격리된다 | 구조 테스트와 import 리뷰 | 통과 | `architecture.test.ts`가 모든 domain 소스의 React·presentation·browser API 의존을 거부. Audio/DNA는 infrastructure, React/Canvas는 presentation에 배치. |
| DOD-04 | 기존 시뮬레이션과 DNA 호환성 테스트가 이관 후의 공개 API를 경유해 통과한다 | `pnpm test` | 통과 | 5파일, 28 테스트 통과. DNA 왕복·v1.0 호환·손상 입력, 엔진 불변 조건, 유전·수리를 포함. |
| DOD-05 | 앞으로의 기능 추가에서 요구사항·PRD·PLAN·DoD·검증을 참조하는 절차가 문서화된다 | 문서의 링크·경로·지시 확인 | 통과 | `ARCHITECTURE.md`와 `FEATURE_DEVELOPMENT.md`를 추가하고 README에서 링크. 4개 문서의 로컬 Markdown 링크 검증 성공. |
| DOD-06 | 타입 검사와 프로덕션 빌드가 통과한다 | `pnpm build` | 통과 | `tsc && vite build` 성공. 1,621개 모듈을 변환하고 출력 번들을 생성. |

## 3. 구현·검증 계획

- **변경 대상**: `src/app`, `src/shared/kernel`, 각 `src/features/<context>`, `src/test`, `README.md`, `docs/ARCHITECTURE.md`, `docs/FEATURE_DEVELOPMENT.md`.
- **자동 검증**: `pnpm test`, `pnpm build`.
- **수동 검증**: 개발 서버에서 환경 조작, Canvas 입력, 도감, Hive 공유 모달, 심사위원 프리셋을 열어 레이아웃을 확인한다.
- **경계·실패 조건**: 손상된 DNA, 옛 v1.0.0 DNA, 정지 중인 시뮬레이션, 상한 개체수, 오디오 미초기화.
- **호환성·성능·접근성**: 공개 DNA를 바꾸지 않는다. Canvas·UI 코드는 동일 구현을 옮기므로, 기존 상한·입력·반응형 동작을 회귀 확인한다.
- **리스크와 롤백**: 이동에 따른 import 해석 실패, 숨은 외부 import. 공개 입구와 구조 테스트로 검출한다. 롤백은 이동 전의 기술별 경로로 되돌리고, README와 테스트 import를 복원한다.

## 4. 완료 기록

- **변경 개요**: `src/app`을 합성 루트로 삼고, 기술별 폴더를 9개 기능 컨텍스트로 이관했다. 각 컨텍스트에 공개 입구를 두고, 공통 어휘를 `src/shared/kernel`에 모았다. 구조 테스트, 아키텍처 규약, 기능 개발 프로토콜, README를 추가·갱신했다.
- **실행한 명령과 결과**:
  - `pnpm test` — 5개 테스트 파일, 28 테스트 통과.
  - `pnpm build` — TypeScript 검사와 Vite 프로덕션 빌드 통과.
  - Playwright(production preview, 1280px) — Canvas를 띄우고 도감 모달을 여는 동선을 통과. 페이지 예외 없음.
  - Playwright(production preview, 320px) — Canvas와 게임 가이드 조작을 확인.
  - Markdown 링크 검증 — README와 3개 DDD 관련 문서의 로컬 링크를 모두 확인.
- **DoD 최종 판정**: 전부 통과.
- **알려진 제한과 후속 작업**: 구조를 가볍게 유지하기 위해, 현시점에 여러 UI를 가로지르는 복잡한 유스케이스는 없다. 필요해진 컨텍스트에만 `application/`을 추가한다. 공유 커널의 비대화는 PR 리뷰에서 막는다.
