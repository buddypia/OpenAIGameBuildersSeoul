# `ecosystem` SPEC

최종 확인: 2026-08-30 · 공개 입구: `src/features/ecosystem/index.ts`

## 1. 책임

플레이어가 신의 손으로 환경을 바꾸면, 그 변화가 4단계 먹이사슬과 유전에 물리·수리적으로 반영되어 눈앞에서 진화가 일어나게 한다.

**소유한다**: 환경 파라미터의 의미와 영향, Lotka-Volterra 거시 동역학, 개체 기반 Boids·생명 주기, 유전자 돌연변이·교배·분화 판정, 생태 지표(건강도·하모니·섀넌 지수), 캔버스 렌더링과 유기적 모션.
**소유하지 않는다**: 도감 UI(`species`), 퀘스트 판정(`progression`), 사운드 트리거의 실제 합성(`audio`), 저장 형식(`hive`), 화면 문구(`i18n`).

## 2. 소유 요구사항

| ID | 요구 | 구현 위치 |
| --- | --- | --- |
| FR-ENV-01 | 일조량 0~100% 조절, 광합성·온도·광과민 행동에 반영 | `presentation/EnvironmentHUD.tsx`, `domain/lotkaVolterra.ts` |
| FR-ENV-02 | 수분·강우 0~100% 조절, 분해자 활동과 과습 반영 | `presentation/EnvironmentHUD.tsx`, `domain/ecosystemEngine.ts` |
| FR-ENV-03 | 온도 -10°C~45°C 조절, 내성 이탈 시 체력 감소와 지향성 돌연변이 | `domain/lotkaVolterra.ts`(`getTemperatureMortalityStress`), `domain/genetics.ts` |
| FR-ENV-04 | 영양소·돌연변이 촉매 투하와 개체의 섭취 반응 | `domain/ecosystemEngine.ts`(`ConsumptionEffect`) |
| FR-ENV-05 | 유리병 두드리기 충격파와 개체 산개 | `domain/ecosystemEngine.ts`(`Shockwave`) |
| FR-SIM-01 | 생산자·초식·포식자·분해자 4단계 순환과 사체 분해 | `domain/lotkaVolterra.ts`, `domain/ecosystemEngine.ts` |
| FR-SIM-02 | 개체 상태(HP·허기·수명·번식 쿨다운·FSM), 유체 저항, Boids | `domain/ecosystemEngine.ts` |
| FR-SIM-03 | 10차원 Genome, 가우시안 노이즈 + 환경 압력 돌연변이, 분화 | `domain/genetics.ts`, `domain/speciesData.ts` |
| NFR-PERF-01 | 개체 100+ / 파티클 300+ 에서 60 FPS | `presentation/terrariumRenderer.ts` |
| NFR-PERF-02 | 객체 풀링으로 GC 스파이크 방지 | `presentation/terrariumRenderer.ts`, `domain/ecosystemEngine.ts` |

## 3. 공개 계약

`index.ts`가 원본이다. 외부가 의존해도 되는 축은 다음 넷이다.

| 축 | 주요 export | 용도 |
| --- | --- | --- |
| 시뮬레이션 | `EcosystemEngine`, `SimulationCallbacks`, `Shockwave`, `ConsumptionEffect`, `occursDuringInterval` | 상태 전이의 유일한 주체. 알림은 콜백 포트로만 나간다 |
| 수리 모델 | `calculateLVDerivatives`, `rk4Step`, `DEFAULT_LV_PARAMS`, `calculateEcosystemScores`, `calculateShannonIndex`, `getEnvironmentalGrowthMultiplier`, `getTemperatureMortalityStress` | 순수 함수. 테스트와 재현이 쉬워야 한다 |
| 유전 | `mutateGenome`, `crossoverGenomes`, `checkSpeciation`, `INITIAL_SPECIES_DATABASE` | 진화 규칙 |
| 표시 | `TerrariumCanvas`, `TerrariumRenderer`, `EnvironmentHUD`, `StatsPanel`, `CreaturePortrait`, `ActiveTool`, `RenderContext` | 관찰과 조작 UI |
| 안내 | `getEcosystemAdvice`, `getEnvironmentReading` 및 그 id 타입 | 판단은 도메인이 하고, 문구는 `i18n`이 붙인다 |

