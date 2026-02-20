'use client';
import { useState, useCallback } from 'react';

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (memos, analysisType = 'custom') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memos, analysisType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI 분석 실패');
      }
      const data = await res.json();
      setAnalysis(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return { analysis, loading, error, analyze, clearAnalysis };
}
