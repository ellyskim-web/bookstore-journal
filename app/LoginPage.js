'use client';
import { useState } from 'react';
import { Button, Input } from './ui';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onLogin(email, password, mode);
      if (mode === 'signup') {
        setSignupSuccess(true);
      }
    } catch (err) {
      const msg = err.message || '오류가 발생했습니다.';
      if (msg.includes('Invalid login')) setError('이메일 또는 비밀번호가 틀렸습니다.');
      else if (msg.includes('already registered')) setError('이미 가입된 이메일입니다.');
      else if (msg.includes('Password should be')) setError('비밀번호는 6자 이상이어야 합니다.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5f0e8 0%, #e8dfd3 40%, #d4c5b0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '420px', width: '100%',
        boxShadow: '0 20px 60px rgba(120,100,70,0.15), 0 1px 3px rgba(120,100,70,0.1)',
        border: '1px solid rgba(200,185,160,0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
          <h1 style={{
            fontSize: '26px', fontWeight: 700, color: '#4a3f35',
            fontFamily: 'var(--font-serif)', letterSpacing: '-0.5px', marginBottom: '8px',
          }}>서점 관찰 일지</h1>
          <p style={{ fontSize: '14px', color: '#8a7e6e', lineHeight: 1.6 }}>
            오늘도 서점에 찾아온 이야기를 기록합니다
          </p>
        </div>

        {signupSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>✉️</p>
            <p style={{ fontSize: '15px', color: '#4a3f35', marginBottom: '8px', fontWeight: 600 }}>
              가입 확인 이메일을 보냈습니다
            </p>
            <p style={{ fontSize: '13px', color: '#8a7e6e', marginBottom: '20px' }}>
              이메일을 확인하여 가입을 완료해주세요.
            </p>
            <Button variant="secondary" onClick={() => { setMode('login'); setSignupSuccess(false); }}>
              로그인으로 돌아가기
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tab */}
            <div style={{
              display: 'flex', background: 'rgba(107,94,78,0.06)',
              borderRadius: '10px', padding: '3px',
            }}>
              {['login', 'signup'].map(m => (
                <button
                  key={m} type="button"
                  onClick={() => { setMode(m); setError(''); }}
                  style={{
                    flex: 1, padding: '10px', border: 'none',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: mode === m ? 600 : 400,
                    background: mode === m ? '#fff' : 'transparent',
                    color: mode === m ? '#4a3f35' : '#8a7e6e',
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {m === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            <Input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일 주소"
              label="이메일"
              required
            />
            <Input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}
              label="비밀번호"
              required
              minLength={mode === 'signup' ? 6 : undefined}
            />

            {error && (
              <p style={{ color: '#c44', fontSize: '13px', textAlign: 'center' }}>{error}</p>
            )}

            <Button type="submit" size="full" loading={loading} disabled={loading}>
              {mode === 'login' ? '로그인' : '가입하기'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
