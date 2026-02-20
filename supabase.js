import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ── 인증 헬퍼 ──
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── 메모 CRUD ──
export async function getMemos({ search, tag, dateFrom, dateTo, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('memos')
    .select(`
      *,
      purchased_books (*)
    `)
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `customer_impression.ilike.%${search}%,customer_tag.ilike.%${search}%,owner_note.ilike.%${search}%,browsing_note.ilike.%${search}%`
    );
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }
  if (dateFrom) {
    query = query.gte('visit_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('visit_date', dateTo);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return data;
}

export async function getMemoById(id) {
  const { data, error } = await supabase
    .from('memos')
    .select(`
      *,
      purchased_books (*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createMemo(memoData, books = []) {
  const user = await getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 메모 저장
  const { data: memo, error: memoError } = await supabase
    .from('memos')
    .insert({
      ...memoData,
      user_id: user.id,
    })
    .select()
    .single();
  if (memoError) throw memoError;

  // 도서 저장
  if (books.length > 0) {
    const booksWithMemoId = books
      .filter(b => b.title.trim())
      .map(b => ({
        memo_id: memo.id,
        title: b.title,
        author: b.author || '',
        genre: b.genre || '기타',
        price: b.price || null,
      }));

    if (booksWithMemoId.length > 0) {
      const { error: booksError } = await supabase
        .from('purchased_books')
        .insert(booksWithMemoId);
      if (booksError) throw booksError;
    }
  }

  return getMemoById(memo.id);
}

export async function updateMemo(id, memoData, books = []) {
  // 메모 업데이트
  const { error: memoError } = await supabase
    .from('memos')
    .update(memoData)
    .eq('id', id);
  if (memoError) throw memoError;

  // 기존 도서 삭제 후 재삽입
  const { error: deleteError } = await supabase
    .from('purchased_books')
    .delete()
    .eq('memo_id', id);
  if (deleteError) throw deleteError;

  if (books.length > 0) {
    const booksWithMemoId = books
      .filter(b => b.title.trim())
      .map(b => ({
        memo_id: id,
        title: b.title,
        author: b.author || '',
        genre: b.genre || '기타',
        price: b.price || null,
      }));

    if (booksWithMemoId.length > 0) {
      const { error: booksError } = await supabase
        .from('purchased_books')
        .insert(booksWithMemoId);
      if (booksError) throw booksError;
    }
  }

  return getMemoById(id);
}

export async function deleteMemo(id) {
  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── 통계 헬퍼 ──
export async function getStats() {
  const user = await getUser();
  if (!user) return null;

  const { data: memos } = await supabase
    .from('memos')
    .select('id, visit_date, visit_time, weather, mood, tags, customer_tag')
    .eq('user_id', user.id);

  const { data: books } = await supabase
    .from('purchased_books')
    .select('title, author, genre, memo_id')
    .in('memo_id', (memos || []).map(m => m.id));

  return { memos: memos || [], books: books || [] };
}

// ── 도서 자동완성 ──
export async function searchBooks(query) {
  if (!query || query.length < 1) return [];

  const { data, error } = await supabase
    .from('books_master')
    .select('title, author, genre')
    .ilike('title', `%${query}%`)
    .order('times_purchased', { ascending: false })
    .limit(10);

  if (error) return [];
  return data;
}

// ── 모든 태그 조회 ──
export async function getAllTags() {
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('memos')
    .select('tags')
    .eq('user_id', user.id);

  if (!data) return [];
  
  const tagCounts = {};
  data.forEach(m => {
    (m.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

// ── AI 분석 결과 저장/조회 ──
export async function saveAnalysis(analysisData) {
  const user = await getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('ai_analyses')
    .insert({
      ...analysisData,
      user_id: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRecentAnalyses(limit = 10) {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
