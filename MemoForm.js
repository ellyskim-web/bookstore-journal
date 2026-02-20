'use client';
import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Textarea, Tag, SectionDivider } from './ui';
import { useWeather } from './useWeather';
import {
  GENRES, WEATHER_OPTIONS, TIME_OPTIONS, MOOD_OPTIONS,
} from '../lib/constants';

const EMPTY_BOOK = { title: '', author: '', genre: '기타', price: '' };

export default function MemoForm({ memo, onSave, onCancel }) {
  const isEdit = !!memo;
  const { weatherData, loading: weatherLoading, fetchWeather } = useWeather();

  const [form, setForm] = useState(() => {
    if (memo) {
      return {
        visit_date: memo.visit_date,
        visit_time: memo.visit_time,
        weather: memo.weather,
        weather_detail: memo.weather_detail || '',
        weather_temp: memo.weather_temp,
        weather_humidity: memo.weather_humidity,
        weather_auto_fetched: memo.weather_auto_fetched || false,
        customer_impression: memo.customer_impression,
        customer_tag: memo.customer_tag || '',
        browsing_note: memo.browsing_note || '',
        owner_note: memo.owner_note || '',
        mood: memo.mood || 'normal',
        tags: memo.tags || [],
      };
    }
    return {
      visit_date: new Date().toISOString().split('T')[0],
      visit_time: getCurrentTimeSlot(),
      weather: 'sunny',
      weather_detail: '',
      weather_temp: null,
      weather_humidity: null,
      weather_auto_fetched: false,
      customer_impression: '',
      customer_tag: '',
      browsing_note: '',
      owner_note: '',
      mood: 'normal',
      tags: [],
    };
  });

  const [books, setBooks] = useState(() => {
    if (memo?.purchased_books?.length > 0) {
      return memo.purchased_books.map(b => ({
        title: b.title,
        author: b.author || '',
        genre: b.genre || '기타',
        price: b.price || '',
      }));
    }
    return [{ ...EMPTY_BOOK }];
  });

  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // 새 메모일 때 날씨 자동 조회
  useEffect(() => {
    if (!isEdit && form.visit_date === new Date().toISOString().split('T')[0]) {
      fetchWeather();
    }
  }, []);

  // 날씨 데이터가 들어오면 폼에 반영
  useEffect(() => {
    if (weatherData && !isEdit) {
      setForm(prev => ({
        ...prev,
        weather: weatherData.weather,
        weather_detail: weatherData.weather_detail,
        weather_temp: weatherData.weather_temp,
        weather_humidity: weatherData.weather_humidity,
        weather_auto_fetched: true,
      }));
    }
  }, [weatherData, isEdit]);

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function updateBook(idx, key, val) {
    setBooks(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  }

  function addBook() {
    setBooks(prev => [...prev, { ...EMPTY_BOOK }]);
  }

  function removeBook(idx) {
    setBooks(prev => prev.filter((_, i) => i !== idx));
  }

  function addTag() {
    const t = tagInput.trim().replace('#', '');
    if (t && !form.tags.includes(t)) {
      update('tags', [...form.tags, t]);
    }
    setTagInput('');
  }

  async function handleSave() {
    if (!form.customer_impression.trim()) {
      alert('고객 인상을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const cleanedBooks = books.filter(b => b.title.trim());
      await onSave(form, cleanedBooks);
    } catch (err) {
      alert('저장 중 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px',
      }}>
        <Button variant="ghost" onClick={onCancel}>← 취소</Button>
        <h2 style={{
          fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-serif)',
        }}>
          {isEdit ? '메모 수정' : '새 관찰 메모'}
        </h2>
        <div style={{ width: '50px' }} />
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 날짜 & 시간 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="📅 날짜" type="date"
              value={form.visit_date}
              onChange={e => update('visit_date', e.target.value)}
            />
            <Select
              label="🕐 시간대"
              value={form.visit_time}
              onChange={e => update('visit_time', e.target.value)}
              options={TIME_OPTIONS}
            />
          </div>

          {/* 날씨 - 자동/수동 */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                🌤️ 날씨
              </span>
              {form.weather_auto_fetched && (
                <span style={{
                  fontSize: '11px', color: 'var(--color-success)',
                  background: 'rgba(45,138,78,0.08)',
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                }}>
                  ✓ 자동 조회됨
                </span>
              )}
              {weatherLoading && (
                <span className="animate-pulse" style={{
                  fontSize: '11px', color: 'var(--color-text-muted)',
                }}>
                  날씨 조회 중...
                </span>
              )}
              {!isEdit && (
                <Button variant="ghost" size="sm" onClick={fetchWeather} disabled={weatherLoading}>
                  🔄 새로고침
                </Button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Select
                value={form.weather}
                onChange={e => update('weather', e.target.value)}
                options={WEATHER_OPTIONS}
              />
              <Select
                label=""
                value={form.mood}
                onChange={e => update('mood', e.target.value)}
                options={MOOD_OPTIONS.map(m => ({ ...m, label: `${m.emoji} ${m.label}` }))}
              />
            </div>
            <Input
              value={form.weather_detail}
              onChange={e => update('weather_detail', e.target.value)}
              placeholder="예: 매우 춥고, 구름이 많음"
            />
            {form.weather_temp && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                기온 {form.weather_temp}°C · 습도 {form.weather_humidity}%
              </p>
            )}
          </div>

          <SectionDivider />

          {/* 고객 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="👤 고객 인상"
              value={form.customer_impression}
              onChange={e => update('customer_impression', e.target.value)}
              placeholder="예: 40대로 보이는 여성"
            />
            <Input
              label="🏷️ 고객 별명"
              value={form.customer_tag}
              onChange={e => update('customer_tag', e.target.value)}
              placeholder="예: 토지 아주머니"
            />
          </div>

          <Textarea
            label="👀 관찰 메모"
            value={form.browsing_note}
            onChange={e => update('browsing_note', e.target.value)}
            placeholder="둘러본 코너, 행동, 분위기 등"
            rows={3}
          />

          <SectionDivider />

          {/* 구매 도서 */}
          <div>
            <p style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--color-text-secondary)', marginBottom: '12px',
            }}>📚 구매 도서</p>
            {books.map((book, idx) => (
              <div key={idx} style={{
                background: 'var(--color-accent-bg)', borderRadius: 'var(--radius-md)',
                padding: '14px', marginBottom: '10px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <Input
                    value={book.title} onChange={e => updateBook(idx, 'title', e.target.value)}
                    placeholder="도서명"
                  />
                  <Input
                    value={book.author} onChange={e => updateBook(idx, 'author', e.target.value)}
                    placeholder="저자"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <Select
                      value={book.genre} onChange={e => updateBook(idx, 'genre', e.target.value)}
                      options={GENRES.map(g => ({ value: g, label: g }))}
                    />
                  </div>
                  <Input
                    value={book.price} onChange={e => updateBook(idx, 'price', e.target.value)}
                    placeholder="가격"
                    type="number"
                    style={{ width: '100px' }}
                  />
                  {books.length > 1 && (
                    <button onClick={() => removeBook(idx)} style={{
                      background: 'none', border: 'none', color: 'var(--color-danger)',
                      cursor: 'pointer', fontSize: '18px', padding: '4px 8px',
                    }}>×</button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={addBook} style={{
              background: 'none', border: '1.5px dashed var(--color-border-strong)',
              borderRadius: 'var(--radius-md)', padding: '10px', width: '100%',
              color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '13px',
            }}>+ 도서 추가</button>
          </div>

          <SectionDivider />

          {/* 주인 메모 */}
          <Textarea
            label="✍️ 서점 주인의 메모"
            value={form.owner_note}
            onChange={e => update('owner_note', e.target.value)}
            placeholder="느낀 점, 대화 내용, 특이사항 등 자유롭게"
            rows={4}
          />

          {/* 태그 */}
          <div>
            <p style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--color-text-secondary)', marginBottom: '8px',
            }}>🏷️ 태그</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="#태그 입력 후 Enter"
                />
              </div>
              <Button variant="secondary" onClick={addTag}>추가</Button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.tags.map(t => (
                  <Tag key={t} label={`#${t}`} removable onRemove={() => update('tags', form.tags.filter(x => x !== t))} />
                ))}
              </div>
            )}
          </div>

          {/* 저장 버튼 */}
          <Button size="full" onClick={handleSave} loading={saving} disabled={saving}
            style={{ marginTop: '8px' }}>
            {isEdit ? '수정 완료' : '메모 저장'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function getCurrentTimeSlot() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 14) return 'lunch';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
