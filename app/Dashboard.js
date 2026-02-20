'use client';
import { useState } from 'react';
import { Card, Button, Tag, Loading, EmptyState } from './ui';
import { useAIAnalysis } from './useAIAnalysis';
import { analyzeMemosLocal } from '../lib/ai-analysis';
import {
  TIME_LABELS, MOOD_LABELS, DAY_NAMES,
  ANALYSIS_TYPES, INSIGHT_COLORS, PRIORITY_COLORS,
} from '../lib/constants';

export default function Dashboard({ memos }) {
  const { analysis, loading: aiLoading, error: aiError, analyze, clearAnalysis } = useAIAnalysis();
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('custom');

  const localStats = analyzeMemosLocal(memos);

  if (!localStats) {
    return <EmptyState icon="📊" message="메모를 기록하면 대시보드가 채워집니다" />;
  }

  const maxGenre = Math.max(...Object.values(localStats.genreCounts), 1);
  const maxTime = Math.max(...Object.values(localStats.timeCounts), 1);

  async function handleAIAnalysis() {
    let filtered = memos;
    const now = new Date();
    if (selectedAnalysisType === 'weekly') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      filtered = memos.filter(m => m.visit_date >= weekAgo);
    } else if (selectedAnalysisType === 'monthly') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      filtered = memos.filter(m => m.visit_date >= monthAgo);
    }
    if (filtered.length === 0) {
      alert('해당 기간에 메모가 없습니다.');
      return;
    }
    await analyze(filtered, selectedAnalysisType);
  }

  return (
    <div>
      <h2 style={{
        fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-serif)', marginBottom: '20px',
      }}>
        📊 서점 관찰 대시보드
      </h2>

      {/* 요약 카드 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: '총 관찰', value: localStats.totalMemos, icon: '📝' },
          { label: '기록 도서', value: localStats.totalBooks, icon: '📚' },
          { label: '재방문 고객', value: localStats.returningCustomers.length, icon: '🔄' },
          { label: '태그 종류', value: Object.keys(localStats.tagCounts).length, icon: '🏷️' },
        ].map(item => (
          <Card key={item.label}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
              <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0' }}>
                {item.value}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 장르별 판매 */}
      {Object.keys(localStats.genreCounts).length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>📚 장르별 판매</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(localStats.genreCounts).sort((a, b) => b[1] - a[1]).map(([genre, count]) => (
              <div key={genre} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', width: '70px', textAlign: 'right', flexShrink: 0 }}>{genre}</span>
                <div style={{ flex: 1, height: '24px', background: 'var(--color-accent-bg)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: (count / maxGenre * 100) + '%',
                    background: 'linear-gradient(90deg, #a08c6e, #c4b49a)',
                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px',
                  }}>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 시간대 & 요일 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <Card>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🕐 시간대별</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px' }}>
            {Object.entries(localStats.timeCounts).map(([time, count]) => (
              <div key={time} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{count}</span>
                <div style={{
                  width: '32px', height: Math.max((count / maxTime) * 70, 6) + 'px',
                  background: 'linear-gradient(180deg, #a08c6e, #c4b49a)',
                  borderRadius: '4px 4px 2px 2px',
                }} />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{TIME_LABELS[time]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>📅 요일별</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px' }}>
            {localStats.peakWeekday
              .sort((a, b) => DAY_NAMES.indexOf(a.day) - DAY_NAMES.indexOf(b.day))
              .map(function(item) {
                var maxDay = Math.max.apply(null, localStats.peakWeekday.map(function(d) { return d.count; }).concat([1]));
                return (
                  <div key={item.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.count}</span>
                    <div style={{
                      width: '28px', height: Math.max((item.count / maxDay) * 70, 6) + 'px',
                      background: 'linear-gradient(180deg, #a08c6e, #c4b49a)',
                      borderRadius: '4px 4px 2px 2px',
                    }} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.day}</span>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* 재방문 고객 */}
      {localStats.returningCustomers.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>🔄 재방문 고객</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {localStats.returningCustomers.map(function(entry) {
              return (
                <span key={entry[0]} style={{
                  background: 'var(--color-accent-bg)', borderRadius: 'var(--radius-full)',
                  padding: '6px 14px', fontSize: '13px',
                }}>
                  {entry[0]} <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>{entry[1]}회</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}

      {/* 태그 */}
      <Card style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>🏷️ 자주 쓰는 태그</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(localStats.tagCounts).sort((a, b) => b[1] - a[1]).map(function(entry) {
            return (
              <span key={entry[0]} style={{
                background: 'var(--color-accent-bg)', borderRadius: 'var(--radius-full)',
                padding: '6px 14px', fontSize: '13px',
              }}>
                #{entry[0]} <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>{entry[1]}</span>
              </span>
            );
          })}
        </div>
      </Card>

      {/* ── AI 분석 섹션 ── */}
      <div style={{ borderTop: '2px solid var(--color-border-strong)', paddingTop: '24px', marginTop: '8px' }}>
        <h2 style={{
          fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '16px',
        }}>
          🤖 AI 분석
        </h2>

        <Card style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            축적된 관찰 메모를 AI가 분석하여 고객 패턴, 판매 트렌드, 운영 인사이트를 제공합니다.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {ANALYSIS_TYPES.map(function(t) {
              return (
                <Tag
                  key={t.value}
                  label={t.label + ' (' + t.description + ')'}
                  active={selectedAnalysisType === t.value}
                  onClick={function() { setSelectedAnalysisType(t.value); }}
                  size="md"
                />
              );
            })}
          </div>
          <Button onClick={handleAIAnalysis} loading={aiLoading} disabled={aiLoading || memos.length === 0}>
            {aiLoading ? 'AI가 분석 중...' : '🤖 분석 실행'}
          </Button>
          {aiError && (
            <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '8px' }}>
              {'⚠️ ' + aiError}
            </p>
          )}
        </Card>

        {aiLoading && <Loading text="AI가 메모를 분석하고 있습니다..." />}

        {analysis && !aiLoading && (
          <div className="animate-fade-in">
            {/* 요약 */}
            <Card style={{ marginBottom: '16px', background: 'rgba(255,252,245,0.9)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>📋 분석 요약</h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7 }}>{analysis.summary}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                {analysis.memo_count}건의 메모 기반 분석
              </p>
            </Card>

            {/* 인사이트 */}
            {analysis.insights && analysis.insights.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>💡 인사이트</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.insights.map(function(insight, i) {
                    var colors = INSIGHT_COLORS[insight.category] || INSIGHT_COLORS['운영제안'];
                    return (
                      <Card key={i} style={{ borderLeft: '4px solid ' + colors.border, background: colors.bg }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <Tag label={insight.category} size="sm" />
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {'신뢰도: ' + insight.confidence}
                          </span>
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: colors.text, marginBottom: '4px' }}>
                          {insight.title}
                        </p>
                        <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{insight.description}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 추천사항 */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>✅ 실행 제안</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.recommendations.map(function(rec, i) {
                    var colors = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS['중'];
                    return (
                      <Card key={i}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: colors.text, background: colors.bg,
                            padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          }}>
                            {'우선순위: ' + rec.priority}
                          </span>
                          {rec.timing && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {'⏰ ' + rec.timing}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{rec.action}</p>
                        {rec.expected_effect && (
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {'→ ' + rec.expected_effect}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fun fact */}
            {analysis.fun_fact && (
              <Card style={{ background: 'rgba(255,248,230,0.9)', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</p>
                <p style={{ fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic' }}>{analysis.fun_fact}</p>
              </Card>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button variant="secondary" onClick={clearAnalysis}>분석 결과 닫기</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
