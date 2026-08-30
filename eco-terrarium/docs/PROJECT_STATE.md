<!-- project-state-ledger:v1 -->
# Project State — Eco Terrarium

## Identity

- Repository root: /Users/a13973/dev/buddypia/hackathon/OpenAIGameBuildersSeoul/eco-terrarium
- Product / app: Eco Terrarium
- Updated at: 2026-08-30T03:29:00Z
- Evidence cutoff: git workspace, branch `main`, observed 2026-08-30T03:29:00Z
- Canonical requirements: REQUIREMENTS.md
- Feature index: FEATURES.md
- Context specs: docs/contexts/
- Lock revision: 2

## Current intent

- Active Task ID: TASK-20260826-eco-terrarium-core
- Requested outcome: 에코 테라리움의 10차원 유전자 진화 시뮬레이션, 먹이사슬 균형, 절차적 Web Audio, 로컬 자동 저장 및 DNA 공유 기능 구현 및 검증 완료.
- Status: completed

## Requirements traceability

| Requirement | Statement | Status | Implementation evidence | Verification evidence |
| --- | --- | --- | --- | --- |
| FR-ENV-01~05 | 환경 조작(빛·수분·온도·영양소·노크) | done | `src/features/environment/**` | 단위 테스트 통과, 캔버스 인터랙션 검증 |
| FR-SIM-01~03 | 4단계 먹이사슬·Boids·10차원 유전자 진화 | done | `src/features/simulation/**`, `src/features/species/**` | `pnpm test` 8파일 55 tests 통과 |
| FR-BIO-01~03 | 16종 생물 도감·인스펙터·진화 트리 | done | `src/features/species/presentation/**` | 10차원 표현형 벡터 렌더링 확인 |
| FR-AUD-01~03 | 절차적 Web Audio 앰비언트·효과음 | done | `src/features/audio/**` | 브라우저 인터랙션 후 오디오 컨텍스트 활성화 확인 |
| FR-HIVE-01~04 | DNA 압축 공유 및 로컬 자동 저장·복원 | done | `src/features/hive/**` | lz-string 인코딩/디코딩 및 비정상 스토리지 복구 테스트 통과 |
| FR-HIVE-05 | 현장 시연용 QR 공유 | done | `src/features/hive/domain/qrCode.ts`, `src/features/hive/presentation/Qr*.tsx`, `usePlayUrl.ts` | `src/test/qrCode.test.ts` 7 tests 통과. 요구사항은 출하된 동작을 사후 기술함 |
| NFR-PERF-01~02 | 60FPS 렌더링 및 모바일 반응형 | done | `src/features/canvas/**`, `src/app/**` | desktop/mobile 레이아웃 및 번들 빌드 최적화 완료 |
| NFR-UX-02 | 한국어·영어·일본어 다국어 지원 | done | `src/features/i18n/**` | 언어 카탈로그 3종이 한국어 트리 스키마를 만족(TypeScript 검증), 컴포넌트 내 한국어 문자열 0건을 `architecture.test.ts`가 확인 |

## Decisions

| Date | ID | Decision | Alternatives / reason | Impact | Revisit when |
| --- | --- | --- | --- | --- | --- |
| 2026-08-26 | DEC-002 | 코드를 단일 진실 공급원(SSOT)으로 두고 화면 표시와 유전자 구조를 일치시킨다 | 자산에 맞춰 코드를 되돌리면 의존 방향이 뒤집히고 불일치가 남는다 | 10차원 유전자 스키마 통일 | 유전자 스키마가 바뀔 때 |
| 2026-08-26 | DEC-004 | 인스펙터의 라벨은 문구만 고치지 않고 10종 유전자를 실제 표시한다 | 라벨만 고치면 표시 7종과 선언 10종이 여전히 불일치 | FR-BIO-02 충족, 번들 +2.6kB | 유전자 스키마가 바뀔 때 |
| 2026-08-26 | DEC-005 | 로컬 자동 저장/복원 실패 시에도 플레이가 중단되지 않도록 방어 로직을 구현한다 | 스토리지 손상 시 흰 화면 오류 방지 | 안전한 fallback 상태 제공 | 스토리지 구조가 바뀔 때 |

## Progress

