# 기능 개발 리스트 (FEATURES.md)

이 문서는 에코 테라리움의 **모든 기능을 한 화면에서 보는 단일 인덱스**다. 요구사항 ID 하나를 잡으면 소유 컨텍스트, 구현 상태, 상세 스펙, 검증 근거로 곧장 이동할 수 있다.

- **무엇을 만들지(Why/Who)**는 [`PRD.md`](PRD.md)에 있다.
- **무엇을 만족해야 하는지(What, ID 레지스트리)**는 [`REQUIREMENTS.md`](REQUIREMENTS.md)에 있다. **FR/NFR ID는 이 저장소의 유일한 추적 키다.**
- **어떻게 동작하는지(계약 단위)**는 [`docs/contexts/`](docs/contexts/)의 컨텍스트별 SPEC에 있다.
- **언제 무엇을 할지(변경 단위)**는 [`docs/specs/`](docs/specs/)의 작업별 폴더에 있다.
- **경계와 의존 방향**은 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)에 있다.

> 이 표는 요약이다. 상태 판정의 증거는 [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)의 추적표와 각 SPEC의 "검증" 절이 원본이다. 새 기능을 시작하기 전 절차는 [`docs/FEATURE_DEVELOPMENT.md`](docs/FEATURE_DEVELOPMENT.md)를 따른다.

## 상태 표기

| 표기 | 의미 |
| --- | --- |
| 구현 완료 | 요구사항을 만족하는 구현이 있고, 자동 또는 수동 검증 증거가 있다. |
| 목업 | 화면과 흐름은 있으나 데이터·연동이 임시다. 요구사항에 그 사실이 명시되어 있다. |
| 요구사항 미정의 | 코드가 먼저 존재한다. `REQUIREMENTS.md`에 항목을 추가해야 추적이 성립한다. |

## 기능 요구사항 (FR)

| FR ID | 기능 | 소유 컨텍스트 | 상태 | SPEC |
| --- | --- | --- | --- | --- |
| FR-ENV-01 | 일조량(Sunlight / UV) 조절 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-ENV-02 | 수분 및 강우(Rainmaker) 조절 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-ENV-03 | 온도(Thermal Regulator) 조절 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-ENV-04 | 영양소 & 촉매 투하 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-ENV-05 | 유리병 두드리기 인터랙션 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-SIM-01 | 4단계 먹이사슬 트로픽 레벨 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-SIM-02 | 개체 기반 Boids 및 생명 주기 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-SIM-03 | 유전 돌연변이 및 진화 시스템 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| FR-BIO-01 | 15종 이상의 생물 도감 | `species` | 구현 완료 | [species](docs/contexts/species.md) |
| FR-BIO-02 | 실시간 개체 관찰 모드(현미경 인스펙터) | `species` | 구현 완료 | [species](docs/contexts/species.md) |
| FR-AUD-01 | 적응형 앰비언트 코드 패드 | `audio` | 구현 완료 | [audio](docs/contexts/audio.md) |
| FR-AUD-02 | 바이오 리듬 아르페지오(생물 챠임) | `audio` | 구현 완료 | [audio](docs/contexts/audio.md) |
| FR-AUD-03 | 절차적 환경 폴리 사운드 | `audio` | 구현 완료 | [audio](docs/contexts/audio.md) |
| FR-PROG-01 | 생태계 지휘자 퀘스트 | `progression` | 구현 완료 | [progression](docs/contexts/progression.md) |
| FR-PROG-02 | 테라리움 커스터마이징 | `customization` | 구현 완료 | [customization](docs/contexts/customization.md) |
| FR-PROG-03 | 타임랩스 및 사진 모드 | `photo` | 구현 완료 | [photo](docs/contexts/photo.md) |
| FR-HIVE-01 | 생태계 DNA 단축 코드 생성 및 공유 | `hive` | 구현 완료 | [hive](docs/contexts/hive.md) |
| FR-HIVE-02 | 가상 테라리움 방문 모드 | `hive` | 구현 완료 | [hive](docs/contexts/hive.md) |
| FR-HIVE-03 | 글로벌 생태 랭킹 리더보드 | `hive` | 목업 | [hive](docs/contexts/hive.md) |
| FR-HIVE-04 | 로컬 자동 저장 및 복원 | `hive` | 구현 완료 | [hive](docs/contexts/hive.md) |
| FR-HIVE-05 | 현장 시연용 QR 코드 공유 | `hive` | 구현 완료 | [hive](docs/contexts/hive.md) |
| FR-JUDGE-01 | 심사위원 원클릭 퀵 쇼케이스 | `showcase` | 구현 완료 | [showcase](docs/contexts/showcase.md) |
| FR-JUDGE-02 | Codex AI 네이티브 개발기 모달 | `showcase` | 구현 완료 | [showcase](docs/contexts/showcase.md) |

## 비기능 요구사항 (NFR)

