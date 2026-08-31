# The Rule Machine

> **Go limitless — Surprise Me.** 30초마다 서로 다른 룰 카드 두 장이 충돌하는, 0-asset Canvas 플랫폼 생존 게임.

## 실행

```bash
npm install
npm run dev
```

별도 로그인·API 키·백엔드·다운로드는 없습니다. 브라우저에서 `기계 가동`을 누르면 시작합니다.

## 한 줄 피치

**플레이어가 규칙을 배우는 동안, 게임은 매 30초마다 규칙 자체를 바꿉니다.**

- `중력 반전 × 적 = 발판`
- `대시는 다리 × 벽은 문`
- `별이 끌려온다 × 혜성 소나기`

6개 룰의 2장 조합으로 총 **15가지 충돌**이 생기며, 각 룰은 실제 Canvas 물리·충돌·수집 경로를 바꿉니다. `지금 뒤집기`는 현장 데모를 위한 즉시 전환 버튼이고, 실제 자동 주기는 정확히 30초입니다.

## 조작

| 동작 | 키보드 | 터치 |
| --- | --- | --- |
| 이동 | `←` `→` 또는 `A` `D` | 하단 화살표 |
| 점프 | `↑` 또는 `W` | JUMP |
| 대시 | `Space` 또는 `Shift` | DASH |

별 12개를 모으면 기계를 탈출합니다. 처음 재생한 소리는 사용자 클릭 이후 Web Audio API로 생성됩니다.

## 디자인 리소스 검증

외부 이미지, 스프라이트, 폰트, 음원은 의도적으로 포함하지 않았습니다. 모든 장면은 Canvas primitive와 CSS, 소리는 Web Audio oscillator로 생성됩니다.

```bash
npm run test
npm run verify:assets
npm run build
```

`verify:assets`는 `src/`, `public/` 아래의 이미지·스프라이트·폰트·음원 확장자, 외부 URL, 이미지/파일오디오 API 사용을 차단합니다.