- Completed: 10차원 Genome 모델 정의, 4단계 먹이사슬 수치 시뮬레이션, 절차적 Web Audio 합성, FR-HIVE-04 로컬 자동 저장·복원 구현, 테라리움 초기화 기능, 16종 생물 도감 및 진화 계통도.
- In progress: 없음.
- Blocked: 없음.
- Progress basis: FR-ENV, FR-SIM, FR-BIO, FR-AUD, FR-HIVE 핵심 요구사항 충족; `pnpm test` 및 `pnpm build` 통과.

## Evidence snapshot

- Git / workspace state: git 메타데이터가 없는 작업공간; 본 태스크 시작 시점은 `non-git workspace observed 2026-08-26T12:40:00Z`.
- Commands and outcomes: `pnpm test` → 8 test files·55 tests 통과; `pnpm build` → TypeScript·Vite 성공(JS 342.27 kB / gzip 100.56 kB, CSS 41.00 kB).
- Sources read: `src/shared/kernel/types.ts`, `src/app/App.tsx`, `src/features/hive/**`, `src/features/species/presentation/InspectorModal.tsx`, `REQUIREMENTS.md`, `PRD.md`, `PLAN.md`.
- Known gaps: Hive 리더보드는 `HiveShareModal.tsx`의 `MOCK_LEADERBOARD_STATS` 목업 데이터 기반이며(REQUIREMENTS FR-HIVE-03에 명시), 추후 라이브 서버 연동 가능.

## Change log

| Timestamp | Task ID | Change | Evidence |
| --- | --- | --- | --- |
| 2026-08-26T11:57:04Z | TASK-20260826-eco-init | 프로젝트 구조 및 핵심 기능 아키텍처 설계 | 설계 문서 및 디렉터리 구성 |
| 2026-08-26T12:07:54Z | TASK-20260826-simulation-engine | 생태계 엔진 및 먹이사슬 로직 구현 | 단위 테스트 통과 |
| 2026-08-26T12:11:51Z | TASK-20260826-genome-expansion | 문서·UI의 Genome 차원을 10으로 정정, FR-HIVE-04 로컬 자동 저장·복원과 테라리움 초기화를 구현, 공유 코드 압축 표기를 lz-string으로 정정 | `pnpm test` 55 tests 통과, `pnpm build` 통과 |
| 2026-08-26T12:44:00Z | TASK-20260826-ui-refinement | 상단바 버튼 접근성 개선 및 UI 인터랙션 최적화 | UI 컴포넌트 단위 테스트 통과 |
| 2026-08-26T12:50:00Z | TASK-20260826-inspector-polish | 인스펙터 관찰 및 10차원 유전자 시각화 연동 | 화면 렌더링 검증 완료 |
| 2026-08-30T03:29:00Z | TASK-20260830-spec-layering | 문서를 4층(PRD → REQUIREMENTS → 컨텍스트 SPEC → 작업 SPEC)으로 재편. `FEATURES.md` 단일 인덱스 신설, `docs/contexts/` 10개 컨텍스트 SPEC + 횡단 관심사 신설, `docs/tasks/` → `docs/specs/`로 이관하고 연번 부여, 출하되어 있던 QR 공유를 FR-HIVE-05로 사후 정의, `MOCK_LEADERBOARDS` 오기를 `MOCK_LEADERBOARD_STATS`로 정정, `ARCHITECTURE.md`의 hive 근거를 FR-HIVE-01~04로 갱신 | `pnpm test` 10파일 85 tests 통과(신규 `docs.test.ts` 15 tests 포함), `pnpm build` 통과, 드리프트 8종 주입 역검증에서 8/8 검출 |
| 2026-08-27T01:05:00Z | TASK-20260827-i18n-ko-en-ja | 제출 전용 산출물을 `.tmp/submission/`으로 이동하고 참조 경로 갱신, 일본어 문서를 한국어로 번역, `features/i18n` 컨텍스트를 추가해 한국어·영어·일본어 3개 언어를 지원 | `npx tsc --noEmit` 통과, `npx vitest run` 8파일 58 tests 통과, `npx vite build` 통과, Chrome DevTools로 3개 언어 화면 확인 (console errors 0건) |
