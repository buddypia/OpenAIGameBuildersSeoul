# 작업 카드: 수학적 유기체 모션(생명 조화장) 도입

## 1. 작업 개요

- **작업명**: @yuruyurau 수학 모션 로직 도입 및 애니메이션 구현 (Bio-Harmonic Field)
- **사용자 가치 / 해결할 문제**: 테라리움 화면이 "개체가 떠다니는 장면"에 머물러 있어, 생태계 상태(건강도·다양성·환경)가 시각적 리듬으로 드러나지 않는다. 순수 수식 기반의 유기적 모션 레이어를 추가해 생태계 지표를 살아 있는 파형으로 보여준다.
- **관련 근거**: 사용자 요청("`docs/yuruyurau_motion_analysis/10_interactive_demo.html`를 참고해 수학 로직을 넣고 애니메이션으로 구현"), `docs/yuruyurau_motion_analysis/00~08`, PRD의 "수리적 시뮬레이션 깊이 / 감성 비주얼" 축.
- **범위**:
  - 순수 수학 모듈 `features/ecosystem/domain/harmonicMotion.ts` 신설 (스웜/펄스/스파인/버블/보텍스/호흡 6종 원리 + 생태 지표 → 파라미터 매핑).
  - 프레젠테이션 렌더러 `harmonicFieldRenderer.ts` 신설 및 `TerrariumRenderer` 합성.
  - 개체 애니메이션(생산자/초식/포식/분해자)에 감쇠 파동·진행파 적용.
  - HUD에 생명 조화장 토글·강도 슬라이더 및 실시간 수식 파라미터 표시.
  - 단위 테스트 및 문서(PLAN/README) 갱신.
- **비범위**: WebGL 전환, 오디오 연동 변경, 세이브/공유 포맷(DNA) 변경, 신규 생물 종 추가.
- **영향 영역**: UI / 시뮬레이션(표현 계층) / 문서

## 2. 완료의 정의(DoD)

| ID | 검증 가능한 수용 기준 | 검증 방법 | 판정 | 증거 |
| --- | --- | --- | --- | --- |
| DOD-01 | 수학 모듈의 모든 함수가 유한값을 반환하고, 문서화된 경계 안에서 클램프된다(극단 환경/통계 입력 포함) | `npm test` (`harmonicMotion.test.ts`) | 통과 | 29개 테스트 통과 |
| DOD-02 | 생태 지표(다양성·건강도·포식압·환경 4종)가 각각 조화장 파라미터를 실제로 바꾼다 | 단위 테스트에서 입력 대비 파라미터 단조 변화 검증 | 통과 | `deriveHarmonicField` 테스트 8종 |
| DOD-03 | 조화장 토글을 끄면 관련 드로우가 실행되지 않고(잔상 잔여물 없음), 강도 슬라이더가 0~100%로 반영된다 | 헤드리스 Chrome(CDP)로 토글·슬라이더 조작 후 스크린샷 비교 | 통과 | OFF 상태·강도 0% 상태 모두 조화장 미출력 확인 |
| DOD-04 | 도메인 계층이 브라우저 API·React·presentation에 의존하지 않는다 | `architecture.test.ts` | 통과 | 아키텍처 테스트 통과 |
| DOD-05 | 타입 체크와 프로덕션 빌드가 성공한다 | `npm run build` | 통과 | tsc + vite build 성공 (325KB / gzip 97KB) |
| DOD-06 | 기존 기능 회귀 없음(시뮬레이션/DNA/유전 테스트 전부 통과) | `npm test` | 통과 | 6파일 57테스트 전부 통과 |
| DOD-07 | 조화장이 프레임 예산을 위협하지 않는다 | CDP `Performance.getMetrics`로 ON/OFF 메인스레드 태스크 시간 비교 | 통과 | ON 20ms/s vs OFF 11ms/s → 약 0.3ms/frame |

## 3. 구현·검증 계획

- **변경 예정 파일**: `domain/harmonicMotion.ts`(신규), `presentation/harmonicFieldRenderer.ts`(신규), `presentation/terrariumRenderer.ts`, `presentation/TerrariumCanvas.tsx`, `presentation/EnvironmentHUD.tsx`, `features/ecosystem/index.ts`, `app/App.tsx`, `test/harmonicMotion.test.ts`(신규), `PLAN.md`, `README.md`
- **자동 검증**: `npm test`, `npm run build`
- **수동 검증**: 조화장 On/Off, 강도 0/50/100%, 온도 -10°C/45°C, 일시정지, 유리병 노크(보텍스), 돌연변이 촉매(버블 헤일로)
- **경계·실패 조건**: 개체 0마리, 건강도 0, 다양성 0, 극저온/극고온, 밀도 상한(성능)
- **호환성·성능·접근성**: 표본 수 상한 2600점 + 저강도 시 자동 감소, 기존 저장 데이터 포맷 불변, 토글 버튼에 `title`/`aria-pressed` 제공

## 4. 완료 기록

- **변경 요약**
  - `domain/harmonicMotion.ts`: 6종 수식 원리 + `deriveHarmonicField()` 매핑 (순수 함수, 브라우저 의존 없음)
  - `presentation/harmonicFieldRenderer.ts`: **잔상 누적 레이어** 기반 렌더러. 매 프레임 지워지는 메인 캔버스와 달리 전용 오프스크린 레이어를 `destination-out`으로 7.2%씩만 감쇠시켜, 점들이 쓸고 간 궤적이 발광 생명체 형태로 축적된다(원본 작품의 핵심).
  - `presentation/terrariumRenderer.ts`: 조화장 합성 단계 추가 + 개체 모션을 감쇠 파동·진행파로 교체
  - `presentation/EnvironmentHUD.tsx`: 토글·강도 슬라이더·실시간 수식 계기판
  - `app/App.tsx`: 파라미터 파생 및 신종 발견 시 어트랙터 폭발 트리거
- **성능 최적화**
  - 잔상 레이어를 항상 CSS 픽셀(1x) 해상도로 그린 뒤 확대 합성 → 고DPI 화면에서 전면 페이드·합성 비용이 DPR² 만큼 절감
  - 표본 스트라이드 3 + 알파 3배 → `lighter`는 선형 가산이므로 단위 시간당 누적 광량은 동일하고 드로우 콜만 1/3
- **실행한 명령과 결과**
  - `npm test` → 6 파일 / 57 테스트 통과
  - `npm run build` → tsc + vite 성공
  - 헤드리스 Chrome(CDP) 계측 → 조화장 ON 20ms/s, OFF 11ms/s (30FPS 고정 환경, 약 0.3ms/frame)
- **DoD 최종 판정**: 모든 항목 통과
- **알려진 제한 사항**
  - 조화장은 표현 계층 전용이며 시뮬레이션 수치(개체 이동·번식·에너지)에는 영향을 주지 않는다.
  - 성능 계측은 헤드리스(DPR 1, rAF 30FPS 상한) 환경 기준이다. Retina(DPR 2) 실기기에서는 합성 비용이 다소 늘지만, 레이어 자체가 1x 고정이라 증가분은 확대 합성과 코어 글로우에 한정된다.
  - 시각 확인은 개발 서버 + 헤드리스 스크린샷으로 수행했고, 실제 60FPS 디스플레이에서의 체감 프레임은 별도 확인이 필요하다.
