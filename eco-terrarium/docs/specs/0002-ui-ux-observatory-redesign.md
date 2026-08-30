# UI/UX 관찰실 리디자인

## 1. 작업 개요

- **사용자 가치 / 해결할 문제**: 생성형 UI의 과도한 글래스모피즘, 장식성 색상, 이모지 의존을 줄이고, 플레이 중 환경 조작과 생태계 관찰에 집중할 수 있는 신뢰도 높은 관찰실 인터페이스를 제공한다.
- **관련 근거**: 사용자 요청, `REQUIREMENTS.md` FR-ENV-01~05, FR-BIO-02, FR-PROG-03, NFR-UX-02~03, NFR-PERF-03, PRD 2.1.
- **범위**: 앱 셸, 상단 작업 메뉴, 캔버스 안내, 환경 제어 HUD, 생태 통계 패널, 전 모달의 표면·입력·버튼·포커스·모션 스타일, `DESIGN.md` 토큰.
- **비범위**: 생태 시뮬레이션, 오디오 합성, DNA 형식, 모달의 기능·데이터 구조, 새 에셋 또는 외부 의존성 추가.
- **위험 및 롤백**: 모바일에서 캔버스와 제어 패널의 세로 흐름 또는 기존 모달의 색상 의미가 바뀔 수 있다. 변경 파일을 되돌리면 기존 레이아웃과 색상으로 복구된다.

## 2. 완료의 정의(DoD)

| ID | 검증 가능한 수용 기준 | 검증 방법 | 판정 | 증거 |
| --- | --- | --- | --- | --- |
| DOD-01 | 네 가지 환경값, 도구 선택, 배속/음소거가 기존 콜백과 값 범위를 유지하며 조작 우선순위가 드러난다. | 코드 검토, `pnpm test`, 브라우저 수동 확인 | 통과 | Playwright에서 돌연변이 촉매 도구 `aria-pressed=true`, 키보드 Tab 이후 버튼 포커스, 기존 35개 테스트 통과. |
| DOD-02 | 선택·주요 액션 버튼과 모달 탭이 단일 moss 색상 체계를 사용하며, `개체에 돌연변이 촉매제 주입하기`에 무지개/보라 그라디언트가 남지 않는다. | CSS/JSX 검토, Playwright 계산 스타일과 스크린샷 | 통과 | 주입 버튼은 `modal-primary-action`, 계산 배경 `rgb(181, 230, 190)`이다. 쇼케이스 프리셋과 Hive 탭은 공통 `modal-option`/`modal-option-active`로 동일한 forest-moss 상태 체계를 사용한다. |
| DOD-03 | 주요 조작 요소가 키보드 포커스와 44px 터치 영역을 제공하고 색상 외 텍스트·아이콘 상태를 함께 제공한다. | CSS/JSX 검토, 키보드 수동 확인 | 통과 | 전역 `:focus-visible`, `.topbar-action`·`.tool-button`·`.control-button`·`.modal-primary-action` 최소 44px 및 `aria-pressed`/텍스트 레이블 확인. |
| DOD-04 | 375px 모바일과 1440px 데스크톱에서 가로 오버플로 없이 캔버스와 제어 영역에 접근할 수 있다. | 브라우저 스크린샷 수동 확인 | 통과 | `.impeccable/review/desktop.png`, `mobile.png`; 각 `scrollWidth`가 1440/375 뷰포트와 동일. |
| DOD-05 | Google `design.md` 형식의 토큰 문서가 유효하고, 타입 검사·기존 35개 테스트·프로덕션 빌드가 통과한다. | `npx @google/design.md lint DESIGN.md`, `pnpm test`, `pnpm build` | 통과 | lint 오류 0, `pnpm test` 35/35, `pnpm build` 성공. |
| DOD-06 | 캔버스, 슬라이더, 모달이 키보드 접근·명시적 레이블·대화상자 종료 흐름을 제공한다. | Playwright 키보드/역할 검증 | 통과 | 4개 slider `aria-label`, 캔버스 Enter로 관찰창 열기, Escape로 관찰창과 도감·퀘스트·커스텀·Hive·가이드 모달 종료, 모든 대상 `role="dialog" aria-modal="true"` 확인. |

## 3. 완료 기록

- **변경 요약**: 관찰실 중심 앱 셸을 보존하면서, 모달과 도구 선택을 단일 moss 액션 색상 체계로 통일했다. 돌연변이 주입과 내보내기 버튼의 그라디언트를 제거했고, Google `design.md` 형식에 맞춘 토큰·적용 원칙을 확장했다. 모달 포커스·Escape 종료, 키보드 캔버스 관찰, 명시적 슬라이더 레이블을 보강했다.
- **실행한 명령과 결과**: `pnpm test`(35/35), `pnpm build`(성공), `npx @google/design.md lint DESIGN.md`(오류·경고 0), Playwright 데스크톱·모바일·쇼케이스·개체 관찰창·5종 모달 역할/종료 흐름(콘솔/페이지 오류 없음), Impeccable detector(기계적 경고 검토 및 핵심 색상/모션 문제 수정).
- **DoD 최종 판정**: 모든 항목 통과.
- **알려진 제한 사항 및 후속 작업**: `components.json`과 Radix 의존성이 없으므로 shadcn 컴포넌트 추가 및 Base UI 마이그레이션은 적용 대상이 아니다.
