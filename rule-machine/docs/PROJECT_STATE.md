<!-- project-state-ledger:v1 -->
# Project State — The Rule Machine

## Identity

- Repository root: /Users/a13973/dev/buddypia/hackathon/OpenAIGameBuildersSeoul/rule-machine
- Product / app: The Rule Machine
- Updated at: 2026-08-31T13:25:57+09:00
- Evidence cutoff: 2026-08-31T12:00:00+09:00 working tree initialized
- Canonical requirements: .ai-work/task-lock.json
- Lock revision: 2

## Current intent

- Active Task ID: TASK-20260831-rule-machine-launch
- Requested outcome: 30초마다 두 룰이 충돌하며 물리와 생존 경로를 바꾸는 0-asset 웹 게임 출시 준비.
- Status: confirmed

## Requirements traceability

| Requirement | Statement | Status | Implementation evidence | Verification evidence |
| --- | --- | --- | --- | --- |
| REQ-001 | 즉시 실행 가능한 브라우저 게임 | confirmed | `src/App.tsx`, `src/engine.ts` | `npm run build`, visual check PASS |
| REQ-002 | 30초마다 두 룰 카드 조합 | confirmed | `src/rules.ts`의 `ROUND_SECONDS`, `nextRulePair`; `src/engine.ts`의 timer/shift | Vitest 4/4, Force Shift 브라우저 점검 PASS |
| REQ-003 | 룰이 물리·충돌·승리 루프를 실제 변경 | confirmed | `deriveWorld`와 Canvas gravity/support/dash/wrap/magnet/comet 분기 | 룰 매핑 Vitest 및 실제 조합 전환 점검 PASS |
| REQ-004 | 외부 디자인/오디오 리소스 없는 절차적 연출과 자동 검증 | confirmed | Canvas primitive, CSS, `src/audio.ts`, `tools/verify-zero-assets.mjs` | `npm run verify:assets` PASS |
| REQ-005 | 키보드·터치·반응형 접근성 | confirmed | 키보드 이벤트, native 터치 버튼, responsive CSS, aria labels/live | 1440px/320px visual check PASS |

## Decisions

| Date | ID | Decision | Alternatives / reason | Impact | Revisit when |
| --- | --- | --- | --- | --- | --- |
| 2026-08-31 | DEC-001 | 6개 룰에서 비중복 2장 조합을 뽑는다. | 15개 조합이 곧 limitless를 직관적으로 보여 준다. | 콘텐츠를 추가하지 않아도 반복성이 생긴다. | 룰이 6개를 초과할 때 |
| 2026-08-31 | DEC-002 | 모든 시청각 요소를 Canvas/CSS/Web Audio로 생성한다. | 5시간 배포 안정성과 권리 검증을 우선한다. | 외부 리소스 로딩 실패가 없다. | 상용 출시용 아트가 확정될 때 |

## Progress

- Completed: React/Vite 신규 웹앱, 6 룰·15 조합 엔진, Canvas 물리/렌더, Web Audio, 키보드·터치 UI, zero-asset 검증기, 테스트·시각 점검.
- In progress: none.
- Blocked: none.
- Progress basis: 5/5 수용 기준 충족; measured 2026-08-31T13:25:57+09:00.

## Evidence snapshot

- Git / workspace state: 독립 신규 Git repository. 신규 프로젝트 파일은 아직 최초 commit 전이며, 상위 워크스페이스의 기존 변경은 범위 밖으로 보존.
- Commands and outcomes: `npm run verify` → PASS (Vitest 4/4, zero-asset PASS, Vite build PASS); `tools/visual-check.py` → PASS (desktop/mobile, start, shift, keyboard, no console errors).
- Sources read: `agy/finalist_preparation_guide.md`, `docs/02_tracks/track2_theme_announced.md`, `docs/03_submission_and_judging/submission_guidelines.md`, `.tmp/sprite_pipeline_verification/*`.

## Change log

| Timestamp | Task ID | Change | Evidence |
| --- | --- | --- | --- |
| 2026-08-31T12:00:00+09:00 | TASK-20260831-rule-machine-launch | initialized | user request + local guide review |
| 2026-08-31T13:25:57+09:00 | TASK-20260831-rule-machine-launch | implementation complete and reviewed | automated verification + browser visual check |
