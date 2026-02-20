// ── 앱 전역 상수 ──

export const GENRES = [
  '한국문학', '외국문학', '에세이', '시', '역사', '과학',
  '자기계발', '요리', '여행', '아동', '만화', '경제',
  '철학', '예술', '사회', '종교', '기타'
];

export const WEATHER_OPTIONS = [
  { value: 'sunny', label: '맑음', emoji: '☀️' },
  { value: 'cloudy', label: '흐림', emoji: '☁️' },
  { value: 'rainy', label: '비', emoji: '🌧️' },
  { value: 'snowy', label: '눈', emoji: '❄️' },
  { value: 'windy', label: '바람', emoji: '💨' },
  { value: 'foggy', label: '안개', emoji: '🌫️' },
  { value: 'hot', label: '더움', emoji: '🔥' },
  { value: 'cold', label: '추움', emoji: '🥶' },
  { value: 'clear', label: '쾌청', emoji: '🌙' },
];

export const TIME_OPTIONS = [
  { value: 'morning', label: '오전 (개점~12시)' },
  { value: 'lunch', label: '점심 (12~14시)' },
  { value: 'afternoon', label: '오후 (14~18시)' },
  { value: 'evening', label: '저녁 (18시~마감)' },
];

export const MOOD_OPTIONS = [
  { value: 'quiet', label: '한산', emoji: '🍂' },
  { value: 'normal', label: '보통', emoji: '☕' },
  { value: 'busy', label: '바쁨', emoji: '📚' },
  { value: 'crowded', label: '붐빔', emoji: '🎉' },
];

export const TIME_LABELS = {
  morning: '오전', lunch: '점심', afternoon: '오후', evening: '저녁'
};

export const MOOD_LABELS = {
  quiet: '한산', normal: '보통', busy: '바쁨', crowded: '붐빔'
};

export const WEATHER_LABELS = Object.fromEntries(
  WEATHER_OPTIONS.map(w => [w.value, w.label])
);

export const WEATHER_EMOJIS = Object.fromEntries(
  WEATHER_OPTIONS.map(w => [w.value, w.emoji])
);

export const MOOD_EMOJIS = Object.fromEntries(
  MOOD_OPTIONS.map(m => [m.value, m.emoji])
);

export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// ── 분석 타입 ──
export const ANALYSIS_TYPES = [
  { value: 'weekly', label: '주간 분석', description: '최근 7일 메모 분석' },
  { value: 'monthly', label: '월간 분석', description: '최근 30일 메모 분석' },
  { value: 'custom', label: '전체 분석', description: '모든 메모 종합 분석' },
];

// ── AI 분석 카테고리 색상 ──
export const INSIGHT_COLORS = {
  '고객패턴': { bg: '#FEF3E2', text: '#B45309', border: '#FCD34D' },
  '판매트렌드': { bg: '#EEF2FF', text: '#4338CA', border: '#A5B4FC' },
  '계절성': { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  '운영제안': { bg: '#FFF1F2', text: '#9F1239', border: '#FDA4AF' },
};

export const PRIORITY_COLORS = {
  '상': { bg: '#FEE2E2', text: '#DC2626' },
  '중': { bg: '#FEF3C7', text: '#D97706' },
  '하': { bg: '#DBEAFE', text: '#2563EB' },
};
