'use client';
import { Card, Tag, EmptyState } from './ui';
import {
  TIME_LABELS, MOOD_LABELS, WEATHER_EMOJIS, MOOD_EMOJIS,
} from '../lib/constants';

export default function MemoList({ memos, allTags, searchQuery, setSearchQuery, filterTag, setFilterTag, onSelect }) {
  return (
    <div>
      {/* 검색 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 고객, 도서, 메모 내용 검색..."
          style={{
            width: '100%', padding: '14px 18px',
            borderRadius: '14px',
            border: '1.5px solid var(--color-border-strong)',
            background: 'rgba(255,255,255,0.7)',
            fontSize: '15px', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#a08c6e'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
        />
      </div>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          <Tag label="전체" active={!filterTag} onClick={() => setFilterTag('')} />
          {allTags.map(({ tag, count }) => (
            <Tag
              key={tag}
              label={`#${tag} ${count}`}
              active={filterTag === tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
            />
          ))}
        </div>
      )}

      {/* 메모 카드 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {memos.length === 0 ? (
          <EmptyState
            message={searchQuery || filterTag ? '검색 결과가 없습니다' : '아직 기록된 메모가 없습니다'}
          />
        ) : (
          memos.map(memo => (
            <MemoCard key={memo.id} memo={memo} onClick={() => onSelect(memo)} />
          ))
        )}
      </div>
    </div>
  );
}

function MemoCard({ memo, onClick }) {
  const books = memo.purchased_books || [];
  return (
    <Card hover onClick={onClick}>
      {/* 상단: 날짜 & 별명 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '10px',
      }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {memo.visit_date} · {TIME_LABELS[memo.visit_time]}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '16px' }}>{WEATHER_EMOJIS[memo.weather] || '🌤️'}</span>
            <span style={{ fontSize: '16px' }}>{MOOD_EMOJIS[memo.mood] || '☕'}</span>
            {memo.weather_temp && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {memo.weather_temp}°C
              </span>
            )}
          </div>
        </div>
        {memo.customer_tag && (
          <span style={{
            background: 'var(--color-accent-bg)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 12px', fontSize: '13px',
            color: 'var(--color-text-secondary)', fontWeight: 500,
          }}>
            {memo.customer_tag}
          </span>
        )}
      </div>

      {/* 고객 인상 */}
      <p style={{
        fontSize: '15px', fontWeight: 500,
        color: 'var(--color-text-primary)', marginBottom: '6px',
      }}>
        {memo.customer_impression}
      </p>

      {/* 주인 메모 (2줄 미리보기) */}
      {memo.owner_note && (
        <p style={{
          fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {memo.owner_note}
        </p>
      )}

      {/* 구매 도서 */}
      {books.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {books.map((b, i) => (
            <span key={i} style={{
              fontSize: '12px', color: 'var(--color-text-secondary)',
              background: 'var(--color-accent-bg)',
              padding: '3px 10px', borderRadius: 'var(--radius-sm)',
            }}>
              📕 {b.title}
            </span>
          ))}
        </div>
      )}

      {/* 태그 */}
      {(memo.tags || []).length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {memo.tags.map(t => <Tag key={t} label={`#${t}`} />)}
        </div>
      )}
    </Card>
  );
}
