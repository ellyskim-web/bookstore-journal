// ── AI 분석 유틸리티 ──
// Claude API를 사용하여 서점 관찰 메모를 분석하고 인사이트 제공

const ANALYSIS_SYSTEM_PROMPT = `당신은 독립서점 경영 컨설턴트입니다. 
서점 주인이 기록한 고객 관찰 메모를 분석하여 실용적인 경영 인사이트를 제공합니다.

분석 시 다음을 고려하세요:
- 고객 방문 패턴 (시간대, 날씨, 계절별)
- 도서 판매 트렌드 (장르, 저자, 시기별)
- 고객 유형 분류 및 재방문 패턴
- 서점 분위기와 판매의 상관관계
- 계절/날씨와 고객 행동의 관계
- 실행 가능한 구체적 제안

응답은 반드시 아래 JSON 형식으로 작성하세요:
{
  "summary": "전체 요약 (2-3문장)",
  "insights": [
    {
      "category": "카테고리 (고객패턴/판매트렌드/계절성/운영제안 중 택1)",
      "title": "인사이트 제목",
      "description": "상세 설명",
      "confidence": "높음/중간/낮음"
    }
  ],
  "recommendations": [
    {
      "priority": "상/중/하",
      "action": "구체적인 실행 방안",
      "expected_effect": "기대 효과",
      "timing": "실행 시기"
    }
  ],
  "fun_fact": "데이터에서 발견한 흥미로운 사실 1개"
}`;

function buildAnalysisPrompt(memos, analysisType) {
  const memoTexts = memos.map((m, i) => {
    const books = (m.purchased_books || [])
      .map(b => `"${b.title}" (${b.author}, ${b.genre})`)
      .join(', ');
    
    return `[메모 ${i + 1}] ${m.visit_date} ${m.visit_time}
날씨: ${m.weather_detail || m.weather} ${m.weather_temp ? `(${m.weather_temp}°C)` : ''}
분위기: ${m.mood}
고객: ${m.customer_impression} ${m.customer_tag ? `(별명: ${m.customer_tag})` : ''}
관찰: ${m.browsing_note}
구매도서: ${books || '없음'}
주인메모: ${m.owner_note}
태그: ${(m.tags || []).map(t => '#' + t).join(' ')}`;
  }).join('\n\n---\n\n');

  const typeInstructions = {
    weekly: '최근 1주일간의 메모를 분석해주세요. 이번 주의 주요 트렌드와 다음 주 준비사항을 중심으로 분석해주세요.',
    monthly: '최근 1개월간의 메모를 분석해주세요. 월간 트렌드, 고객 유형 분류, 장르별 판매 패턴을 중심으로 분석해주세요.',
    custom: '전체 기간의 메모를 분석해주세요. 종합적인 패턴과 장기 전략을 중심으로 분석해주세요.',
  };

  return `${typeInstructions[analysisType] || typeInstructions.custom}

총 ${memos.length}건의 관찰 메모:

${memoTexts}

위 메모들을 분석하여 JSON 형식으로 응답해주세요.`;
}

// ── 서버사이드 AI 분석 호출 ──
export async function analyzeMemosWithAI(memos, analysisType = 'custom') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }

  if (!memos || memos.length === 0) {
    throw new Error('분석할 메모가 없습니다.');
  }

  const userPrompt = buildAnalysisPrompt(memos, analysisType);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI API 오류 (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data.content[0]?.text || '';

  // JSON 파싱 시도
  try {
    // JSON 블록 추출 (마크다운 코드블록 안에 있을 수 있음)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 형식 응답 없음');
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...parsed,
      raw_response: rawText,
      memo_count: memos.length,
    };
  } catch (parseError) {
    // JSON 파싱 실패 시 원본 텍스트 반환
    return {
      summary: rawText.slice(0, 500),
      insights: [],
      recommendations: [],
      raw_response: rawText,
      memo_count: memos.length,
      parse_error: true,
    };
  }
}

// ── 간단한 자체 통계 분석 (AI 없이) ──
export function analyzeMemosLocal(memos) {
  if (!memos || memos.length === 0) return null;

  const stats = {
    totalMemos: memos.length,
    totalBooks: 0,
    genreCounts: {},
    weatherCounts: {},
    timeCounts: { morning: 0, lunch: 0, afternoon: 0, evening: 0 },
    moodCounts: { quiet: 0, normal: 0, busy: 0, crowded: 0 },
    tagCounts: {},
    customerTags: {},
    dailyCounts: {},
    weekdayCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };

  memos.forEach(m => {
    // 시간대
    stats.timeCounts[m.visit_time] = (stats.timeCounts[m.visit_time] || 0) + 1;
    
    // 날씨
    stats.weatherCounts[m.weather] = (stats.weatherCounts[m.weather] || 0) + 1;
    
    // 분위기
    stats.moodCounts[m.mood] = (stats.moodCounts[m.mood] || 0) + 1;
    
    // 태그
    (m.tags || []).forEach(t => {
      stats.tagCounts[t] = (stats.tagCounts[t] || 0) + 1;
    });
    
    // 고객 별명 (재방문 추적)
    if (m.customer_tag) {
      stats.customerTags[m.customer_tag] = (stats.customerTags[m.customer_tag] || 0) + 1;
    }
    
    // 일별 카운트
    stats.dailyCounts[m.visit_date] = (stats.dailyCounts[m.visit_date] || 0) + 1;
    
    // 요일별
    const dow = new Date(m.visit_date).getDay();
    stats.weekdayCounts[dow] += 1;
    
    // 도서
    (m.purchased_books || []).forEach(b => {
      stats.totalBooks += 1;
      stats.genreCounts[b.genre] = (stats.genreCounts[b.genre] || 0) + 1;
    });
  });

  // 재방문 고객 (2회 이상)
  stats.returningCustomers = Object.entries(stats.customerTags)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  // 인기 장르 Top 5
  stats.topGenres = Object.entries(stats.genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 피크 시간대
  stats.peakTime = Object.entries(stats.timeCounts)
    .sort((a, b) => b[1] - a[1])[0];

  // 가장 많은 요일
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  stats.peakWeekday = Object.entries(stats.weekdayCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([day, count]) => ({ day: dayNames[day], count }));

  return stats;
}