`harmonicMotion`의 `clamp`, `radialPulseWave`, `travelingSpineWave`, `breathingScalar`는 순수 수학 유틸로 공개되어 있으며 브라우저 API에 의존하지 않는다.

## 4. 규칙과 불변 조건

깨지면 버그다.

- **개체수 상한이 존재한다.** 반복 스폰으로 상한을 넘지 못한다.
- **일시정지 중에는 상태가 전진하지 않는다.** 배속 0에서 틱을 돌려도 개체·환경·통계가 불변이다.
- **스폰 에너지는 개체별 최대 에너지를 넘지 않는다.** 영양소 섭취로 회복할 때도 상한을 넘지 않는다.
- **모든 죽음은 정확히 하나의 사체를 만든다.** 분해자 순환이 끊기거나 사체가 중복 생성되지 않는다.
- **통곗값은 유한하다.** RK4 적분이 NaN이나 음수 개체수를 만들지 않는다.
- **시간 기반 확률은 프레임률에 독립이다.** `occursDuringInterval`이 배속·프레임률과 무관한 기대값을 준다.
- **캔버스 크기가 바뀌어도 개체 분포가 보존된다.**
- **소비 효과는 만료되고 보유 수가 유한하다.**
- **초기화는 최초 실행 상태로 정확히 되돌리고, 그 뒤에도 정상 시뮬레이션이 계속된다.**
- **분화는 이미 발견한 종을 다시 반환하지 않는다.** 잠긴 종에 도달할 수 있어야 한다.
- **방치된 테라리움은 시간이 지나도 유계이며 회복 가능하다.**

## 5. 의존 방향

- 의존하는 곳: `shared/kernel`(`EnvironmentState`, `Genome`, `Organism`), `i18n`(표시 문구만).
- 이 컨텍스트에 의존하는 곳: `app`, `species`, `progression`, `photo`, `audio`, `hive`. 모두 규칙을 복제하지 않고 결과를 소비한다.
- `domain`은 React·Canvas·Web Audio·`window`·`localStorage`에 의존하지 않는다. 외부 알림은 `SimulationCallbacks` 포트로만 나간다.

## 6. 검증

| 테스트 파일 | 지키는 성질 |
| --- | --- |
| `src/test/ecosystemEngine.test.ts` | 위 §4의 불변 조건 대부분(상한, 일시정지, 에너지 상한, 사체 1:1, 초기화, 충격파, 프레임률 독립성, 장시간 유계성) |
| `src/test/simulation.test.ts` | 환경 배수, 온도 사망 스트레스, RK4 무결성, 섀넌 지수, 건강도·하모니 점수 |
| `src/test/genetics.test.ts` | 돌연변이 경계, 교배, 분화 조건, 이미 해금된 종 제외 |
| `src/test/harmonicMotion.test.ts` | 순수 모션 함수의 경계와 주기성 |
| `src/test/ecosystemGuidance.test.ts` | 극단 환경의 위험 판정, 안내 우선순위, 안내 id의 3개 언어 완비 |
| `src/test/architecture.test.ts` | 도메인이 표시·브라우저 기술에 의존하지 않음, 공개 API 경유 |

수동 확인: 개체 100+ 상태에서 DevTools Performance로 프레임 유지 확인(NFR-PERF-01), 캔버스 클릭·드래그로 사료/촉매/노크 반응 확인(FR-ENV-04~05).

## 7. 변경 시 주의

- 엔진 동작을 바꿀 때는 §4의 대응 불변 조건에 테스트를 먼저 추가한다.
- 규칙은 `domain`에, 브라우저 I/O는 `infrastructure`에, React/Canvas는 `presentation`에 둔다. 도메인이 판단하고 문구는 `i18n`이 붙인다(`EcosystemAdviceId` 패턴을 따른다).
- Genome 스키마를 바꾸면 `shared/kernel/types.ts`, `REQUIREMENTS.md` FR-SIM-03, `species` 인스펙터 표시, `hive`의 DNA 왕복이 함께 영향을 받는다.
