'use client';
import { useState } from 'react';
import { Card, Tag, Button } from './ui';
import {
  TIME_LABELS, MOOD_LABELS, WEATHER_EMOJIS, MOOD_EMOJIS,
} from '../lib/constants';

export default function MemoDetail({ memo, onBack, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(memo.id);
    } catch (err) {
      alert('삭제 오류: ' + err.message);
      setDeleting(false);
    }
  }

  const books = memo.purchased_books || [];

  return (
    <div>
      {/* 상단 버튼 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px',
      }}>
        <Button variant="ghost" onClick={onBack}>← 목록으로</Button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={onEdit}>수정</Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>삭제</Button>
        </div>
      </div>

      {/* 삭제 확인 */}
      {showDeleteConfirm && (
        <Card style={{
          marginBottom: '16px',
          background: 'rgba(255,240,240,0.9)',
          borderColor: 'rgba(200,80,80,0.2)',
        }}>
          <p style={{ fontSize: '14px', color: '#8a4040', marginBottom: '12px' }}>
            이 메모를 정말 삭제하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>삭제</Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>취소</Button>
          </div>
        </Card>
      )}

      <Card>
        {/* 제목 영역 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px', marginBottom: '24px',
        }}>
          <div>
            <h2 style={{
              fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-serif)', marginBottom: '4px',
            }}>
              {memo.customer_tag || memo.customer_impression}
            </h2>
            {memo.customer_tag && (
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                {memo.customer_impression}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {memo.visit_date}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {TIME_LABELS[memo.visit_time]}
            </p>
          </div>
        </div>

        {/* 날씨 & 분위기 칩 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          <InfoChip
            emoji={WEATHER_EMOJIS[memo.weather]}
            text={memo.weather_detail || memo.weather}
            sub={memo.weather_temp ? `${memo.weather_temp}°C` : null}
          />
          <InfoChip
            emoji={MOOD_EMOJIS[memo.mood]}
            text={MOOD_LABELS[memo.mood]}
          />
          {memo.weather_auto_fetched && (
            <span style={{
              fontSize: '11px', color: 'var(--color-success)',
              background: 'rgba(45,138,78,0.08)',
              padding: '6px 12px', borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center',
            }}>
              ✓ 날씨 자동 기록
            </span>
          )}
        </div>

        {/* 관찰 메모 */}
        {memo.browsing_note && (
          <Section title="👀 관찰 메모" content={memo.browsing_note} />
        )}

        {/* 구매 도서 */}
        {books.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px', fontWeight: 600,
              color: 'var(--color-text-secondary)', marginBottom: '10px',
            }}>📚 구매 도서</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {books.map((b, i) => (
                <div key={i} style={{
                  background: 'var(--color-accent-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {b.title}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {b.author}{b.price ? ` · ${Number(b.price).toLocaleString()}원` : ''}
                    </p>
                  </div>
                  <Tag label={b.genre} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주인 메모 */}
        {memo.owner_note && (
          <Section title="✍️ 서점 주인의 메모" content={memo.owner_note} />
        )}

        {/* 태그 */}
        {(memo.tags || []).length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px',
            marginTop: '16px', paddingTop: '16px',
            borderTop: '1px solid rgba(200,185,160,0.2)',
          }}>
            {memo.tags.map(t => <Tag key={t} label={`#${t}`} size="md" />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: '14px', fontWeight: 600,
        color: 'var(--color-text-secondary)', marginBottom: '8px',
      }}>{title}</h3>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
        {content}
      </p>
    </div>
  );
}

function InfoChip({ emoji, text, sub }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: 'var(--color-accent-bg)',
      padding: '6px 14px', borderRadius: 'var(--radius-full)',
      fontSize: '13px', color: 'var(--color-text-secondary)',
    }}>
      <span style={{ fontSize: '16px' }}>{emoji}</span>
      {text}
      {sub && <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>({sub})</span>}
    </span>
  );
}
