import { analyzeMemosWithAI } from '../../../lib/ai-analysis';
import { supabase, getUser } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { memos, analysisType = 'custom' } = body;

    if (!memos || memos.length === 0) {
      return Response.json(
        { error: '분석할 메모 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    if (memos.length > 100) {
      return Response.json(
        { error: '한 번에 최대 100건까지 분석 가능합니다.' },
        { status: 400 }
      );
    }

    const result = await analyzeMemosWithAI(memos, analysisType);

    return Response.json(result);
  } catch (error) {
    console.error('AI 분석 오류:', error);
    return Response.json(
      { error: error.message || 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
