-- ============================================
-- 서점 관찰 일지 - Supabase 데이터베이스 스키마
-- ============================================
-- Supabase 대시보드 > SQL Editor에서 실행하세요.

-- 1. 관찰 메모 테이블 (핵심)
CREATE TABLE memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 방문 정보
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_time TEXT NOT NULL DEFAULT 'afternoon' 
    CHECK (visit_time IN ('morning', 'lunch', 'afternoon', 'evening')),
  
  -- 날씨 (자동 + 수동)
  weather TEXT DEFAULT 'sunny'
    CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'foggy', 'hot', 'cold', 'clear')),
  weather_detail TEXT DEFAULT '',
  weather_temp NUMERIC(4,1),          -- 실제 기온 (API)
  weather_humidity INTEGER,            -- 습도 (API)
  weather_auto_fetched BOOLEAN DEFAULT false,  -- API 자동 조회 여부
  
  -- 고객 관찰 (개인정보 아님, 주관적 인상만)
  customer_impression TEXT NOT NULL DEFAULT '',   -- "40대로 보이는 여성"
  customer_tag TEXT DEFAULT '',                    -- "토지 아주머니" (별명)
  
  -- 관찰 내용
  browsing_note TEXT DEFAULT '',       -- 둘러본 코너, 행동
  owner_note TEXT DEFAULT '',          -- 주인의 자유 메모
  
  -- 가게 분위기
  mood TEXT DEFAULT 'normal'
    CHECK (mood IN ('quiet', 'normal', 'busy', 'crowded')),
  
  -- 태그
  tags TEXT[] DEFAULT '{}',
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 구매 도서 테이블
CREATE TABLE purchased_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memo_id UUID REFERENCES memos(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  genre TEXT DEFAULT '기타',
  price INTEGER,                      -- 가격 (원, 선택사항)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI 분석 결과 저장 테이블
CREATE TABLE ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  analysis_type TEXT NOT NULL,         -- 'weekly', 'monthly', 'custom'
  period_start DATE,
  period_end DATE,
  
  -- 분석 결과
  summary TEXT,                        -- 요약
  insights JSONB DEFAULT '[]',         -- 인사이트 배열
  recommendations JSONB DEFAULT '[]',  -- 추천사항 배열
  raw_response TEXT,                   -- AI 원본 응답
  
  memo_count INTEGER DEFAULT 0,        -- 분석에 사용된 메모 수
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 도서 마스터 (자동완성용, 선택사항)
CREATE TABLE books_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  genre TEXT DEFAULT '기타',
  isbn TEXT,
  
  -- 서점에서의 통계
  times_purchased INTEGER DEFAULT 1,
  last_purchased_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(title, author)
);

-- ── 인덱스 ──
CREATE INDEX idx_memos_user_date ON memos(user_id, visit_date DESC);
CREATE INDEX idx_memos_tags ON memos USING GIN(tags);
CREATE INDEX idx_memos_customer_tag ON memos(customer_tag);
CREATE INDEX idx_purchased_books_memo ON purchased_books(memo_id);
CREATE INDEX idx_books_master_title ON books_master(title);
CREATE INDEX idx_ai_analyses_user ON ai_analyses(user_id, created_at DESC);

-- ── updated_at 자동 갱신 트리거 ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (RLS) ──
-- 로그인한 사용자만 자신의 데이터에 접근 가능

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE books_master ENABLE ROW LEVEL SECURITY;

-- memos 정책
CREATE POLICY "Users can view own memos"
  ON memos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memos"
  ON memos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos"
  ON memos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos"
  ON memos FOR DELETE
  USING (auth.uid() = user_id);

-- purchased_books 정책 (memo의 소유자만)
CREATE POLICY "Users can view own books"
  ON purchased_books FOR SELECT
  USING (memo_id IN (SELECT id FROM memos WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own books"
  ON purchased_books FOR INSERT
  WITH CHECK (memo_id IN (SELECT id FROM memos WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own books"
  ON purchased_books FOR UPDATE
  USING (memo_id IN (SELECT id FROM memos WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own books"
  ON purchased_books FOR DELETE
  USING (memo_id IN (SELECT id FROM memos WHERE user_id = auth.uid()));

-- ai_analyses 정책
CREATE POLICY "Users can view own analyses"
  ON ai_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON ai_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- books_master 정책 (모든 인증 사용자 읽기, 쓰기 가능)
CREATE POLICY "Authenticated users can view books"
  ON books_master FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert books"
  ON books_master FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update books"
  ON books_master FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── 도서 마스터 자동 업데이트 함수 ──
-- 새 도서 구매 기록 시 마스터 테이블 자동 갱신
CREATE OR REPLACE FUNCTION upsert_book_master()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO books_master (title, author, genre, times_purchased, last_purchased_at)
  VALUES (NEW.title, NEW.author, NEW.genre, 1, NOW())
  ON CONFLICT (title, author)
  DO UPDATE SET
    times_purchased = books_master.times_purchased + 1,
    last_purchased_at = NOW(),
    genre = COALESCE(NULLIF(NEW.genre, '기타'), books_master.genre);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_upsert_book_master
  AFTER INSERT ON purchased_books
  FOR EACH ROW
  EXECUTE FUNCTION upsert_book_master();

-- ── 완료 메시지 ──
DO $$
BEGIN
  RAISE NOTICE '서점 관찰 일지 데이터베이스 스키마 설치 완료!';
END;
$$;
