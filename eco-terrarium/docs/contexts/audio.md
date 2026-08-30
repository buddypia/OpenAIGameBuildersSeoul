# `audio` SPEC

최종 확인: 2026-08-30 · 공개 입구: `src/features/audio/index.ts`

## 1. 책임

생태계의 상태를 소리로 들리게 한다. 외부 오디오 에셋 없이 Web Audio API로 전부 합성한다.

**소유한다**: `AudioContext` 수명 주기와 자동 재생 정책 대응, 앰비언트 코드 진행, 생물 이벤트 챠임, 절차적 환경 폴리, 볼륨·음소거.
**소유하지 않는다**: 언제 소리가 나야 하는지의 판단. `ecosystem`이 `SimulationCallbacks`로 알리면 이 컨텍스트가 합성만 한다.

## 2. 소유 요구사항

| ID | 요구 | 구현 위치 |
| --- | --- | --- |
| FR-AUD-01 | 건강도·주야 주기에 따른 펜타토닉/리디안 코드 진행 전환 | `infrastructure/audioEngine.ts` (`updateState`) |
| FR-AUD-02 | 탄생·섭식·진화 시 고유 주파수 챠임을 템포에 맞춰 합성 | `infrastructure/audioEngine.ts` (`playBioSound`) |
| FR-AUD-03 | 빗소리(밴드패스 노이즈), 햇살 앰비언스, 유리병 탭 사운드 및 On/Off·볼륨 | `infrastructure/audioEngine.ts` (`setVolume`, `toggleMute`, `getMuted`) |
| NFR-UX-01 | 첫 사용자 상호작용 후 `AudioContext` resume | `infrastructure/audioEngine.ts` (`init`) |

## 3. 공개 계약

| 종류 | 이름 | 용도 |
| --- | --- | --- |
| 클래스 | `AudioEngine` | 유일한 공개 진입점 |

`AudioEngine`의 표면: `init()`, `updateState(env, stats)`, `playBioSound(type, pitchShift?)`, `setVolume(vol)`, `toggleMute(): boolean`, `getMuted(): boolean`.
`playBioSound`의 `type`은 `'eat' | 'reproduce' | 'evolve' | 'death' | 'tap' | 'drop'`이다.

## 4. 규칙과 불변 조건

- **사용자 조작 전에는 `AudioContext`를 만들거나 재생하지 않는다.** 자동 재생 정책 위반은 콘솔 경고가 아니라 기능 실패다.
- **오디오를 지원하지 않거나 초기화에 실패한 브라우저에서 게임이 멈추지 않는다.** 조용히 실패한다.
- **음소거 상태에서는 어떤 소리도 나지 않는다.**
- **오디오는 시뮬레이션 상태를 바꾸지 않는다.** 단방향 소비만 한다.

## 5. 의존 방향

- 의존하는 곳: `shared/kernel`(`EnvironmentState`, `EcosystemStats`), Web Audio API(격리된 `infrastructure`).
- 이 컨텍스트에 의존하는 곳: `app`.
- `domain` 레이어를 두지 않는다. 판단 규칙이 없고 합성만 하기 때문이다.

## 6. 검증

| 테스트 파일 | 지키는 성질 |
| --- | --- |
| `src/test/architecture.test.ts` | 공개 API 경유, 도메인 코드가 브라우저 기술에 의존하지 않음 |

자동 테스트로 소리를 검증하지 않는다. 수동 확인이 근거다: 첫 클릭 전 무음 → 클릭 후 앰비언트 시작, 섭식·진화 시 챠임, 음소거 토글, 볼륨 슬라이더, Web Audio 미지원 환경에서 게임 정상 동작.

## 7. 변경 시 주의

- 새 사운드를 추가할 때 `playBioSound`의 `type` 유니온을 넓히고 호출부를 함께 갱신한다.
- 오디오 초기화 시점을 앞당기지 않는다. NFR-UX-01이 깨진다.
