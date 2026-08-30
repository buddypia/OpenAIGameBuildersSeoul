# 🌿 에코 테라리움 (Eco Terrarium: Micro Evolution) - 생태계 지휘자

> **OpenAI Game Builders Seoul 해커톤 출품작**  
> *"빛, 수분, 온도를 조절하여 작은 유리병 속 가상 생물들의 진화와 균형을 지켜내는 힐링 샌드박스 시뮬레이션"*

---

## 🌟 프로젝트 하이라이트 & 심사위원 어필 포인트

1. **Playability (플레이 완성도 & 순수한 재미)**
   - **4단계 트로픽 먹이사슬**: 생산자(식물) 🌿 → 1차 소비자(초식) 🫧 → 포식자(육식) 👁️ → 분해자(균류) 🍄 의 완벽한 유기적 물질 순환.
   - **직관적인 신의 손 인터랙션**: 일조량, 수분, 온도, 영양소 슬라이더 및 유리병 노크(충격파), 사료/돌연변이 촉매제 투하.
   - **개체 현미경 인스펙터**: 생물을 클릭하여 10차원 유전자 수치 분석, 이름 변경, 족보 열람.

2. **Originality (독창성 & 서정적 감성)**
   - **김동규 대표(고양이와 스프, 하이디어)** 타깃: 서정적이고 몽환적인 파스텔 톤 유리병 그래픽, 말랑거리는 젤리 유기체 애니메이션.
   - **김대훤 대표(민트로켓 설립, 데이브 더 다이버)** 타깃: 깊이 있는 생태계 역학 및 16종 생물 진화 도감, 퀘스트 탐험.

3. **Codex Collaboration (OpenAI AI 네이티브 협업)**
   - **확장 로트카-볼테라(Lotka-Volterra) 4연립 미분방정식**: 4차 룬게-쿠타(RK4) 수치해석 및 환경 완충 계수 수식 모델링.
   - **Web Audio API 절차적 사운드 신디사이저**: 외부 음원 파일 의존 없이 순수 코드로 실시간 펜타토닉 앰비언트 BGM 및 바이오 리듬 챠임 사운드 합성.
   - **Boids 무리 행동 & 유전 알고리즘**: 가우시안 노이즈 및 환경 압력 지향성 돌연변이 벡터 연산.

4. **Release Potential (Com2uS Hive 글로벌 확장성)**
   - **생태계 DNA 코드 직렬화**: lz-string 압축을 통한 `ECO-XXXX-XX` 단축 코드(`ECO-XXXX-XX`) 및 웹 딥링크 URL 원클릭 공유.
   - **가상 Hive 방문 모드**: 타 유저의 테라리움 방문, 꽃가루 선물 및 희귀 생물 포자 채집.
   - **글로벌 리더보드**: 최장 생존 시간, 도감 해금율, 바이오 하모니 지수 랭킹 시스템.

5. **Presentation (심사위원 전용 퀵 투어)**
   - **1분 퀵 쇼케이스 버튼**: 즉시 번영 모드, 돌연변이 가속 모드, 빙하기 위기 탈출 모드, 오케스트라 사운드 청음 원클릭 지원.
   - **Codex AI 개발기 모달**: 4대 심사 질문 완벽 대응 인게임 다이어그램 탑재.

---

## 🚀 빠른 시작 (Getting Started)

### 작업 완료 기준 (Definition of Done)

모든 변경은 요구사항과 PRD를 확인한 뒤 작업별 인수 기준과 검증 증거를 정합니다. 작업 시작·완료의 필수 절차는 [완료의 정의 운영 가이드](docs/DEFINITION_OF_DONE.md), 경량 DDD의 경계와 의존 방향은 [아키텍처](docs/ARCHITECTURE.md), 새 기능의 구현 절차는 [기능 개발 프로토콜](docs/FEATURE_DEVELOPMENT.md), 복제해서 쓰는 작업 기록은 [작업 카드 템플릿](docs/TASK_TEMPLATE.md)을 참조하세요.

### 1. 개발 서버 실행
```bash
cd eco-terrarium
pnpm install
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속

### 2. 자동화 단위 테스트 실행 (Vitest)
```bash
pnpm test
```

### 3. 프로덕션 빌드
```bash
pnpm build
pnpm preview
```

---

## 📂 프로젝트 구조

```
eco-terrarium/
├── REQUIREMENTS.md           # 상세 요구사항 명세서
├── PRD.md                    # 제품 기획서
├── PLAN.md                   # 개발 실행 계획서 및 진척도 체크리스트
├── AGENTS.md                 # 모든 후속 작업에 적용되는 DoD 운영 규칙
├── docs/
│   ├── DEFINITION_OF_DONE.md # DoD 게이트·작업 유형별 검증 기준
│   ├── TASK_TEMPLATE.md      # 작업 계획·DoD·검증 기록 양식
│   ├── tasks/                # 작업별 카드(범위·DoD·검증 증거) 기록
│   ├── ARCHITECTURE.md       # 경량 DDD의 경계·공개 API·의존 방향
│   └── FEATURE_DEVELOPMENT.md# 요구사항 기반 기능 개발 절차
├── index.html                # 엔트리 HTML
├── package.json              # 패키지 및 의존성 설정
├── vite.config.ts            # Vite 빌드 설정
├── tailwind.config.js        # 감성 글래스모피즘 테마 설정
├── src/
│   ├── app/                  # React 합성 루트(기능의 공개 API만 사용)
│   ├── shared/kernel/        # 여러 컨텍스트가 공유하는 안정적인 어휘
│   ├── features/             # 경량 DDD의 경계 지어진 컨텍스트
│   │   ├── ecosystem/        # 환경·생태계·유전·Canvas 표시
│   │   ├── species/          # 도감·개체 관찰
│   │   ├── progression/      # 퀘스트·진행
│   │   ├── customization/    # 유리병·바닥재·배경
│   │   ├── photo/            # 포토 모드
│   │   ├── hive/             # DNA 공유·방문
│   │   ├── audio/            # Web Audio 인프라
│   │   ├── i18n/             # 한국어·영어·일본어 카탈로그와 언어 전환
│   │   ├── showcase/         # 심사위원 퀵 투어
│   │   └── onboarding/       # 플레이 가이드
│   ├── test/                       # Vitest 자동화 단위 테스트
│   └── main.tsx                    # React 마운트 엔트리
```
