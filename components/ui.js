'use client';
import { useState } from 'react';

// ── Card ──
export function Card({ children, style, onClick, hover = false, className = '' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`animate-fade-in ${className}`}
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'var(--color-surface)',
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'box-shadow 0.25s, transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Tag ──
export function Tag({ label, active, onClick, size = 'sm', removable, onRemove }) {
  const pad = size === 'sm' ? '4px 10px' : '6px 14px';
  const fs = size === 'sm' ? '12px' : '13px';
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: pad, borderRadius: 'var(--radius-full)',
        fontSize: fs, fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        background: active ? 'var(--color-accent-bg-strong)' : 'var(--color-accent-bg)',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        border: active ? '1px solid rgba(107,94,78,0.3)' : '1px solid transparent',
        transition: 'all 0.2s',
      }}
    >
      {label}
      {removable && (
        <button
          onClick={e => { e.stopPropagation(); onRemove?.(); }}
          style={{
            background: 'none', border: 'none', color: '#999',
            cursor: 'pointer', fontSize: '14px', padding: '0 2px', lineHeight: 1,
          }}
        >×</button>
      )}
    </span>
  );
}

// ── Button ──
export function Button({ children, variant = 'primary', size = 'md', disabled, loading, ...props }) {
  const styles = {
    primary: {
      background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
      color: '#fff',
      boxShadow: '0 4px 15px rgba(107,94,78,0.3)',
    },
    secondary: {
      background: 'var(--color-accent-bg)',
      color: 'var(--color-text-secondary)',
    },
    danger: {
      background: 'rgba(200,80,80,0.08)',
      color: 'var(--color-danger)',
    },
    ghost: {
      background: 'none',
      color: 'var(--color-text-secondary)',
    },
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '13px' },
    md: { padding: '10px 18px', fontSize: '14px' },
    lg: { padding: '14px 24px', fontSize: '16px' },
    full: { padding: '14px 24px', fontSize: '16px', width: '100%' },
  };
  return (
    <button
      disabled={disabled || loading}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        ...styles[variant],
        ...sizes[size],
      }}
      onMouseDown={e => { if (!disabled) e.target.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.target.style.transform = 'scale(1)'; }}
      {...props}
    >
      {loading && <span className="animate-pulse">⏳</span>}
      {children}
    </button>
  );
}

// ── Input ──
export function Input({ label, ...props }) {
  return (
    <div>
      {label && (
        <label style={{
          fontSize: '13px', fontWeight: 600,
          color: 'var(--color-text-secondary)',
          display: 'block', marginBottom: '6px',
        }}>{label}</label>
      )}
      <input
        style={{
          width: '100%', padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--color-border-strong)',
          background: 'rgba(255,255,255,0.6)',
          fontSize: '14px', outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#a08c6e'}
        onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
        {...props}
      />
    </div>
  );
}

// ── Select ──
export function Select({ label, options, ...props }) {
  return (
    <div>
      {label && (
        <label style={{
          fontSize: '13px', fontWeight: 600,
          color: 'var(--color-text-secondary)',
          display: 'block', marginBottom: '6px',
        }}>{label}</label>
      )}
      <select
        style={{
          width: '100%', padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--color-border-strong)',
          background: 'rgba(255,255,255,0.6)',
          fontSize: '14px', outline: 'none', cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#a08c6e'}
        onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.emoji ? `${o.emoji} ${o.label}` : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Textarea ──
export function Textarea({ label, ...props }) {
  return (
    <div>
      {label && (
        <label style={{
          fontSize: '13px', fontWeight: 600,
          color: 'var(--color-text-secondary)',
          display: 'block', marginBottom: '6px',
        }}>{label}</label>
      )}
      <textarea
        style={{
          width: '100%', padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--color-border-strong)',
          background: 'rgba(255,255,255,0.6)',
          fontSize: '14px', outline: 'none',
          resize: 'vertical', lineHeight: 1.6,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#a08c6e'}
        onBlur={e => e.target.style.borderColor = 'var(--color-border-strong)'}
        {...props}
      />
    </div>
  );
}

// ── Loading Spinner ──
export function Loading({ text = '불러오는 중...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div className="animate-pulse" style={{ fontSize: '40px', marginBottom: '12px' }}>📖</div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{text}</p>
    </div>
  );
}

// ── Empty State ──
export function EmptyState({ icon = '📝', message, action }) {
  return (
    <Card style={{ textAlign: 'center', padding: '48px 20px' }}>
      <p style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginBottom: action ? '16px' : 0 }}>
        {message}
      </p>
      {action}
    </Card>
  );
}

// ── Section divider ──
export function SectionDivider() {
  return <div style={{ borderTop: '1px solid rgba(200,185,160,0.2)', margin: '20px 0' }} />;
}
