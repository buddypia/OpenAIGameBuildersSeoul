# `hive` SPEC

최종 확인: 2026-08-30 · 공개 입구: `src/features/hive/index.ts`

## 1. 책임

플레이어의 테라리움을 신뢰할 수 없는 외부(URL, 클립보드, `localStorage`)로 안전하게 내보내고 되가져온다.

**소유한다**: 생태계 스냅샷의 직렬화 형식과 그 검증, 단축 코드 규칙, 딥링크 파싱, 로컬 자동 저장의 수명 주기, QR 코드 생성, 공유·방문·리더보드 UI.
**소유하지 않는다**: 생태계 규칙 자체(`ecosystem`). 이 컨텍스트는 스냅샷을 **검증하고 전송할 뿐 재구현하지 않는다.**

## 2. 소유 요구사항

| ID | 요구 | 구현 위치 |
| --- | --- | --- |
| FR-HIVE-01 | lz-string 압축 URI-safe 인코딩, `ECO-XXXX-XX` 단축 코드, `?dna=`(별칭 `?code=`) 딥링크 | `infrastructure/dnaCodec.ts`, `presentation/HiveShareModal.tsx` |
| FR-HIVE-02 | 타인 코드 입력 → 방문 관람, 꽃가루 선물, 포자 채집 | `presentation/HiveShareModal.tsx` |
| FR-HIVE-03 | 지속 시간·도감 해금율·바이오 하모니 랭킹 (**현 빌드는 `MOCK_LEADERBOARD_STATS` 목업**) | `presentation/HiveShareModal.tsx` |
| FR-HIVE-04 | 10초 주기 + 탭 이탈 시 압축 자동 저장, 재방문 복원, 딥링크 우선, 손상본 폐기, 확인 후 초기화 | `infrastructure/localSave.ts` |
| FR-HIVE-05 | 현장 시연용 QR 공유: 관객 폰에서 열리는 주소 폴백, 쿼리 제거, 언어 전달, 오류 정정 H | `domain/qrCode.ts`, `presentation/QrCodeArt.tsx`, `QrPlayBadge.tsx`, `QrShareModal.tsx`, `usePlayUrl.ts` |

## 3. 공개 계약

| 축 | 주요 export | 용도 |
| --- | --- | --- |
| DNA 코덱 | `encodeEcosystemDNA`, `decodeEcosystemDNA`, `isValidEcosystemDNA`, `generateShortCode` | 공개 데이터 계약 |
| 로컬 저장 | `saveEcosystemLocally`, `loadEcosystemLocally`, `clearEcosystemLocally`, `getDefaultSaveStorage`, `LOCAL_SAVE_KEY`, `LocalSaveSnapshot`, `SaveStorage` | 저장소는 `SaveStorage` 포트로 주입해 테스트 가능하다 |
| QR | `buildQrMatrix`, `qrMatrixToSvgPath`, `qrViewBoxSize`, `resolvePlayUrl`, `PUBLIC_PLAY_URL`, `QR_QUIET_ZONE`, `QrMatrix` | 순수 도메인. 브라우저 API에 의존하지 않는다 |
| UI | `HiveShareModal`, `QrShareModal`, `QrCodeArt`, `QrPlayBadge`, `usePlayUrl` | 공유·방문 화면 |

## 4. 규칙과 불변 조건

- **`decodeEcosystemDNA`는 신뢰할 수 없는 입력을 반드시 검증한다.** 손상된 값이 시뮬레이션으로 흘러들지 않는다.
- **신·구 왕복이 성립한다.** v1.0.0 페이로드의 누락된 `generation`을 안전하게 채워 로드한다.
- **단축 코드는 `ECO-XXXX-XX` 8자 형식이다.**
- **저장은 압축된 형태로 보관된다.** 읽을 수 있는 JSON 그대로 두지 않는다.
- **자동 저장은 게임을 망가뜨리지 않는다.** 저장소가 없거나(프라이빗 모드) 예외를 던져도 조용히 실패한다.
- **손상본과 미지의 저장 버전은 폐기한다.** 로드 실패로 고착되지 않는다.
- **딥링크가 자동 저장본보다 우선한다.**
- **QR의 재생 주소는 무대에서 안전하다.** `localhost`·`file:`·주소 없음이면 공개 주소로 폴백하고, 실제 공개 주소는 쿼리스트링만 제거해 유지하며, 현재 언어를 넘긴다.

## 5. 의존 방향

- 의존하는 곳: `shared/kernel`(스냅샷 타입), `i18n`(문구·언어 전달), LZString(격리된 `infrastructure`).
- 이 컨텍스트에 의존하는 곳: `app`.

## 6. 검증

| 테스트 파일 | 지키는 성질 |
| --- | --- |
| `src/test/dnaCodec.test.ts` | URI-safe 인코딩, 왕복 동일성, 손상 입력 거부, v1.0 하위 호환, 단축 코드 형식 |
| `src/test/localSave.test.ts` | 퀘스트 포함 왕복, 압축 저장, 미저장 시 null, 손상·미지 버전·디코드 실패 폐기, 삭제, 저장소 부재·예외 시 조용한 실패, 실엔진 복원 후 정상 시뮬레이션 |
| `src/test/qrCode.test.ts` | 재생 주소 폴백 4종, 콰이어트 존 포함 정방 행렬, 파인더 패턴 3개, SVG 경로 오프셋 |

## 7. 변경 시 주의

- **DNA 형식을 바꿀 때는 버전·마이그레이션·신구 왕복 테스트·손상 입력 테스트가 필수다.** 이것은 공개 데이터 계약이며, 이미 배포된 링크를 깨뜨릴 수 있다.
- 리더보드를 실데이터로 바꿀 때 FR-HIVE-03의 목업 단서와 `FEATURES.md` G-01을 함께 갱신한다.
- `PUBLIC_PLAY_URL`은 무대에서 관객이 실제로 여는 주소다. 배포 주소가 바뀌면 이 상수와 FR-HIVE-05를 함께 고친다.
- QR 주소 계산을 `presentation`으로 옮기지 않는다. 순수 도메인이라 테스트가 가능한 것이 이 기능의 안전장치다.
