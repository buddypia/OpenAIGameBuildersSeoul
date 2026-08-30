# 경량 DDD 아키텍처

최종 수정: 2026-08-26

## 목적

이 프로젝트는 게임 전체를 기술별 폴더로 나누지 않고, 플레이어 가치와 업무 규칙(게임 규칙) 단위의 **경계 지어진 컨텍스트(bounded context)** 로 나눈다. 이렇게 하면 앞으로의 변경이 `REQUIREMENTS.md`, `PRD.md`, `PLAN.md`의 어떤 요구사항을 구현하는지 추적할 수 있고, 표시·Web Audio·공유 형식의 변경이 시뮬레이션 규칙까지 끌고 들어가지 않는다.

이것은 경량 DDD다. 엔티티, 리포지토리, CQRS 같은 것을 형식만 갖춰 늘리지 않는다. 도메인 규칙이 있는 곳만 분리하고, React 앱에 필요한 최소한의 구조만 유지한다.

## 레이어와 의존 방향

```
app(합성·화면 상태)
  └── features/<context>/index.ts(공개 API만)
        ├── presentation(React / Canvas UI)
        ├── application(유스케이스. 필요해질 때만 추가)
        ├── infrastructure(Web API, 코덱 등 외부 기술)
        └── domain(게임 규칙·계산·불변 조건)
              └── shared/kernel(여러 컨텍스트가 함께 쓰는 안정적인 어휘)
```

- `src/app`은 합성 루트이며, 기능 간 UI 연동과 수명이 짧은 화면 상태만 가진다. 기능 내부 경로를 직접 import 하지 않는다.
- 각 `features/<context>/index.ts`는 해당 컨텍스트의 유일한 공개 입구다. 다른 컨텍스트와 테스트는 이곳을 사용한다.
- `domain`은 React, Canvas, Web Audio, `window`, `localStorage`에 의존하지 않는다. `EcosystemEngine`의 알림은 `SimulationCallbacks`라는 포트로 전달한다.
- `infrastructure`는 브라우저나 라이브러리 의존성을 격리한다. 예: Hive DNA의 LZString, Web Audio API, 언어 설정의 localStorage 저장.
- `presentation`은 표시와 사용자 입력을 담당하며, 게임 규칙을 복제하지 않는다.
- `shared/kernel`에는 `EnvironmentState`, `Genome`, `Organism` 같은 안정적인 공통 어휘만 둔다. 기능 고유의 규칙은 두지 않는다.

## 컨텍스트 맵

각 컨텍스트의 공개 계약, 불변 조건, 검증은 [`docs/contexts/`](contexts/)의 SPEC이 상세히 기술한다. 아래 표는 소유 관계의 요약이다.

| 컨텍스트 | 책임 | 주요 근거 | 공개 입구 |
| --- | --- | --- | --- |
| `ecosystem` | 환경 조작, 4단계 생태계, 유전, 진화, Canvas 관찰 | FR-ENV-01~05, FR-SIM-01~03, NFR-PERF-01~03 | `src/features/ecosystem/index.ts` |
| `species` | 도감과 개체 인스펙터 | FR-BIO-01~02 | `src/features/species/index.ts` |
| `progression` | 퀘스트와 진행 판정 | FR-PROG-01 | `src/features/progression/index.ts` |
| `customization` | 유리병, 바닥재, 배경 선택 | FR-PROG-02 | `src/features/customization/index.ts` |
| `photo` | 포토 모드와 내보내기 | FR-PROG-03 | `src/features/photo/index.ts` |
| `hive` | DNA 공유·가져오기 검증·방문 UI·로컬 자동 저장 | FR-HIVE-01~04 | `src/features/hive/index.ts` |
| `audio` | Web Audio 적응형 사운드 | FR-AUD-01~03, NFR-UX-01 | `src/features/audio/index.ts` |
| `showcase` | 심사위원 프리셋과 개발 스토리 | FR-JUDGE-01~02 | `src/features/showcase/index.ts` |
| `onboarding` | 플레이 가이드와 첫 이해 | NFR-UX-02 | `src/features/onboarding/index.ts` |
| `i18n` | 한국어·영어·일본어 카탈로그, 언어 선택과 저장 | NFR-UX-02 | `src/features/i18n/index.ts` |

의존 관계의 요점은, `hive`가 공유 커널의 스냅샷을 검증·전송하되 생태계 규칙을 다시 구현하지 않는 것, 그리고 `audio`와 `presentation`이 `ecosystem`의 상태를 소비하더라도 규칙을 바꾸지 않는 것이다. `i18n`은 어느 컨텍스트에도 의존하지 않고, 각 컨텍스트의 `presentation`이 `i18n`의 공개 API를 소비한다.