| NFR ID | 요구 | 주 소유 컨텍스트 | 상태 | SPEC |
| --- | --- | --- | --- | --- |
| NFR-PERF-01 | 개체 100+ / 파티클 300+ 에서 60 FPS | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| NFR-PERF-02 | 파티클·엔티티 객체 풀링으로 GC 스파이크 방지 | `ecosystem` | 구현 완료 | [ecosystem](docs/contexts/ecosystem.md) |
| NFR-PERF-03 | 320px ~ 4K 반응형 스케일링 | 횡단(`app` + 각 `presentation`) | 구현 완료 | [_cross-cutting](docs/contexts/_cross-cutting.md) |
| NFR-PERF-04 | 번들 최소화 및 외부 대용량 에셋 없는 단일 로딩 | 횡단(빌드) | 구현 완료 | [_cross-cutting](docs/contexts/_cross-cutting.md) |
| NFR-UX-01 | 브라우저 자동 재생 정책 준수 | `audio` | 구현 완료 | [audio](docs/contexts/audio.md) |
| NFR-UX-02 | 툴팁·온보딩 가이드 및 다국어 | `onboarding`, `i18n` | 구현 완료 | [onboarding](docs/contexts/onboarding.md), [i18n](docs/contexts/i18n.md) |
| NFR-UX-03 | 명도 대비 및 색상 외 형태·아이콘 기반 상태 구분 | 횡단(`DESIGN.md` 토큰) | 구현 완료 | [_cross-cutting](docs/contexts/_cross-cutting.md) |

## 컨텍스트별 소유 요약

| 컨텍스트 | 소유 요구사항 | 공개 입구 | SPEC |
| --- | --- | --- | --- |
| `ecosystem` | FR-ENV-01~05, FR-SIM-01~03, NFR-PERF-01~02 | `src/features/ecosystem/index.ts` | [ecosystem.md](docs/contexts/ecosystem.md) |
| `species` | FR-BIO-01~02 | `src/features/species/index.ts` | [species.md](docs/contexts/species.md) |
| `progression` | FR-PROG-01 | `src/features/progression/index.ts` | [progression.md](docs/contexts/progression.md) |
| `customization` | FR-PROG-02 | `src/features/customization/index.ts` | [customization.md](docs/contexts/customization.md) |
| `photo` | FR-PROG-03 | `src/features/photo/index.ts` | [photo.md](docs/contexts/photo.md) |
| `hive` | FR-HIVE-01~05 | `src/features/hive/index.ts` | [hive.md](docs/contexts/hive.md) |
| `audio` | FR-AUD-01~03, NFR-UX-01 | `src/features/audio/index.ts` | [audio.md](docs/contexts/audio.md) |
| `showcase` | FR-JUDGE-01~02 | `src/features/showcase/index.ts` | [showcase.md](docs/contexts/showcase.md) |
| `onboarding` | NFR-UX-02 | `src/features/onboarding/index.ts` | [onboarding.md](docs/contexts/onboarding.md) |
| `i18n` | NFR-UX-02 | `src/features/i18n/index.ts` | [i18n.md](docs/contexts/i18n.md) |

## 열린 항목 (백로그·갭)

추적 키가 없거나 임시 구현인 항목만 남긴다. 완료 항목은 위 표와 `docs/PROJECT_STATE.md`가 관리한다.

| # | 항목 | 컨텍스트 | 현재 상태 | 다음 행동 |
| --- | --- | --- | --- | --- |
| G-01 | Hive 리더보드 실데이터 연동 | `hive` | **목업** — `HiveShareModal.tsx`의 `MOCK_LEADERBOARD_STATS` 기반이며 FR-HIVE-03에 그 사실이 명시되어 있다 | 실제 Hive SDK 연동 시 새 작업 폴더를 `docs/specs/`에 만들고 FR-HIVE-03의 목업 단서를 갱신 |

이 인덱스를 만들면서 닫은 갭:

- **QR 코드 공유** — 코드와 테스트(`src/test/qrCode.test.ts`, 7 tests)가 먼저 존재하고 대응 FR이 없었다. 출하된 동작 그대로 `REQUIREMENTS.md` 2.6절에 **FR-HIVE-05**로 기술해 추적 키를 부여했다.
- **`ARCHITECTURE.md`의 `hive` 근거가 FR-HIVE-01~03으로 낡아 있던 것** — FR-HIVE-04(로컬 자동 저장)를 포함하도록 정정했다.
- **NFR-PERF-03·04, NFR-UX-03에 소유자가 없던 것** — [`_cross-cutting.md`](docs/contexts/_cross-cutting.md)로 명시적 소유를 부여했다.
- **목업 상수 이름의 오기** — `REQUIREMENTS.md`와 `docs/PROJECT_STATE.md`가 `MOCK_LEADERBOARDS`로 적고 있었으나 실제 이름은 `HiveShareModal.tsx`의 `MOCK_LEADERBOARD_STATS`다. 양쪽을 정정했다.

## 이 문서를 갱신하는 시점

1. `REQUIREMENTS.md`에 FR/NFR을 추가·삭제했을 때 → 해당 행을 추가·삭제한다.
2. 기능의 상태가 바뀌었을 때(목업 → 구현 완료 등) → 상태 열과 `docs/PROJECT_STATE.md`의 근거를 함께 갱신한다.
3. 새 bounded context를 만들었을 때 → 컨텍스트 요약 표, `docs/contexts/`의 SPEC, `docs/ARCHITECTURE.md`의 컨텍스트 맵, `src/test/architecture.test.ts`의 기대 목록을 함께 갱신한다.
