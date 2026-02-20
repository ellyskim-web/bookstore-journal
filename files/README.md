# 📖 서점 관찰 일지

서점에 방문하는 고객에 대한 주관적 관찰 메모를 기록하고 관리하는 폐쇄형 웹사이트입니다.

> 개인정보를 수집하지 않습니다. 서점 주인의 주관적인 인상과 관찰만 기록합니다.

## 주요 기능

### ✅ 기본 기능
- **관찰 메모 CRUD**: 날짜, 시간대, 날씨, 고객 인상, 구매 도서, 자유 메모 기록
- **고객 별명 시스템**: "토지 아주머니" 같은 별명으로 재방문 고객 추적
- **태그 & 검색**: 자유 태그, 전문 검색, 필터링
- **반응형 디자인**: PC + 모바일 동시 지원

### 🌤️ 날씨 자동 입력
- OpenWeatherMap API 연동
- 새 메모 작성 시 서점 위치의 **현재 날씨 자동 입력**
- 기온, 습도, 날씨 상태 자동 기록
- 수동 수정도 가능

### 🤖 AI 분석 (Claude API)
- 주간/월간/전체 기간 분석
- **고객 패턴** 발견 (시간대별, 날씨별 방문 패턴)
- **판매 트렌드** 분석 (인기 장르, 저자 트렌드)
- **실행 제안** 제공 (구체적 액션 + 기대효과 + 우선순위)
- 재방문 고객 인사이트

### 🔒 보안
- Supabase Auth 기반 로그인 (이메일/비밀번호)
- Row Level Security: 본인 데이터만 접근 가능
- 초대 기반 가입 (공개 가입 제한 설정 가능)

---

## 🚀 설치 및 배포 가이드

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 가입 후 **New Project** 생성
2. 프로젝트명: `bookstore-journal` (자유)
3. 비밀번호 설정 (DB 비밀번호, 안전하게 보관)
4. Region: `Northeast Asia (Seoul)` 선택

### 2단계: 데이터베이스 스키마 설치

1. Supabase 대시보드 → **SQL Editor** 클릭
2. `supabase-schema.sql` 파일의 내용을 전체 복사 → 붙여넣기
3. **Run** 클릭
4. "서점 관찰 일지 데이터베이스 스키마 설치 완료!" 메시지 확인

### 3단계: Supabase 인증 설정

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Email** 활성화 확인
3. (선택) **Authentication** → **Settings** → **User Signups** 비활성화
   - 폐쇄형으로 운영하려면 관리자가 직접 사용자 추가
   - 대시보드 → Authentication → Users → **Add User**

### 4단계: API 키 발급

#### Supabase API 키
- Supabase 대시보드 → **Settings** → **API**
- `Project URL` 복사
- `anon public` 키 복사

#### OpenWeatherMap API 키 (날씨 자동 입력)
1. [openweathermap.org](https://openweathermap.org/api) 가입
2. **My API Keys** 에서 키 복사
3. 무료 플랜: 분당 60회, 충분합니다

#### Claude API 키 (AI 분석)
1. [console.anthropic.com](https://console.anthropic.com) 가입
2. **API Keys** 에서 키 생성
3. AI 분석은 선택사항 (키 없어도 기본 통계는 동작)

### 5단계: 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 값 채우기:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

OPENWEATHER_API_KEY=abc123...

# 서점 위치 (시흥시 기본값, 실제 서점 위치로 변경)
NEXT_PUBLIC_STORE_LAT=37.3800
NEXT_PUBLIC_STORE_LON=126.8035

ANTHROPIC_API_KEY=sk-ant-...
```

### 6단계: 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속 → 회원가입 → 메모 작성 시작!

### 7단계: Vercel 배포

1. GitHub에 코드 push
2. [vercel.com](https://vercel.com)에서 **Import Project**
3. 환경변수 설정 (5단계와 동일한 값 입력)
4. **Deploy** 클릭
5. 커스텀 도메인 연결 (선택)

---

## 📁 프로젝트 구조

```
bookstore-app/
├── app/
│   ├── layout.js              # 루트 레이아웃
│   ├── page.js                # 메인 페이지 (앱 전체 오케스트레이션)
│   └── api/
│       ├── weather/route.js   # 날씨 API 프록시
│       └── ai-analysis/route.js # AI 분석 API
├── components/
│   ├── ui.js                  # 공통 UI 컴포넌트
│   ├── LoginPage.js           # 로그인/회원가입
│   ├── MemoList.js            # 메모 목록 (검색, 태그 필터)
│   ├── MemoDetail.js          # 메모 상세 보기
│   ├── MemoForm.js            # 메모 작성/수정 (날씨 자동 입력)
│   ├── Dashboard.js           # 대시보드 + AI 분석
│   ├── useWeather.js          # 날씨 API 훅
│   └── useAIAnalysis.js       # AI 분석 API 훅
├── lib/
│   ├── supabase.js            # Supabase 클라이언트 + CRUD 함수
│   ├── weather.js             # 날씨 API 유틸리티
│   ├── ai-analysis.js         # AI 분석 유틸리티
│   └── constants.js           # 상수 정의
├── styles/
│   └── globals.css            # 전역 스타일
├── supabase-schema.sql        # 데이터베이스 스키마 (Supabase에서 실행)
├── .env.example               # 환경변수 템플릿
├── package.json
└── README.md
```

---

## 💰 예상 비용

| 서비스 | 무료 범위 | 예상 월 비용 |
|--------|-----------|-------------|
| Supabase | 500MB DB, 50K 인증 | **무료** |
| Vercel | 100GB 트래픽 | **무료** |
| OpenWeatherMap | 분당 60회 | **무료** |
| Claude API | 사용량 기반 | **~$1-5** (월 50회 분석 기준) |
| **합계** | | **무료 ~ 월 $5** |

---

## 🔧 향후 확장 가능

- [ ] PWA (Progressive Web App) 적용 → 홈 화면 추가, 오프라인 지원
- [ ] 손글씨 메모 사진 촬영 → AI OCR 텍스트 변환
- [ ] 도서 ISBN 바코드 스캔 → 도서 정보 자동 입력
- [ ] 월간 리포트 PDF 자동 생성
- [ ] 카카오톡 알림 연동 (재방문 고객 알림 등)