## 현재 물리 배치

```
src/
├── app/                         # React 합성 루트
├── shared/kernel/               # 공통 어휘(타입·DTO)
└── features/
    ├── ecosystem/{domain,presentation}/
    ├── audio/infrastructure/
    ├── species/presentation/
    ├── progression/{domain,presentation}/
    ├── customization/presentation/
    ├── photo/presentation/
    ├── hive/{infrastructure,presentation}/
    ├── i18n/{domain,infrastructure,presentation}/
    ├── showcase/presentation/
    └── onboarding/presentation/
```

`application/`은 여러 UI에서 호출되는 유스케이스, 트랜잭션 경계, 외부 포트가 생긴 컨텍스트에만 추가한다. 화면 하나에서만 쓰는 단순한 상태 갱신을 억지로 클래스화하지 않는다.

## 호환성의 중요 계약

- Hive DNA는 공개 데이터 계약이다. `decodeEcosystemDNA`는 신뢰할 수 없는 입력을 검증하고, v1.0.0의 `sampleOrganisms`를 현재의 `organisms`로 정규화한다. 형식을 바꿀 때는 신·구 왕복 테스트와 손상 입력 테스트가 필수다.
- `EcosystemEngine`은 개체수 상한, 정지 시 불변성, 사체 순환, 유한한 통곗값을 지킨다. 동작을 바꿀 때는 대응하는 도메인 테스트를 추가한다.
- `features/*/index.ts`는 의도된 공개 계약이다. 내부 파일 경로를 외부 코드에 노출하지 않는다.
- 언어 카탈로그의 스키마는 한국어 트리(`messages.ts`)에서 파생된다. 다른 언어의 키가 빠지거나 틀리면 `undefined`가 화면에 나오는 대신 TypeScript 빌드가 실패한다.

## 개발 시 판단 순서

1. `FEATURES.md`에서 대상 기능을 찾고, `REQUIREMENTS.md`의 FR/NFR과 `PRD.md`의 게임 루프를 읽는다.
2. 이 문서의 컨텍스트 맵으로 소유 컨텍스트를 정한다. 둘에 걸치면 어느 쪽이 규칙을 소유하고 어느 쪽이 공개 API를 소비하는지 정한다. 해당 컨텍스트의 `docs/contexts/<context>.md`에서 깨뜨리면 안 되는 불변 조건을 확인한다.
3. `docs/specs/`에 작업 폴더를 만들어 범위, 비범위, 리스크, FR, DoD, 검증 방법을 기록한다(작은 변경은 `docs/TASK_TEMPLATE.md`의 단일 카드로 대신해도 된다).
4. 규칙·불변 조건은 `domain`, UI에서 쓰는 동작의 조정은 `application`, 브라우저 I/O는 `infrastructure`, React/Canvas는 `presentation`에 둔다.
5. 새로 외부에서 쓸 대상은 `index.ts`에서 명시적으로 export 한다. 내부 구현 import를 늘리지 않는다.
6. 정상·실패·경계 케이스를 테스트하고 `pnpm test`와 `pnpm build`를 실행한다. 완료 보고는 `docs/DEFINITION_OF_DONE.md`를 따른다.

## 변경할 때 피할 것

- 기술 이름만으로 나눈 횡단 폴더(새로운 `components/`, `utils/`, `services/`, `simulation/`)로 되돌아가는 것.
- 도메인에서 `window`, React hook, Web Audio, Canvas를 직접 참조하는 것.
- 일시적인 화면 사정으로 공유 커널에 기능 고유 규칙을 추가하는 것.
- DNA 스키마를 버전·마이그레이션·호환성 테스트 없이 바꾸는 것.
- 플레이어에게 보이는 문구를 컴포넌트에 직접 써넣는 것. 문구는 언어 카탈로그에, 판단 규칙은 도메인에 둔다.
- PRD나 요구사항과 연결되지 않는 "나중에 쓸지도 모르는" 추상화를 추가하는 것.

## 구조의 자동 검증

`src/test/architecture.test.ts`는 다음을 확인한다. 옛 기술별 디렉터리가 되살아나지 않았는지, 각 기능에 공개 API가 있는지, `app`이 내부 구현이 아니라 공개 API에만 의존하는지, 도메인이 UI 라이브러리에 의존하지 않는지, 그리고 플레이어에게 보이는 한국어 문구가 컴포넌트가 아니라 언어 카탈로그에만 있는지. 새 컨텍스트를 추가했다면 그 공개 입구, 테스트의 기대 목록, `docs/contexts/`의 SPEC, `FEATURES.md`의 컨텍스트 요약 표도 함께 갱신한다.
