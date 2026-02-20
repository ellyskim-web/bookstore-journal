'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, getMemos, createMemo, updateMemo, deleteMemo, getAllTags } from '../lib/supabase';
import { Button, Loading } from '../components/ui';
import LoginPage from '../components/LoginPage';
import MemoList from '../components/MemoList';
import MemoDetail from '../components/MemoDetail';
import MemoForm from '../components/MemoForm';
import Dashboard from '../components/Dashboard';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [memos, setMemos] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [currentView, setCurrentView] = useState('list');
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth 체크 ──
  useEffect(function() {
    supabase.auth.getSession().then(function(result) {
      var session = result.data.session;
      setUser(session ? session.user : null);
      setAuthLoading(false);
    });

    var subscription = supabase.auth.onAuthStateChange(function(_event, session) {
      setUser(session ? session.user : null);
    });

    return function() {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  // ── 데이터 로드 ──
  var loadData = useCallback(async function() {
    if (!user) return;
    setDataLoading(true);
    try {
      var memosResult = await getMemos({ search: searchQuery, tag: filterTag });
      setMemos(memosResult || []);
      var tagsResult = await getAllTags();
      setAllTags(tagsResult || []);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, searchQuery, filterTag]);

  useEffect(function() {
    loadData();
  }, [loadData]);

  // ── 로그인 핸들러 ──
  async function handleLogin(email, password, mode) {
    if (mode === 'signup') {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  }

  // ── 메모 CRUD 핸들러 ──
  async function handleSaveMemo(formData, books) {
    if (selectedMemo) {
      var updated = await updateMemo(selectedMemo.id, formData, books);
      setSelectedMemo(updated);
      setCurrentView('detail');
    } else {
      var created = await createMemo(formData, books);
      setSelectedMemo(created);
      setCurrentView('detail');
    }
    await loadData();
  }

  async function handleDeleteMemo(id) {
    await deleteMemo(id);
    setSelectedMemo(null);
    setCurrentView('list');
    await loadData();
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    setMemos([]);
    setSidebarOpen(false);
  }

  // ── 로딩 ──
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <Loading text="로딩 중..." />
      </div>
    );
  }

  // ── 미로그인 ──
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── 메인 앱 ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, var(--color-bg) 0%, var(--color-bg-warm) 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={function() { setSidebarOpen(!sidebarOpen); }}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
          >☰</button>
          <span style={{ fontSize: '22px' }}>📖</span>
          <h1 style={{
            fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-serif)', margin: 0,
          }}>서점 관찰 일지</h1>
        </div>
        <Button onClick={function() { setCurrentView('new'); setSelectedMemo(null); }}>
          <span style={{ fontSize: '16px' }}>＋</span>
          <span className="hide-mobile">새 메모</span>
        </Button>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            onClick={function() { setSidebarOpen(false); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }}
          />
        )}

        {/* Sidebar */}
        <nav style={{
          position: 'fixed', left: sidebarOpen ? 0 : '-280px',
          top: 0, bottom: 0, width: '260px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)', zIndex: 250,
          transition: 'left 0.3s ease',
          padding: '80px 20px 20px',
          borderRight: '1px solid var(--color-border)',
          boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { view: 'list', icon: '📋', label: '메모 목록' },
              { view: 'dashboard', icon: '📊', label: '대시보드' },
            ].map(function(item) {
              return (
                <button
                  key={item.view}
                  onClick={function() { setCurrentView(item.view); setSidebarOpen(false); }}
                  style={{
                    background: currentView === item.view ? 'var(--color-accent-bg)' : 'transparent',
                    border: 'none', borderRadius: 'var(--radius-md)', padding: '12px 16px',
                    textAlign: 'left', cursor: 'pointer', fontSize: '15px',
                    color: currentView === item.view ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: currentView === item.view ? 600 : 400,
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: '32px', padding: '16px', background: 'var(--color-accent-bg)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>총 기록</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>{memos.length}건</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute', bottom: '24px', left: '20px', right: '20px',
              background: 'transparent', border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)', padding: '10px',
              color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '14px',
            }}
          >로그아웃</button>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {dataLoading && memos.length === 0 && <Loading />}

          {currentView === 'list' && (
            <MemoList
              memos={memos} allTags={allTags}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filterTag={filterTag} setFilterTag={setFilterTag}
              onSelect={function(m) { setSelectedMemo(m); setCurrentView('detail'); }}
            />
          )}

          {currentView === 'detail' && selectedMemo && (
            <MemoDetail
              memo={selectedMemo}
              onBack={function() { setCurrentView('list'); }}
              onEdit={function() { setCurrentView('edit'); }}
              onDelete={handleDeleteMemo}
            />
          )}

          {(currentView === 'new' || currentView === 'edit') && (
            <MemoForm
              memo={currentView === 'edit' ? selectedMemo : null}
              onSave={handleSaveMemo}
              onCancel={function() { setCurrentView(selectedMemo ? 'detail' : 'list'); }}
            />
          )}

          {currentView === 'dashboard' && (
            <Dashboard memos={memos} />
          )}
        </main>
      </div>
    </div>
  );
}
