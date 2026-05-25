'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Match, Theme } from '@/lib/types';
import { V2_DARK, V2_LIGHT } from '@/lib/theme';
import { INITIAL_MATCHES } from '@/lib/data';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { StandingsPage } from './StandingsPage';
import { CalendarPage } from './CalendarPage';
import { LoginSheet, EditMatchSheet, AddMatchSheet } from './AdminSheets';

const STORAGE_KEY = 'torneio-outeiro-v2';
const SESSION_KEY = 'torneio-outeiro-admin-v2';
const THEME_KEY   = 'torneio-outeiro-theme-v2';

type Page = 'table' | 'calendar';

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function App() {
  const [matches, setMatches] = useState<Match[]>(() => loadLS(STORAGE_KEY, INITIAL_MATCHES));
  const [page, setPage] = useState<Page>('table');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    try { return (localStorage.getItem(THEME_KEY) as Theme) || 'dark'; } catch { return 'dark'; }
  });
  const [showLogin, setShowLogin] = useState(false);
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  // Start as false (matches SSR), flip on client
  const [isDesktop, setIsDesktop] = useState(false);

  const T = theme === 'light' ? V2_LIGHT : V2_DARK;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(matches)); } catch {} }, [matches]);
  useEffect(() => {
    try {
      if (isAdmin) localStorage.setItem(SESSION_KEY, '1');
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, [isAdmin]);
  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    document.body.style.background = T.bg;
  }, [theme, T.bg]);

  const editingMatch = useMemo(() => matches.find((m) => m.id === editMatchId) ?? null, [matches, editMatchId]);
  const maxJornada = useMemo(() => matches.reduce((mx, m) => Math.max(mx, m.jornada), 0), [matches]);

  function saveMatch(updated: Match) {
    setMatches(matches.map((m) => (m.id === updated.id ? updated : m)));
    setEditMatchId(null);
  }
  function deleteMatch() {
    setMatches(matches.filter((m) => m.id !== editMatchId));
    setEditMatchId(null);
  }
  function addMatch(newMatch: Match) {
    const next = [...matches, newMatch].sort((a, b) => {
      if (a.jornada !== b.jornada) return a.jornada - b.jornada;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    setMatches(next);
    setShowAddMatch(false);
  }
  function resetData() {
    if (confirm('Repor todos os dados originais?')) {
      setMatches(INITIAL_MATCHES);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }

  const sharedNavProps = {
    page, onChange: setPage,
    isAdmin, theme,
    onToggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    onLogin: () => setShowLogin(true),
    onLogout: () => setIsAdmin(false),
    T,
  };

  const pageContent = (
    <>
      {page === 'table' && <StandingsPage matches={matches} T={T} />}
      {page === 'calendar' && (
        <CalendarPage
          matches={matches} isAdmin={isAdmin}
          onEditMatch={setEditMatchId} onAddMatch={() => setShowAddMatch(true)}
          T={T}
        />
      )}
    </>
  );

  return (
    <div style={{ minHeight: '100dvh', background: T.bg }}>
      {isDesktop ? (
        // ── Desktop: sidebar + content, full screen ─────────────
        <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: T.bg }}>
          <Sidebar {...sharedNavProps} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {pageContent}
          </div>
          {isAdmin && !showLogin && !editingMatch && !showAddMatch && (
            <button
              onClick={resetData}
              title="Repor dados de demonstração"
              style={{
                position: 'fixed', right: 24, bottom: 24,
                width: 36, height: 36, borderRadius: '50%',
                background: T.surf2, color: T.mute,
                border: `1px solid ${T.line2}`,
                fontSize: 15, fontWeight: 500,
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)', opacity: 0.85,
              }}
            >↺</button>
          )}
        </div>
      ) : (
        // ── Mobile: header + content + bottom nav ───────────────
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: T.bg, position: 'relative', overflow: 'hidden' }}>
          <Header
            isAdmin={isAdmin} theme={theme}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            onLogin={() => setShowLogin(true)} onLogout={() => setIsAdmin(false)}
            T={T}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {pageContent}
          </div>
          <BottomNav page={page} onChange={setPage} T={T} />
          {isAdmin && !showLogin && !editingMatch && !showAddMatch && (
            <button
              onClick={resetData}
              title="Repor dados de demonstração"
              style={{
                position: 'absolute', right: 14, bottom: 88,
                width: 34, height: 34, borderRadius: '50%',
                background: T.surf2, color: T.mute,
                border: `1px solid ${T.line2}`,
                fontSize: 14, fontWeight: 500,
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)', opacity: 0.85,
              }}
            >↺</button>
          )}
        </div>
      )}

      {showLogin && (
        <LoginSheet T={T} onClose={() => setShowLogin(false)} onLogin={() => { setIsAdmin(true); setShowLogin(false); }} />
      )}
      {editingMatch && (
        <EditMatchSheet T={T} match={editingMatch} onClose={() => setEditMatchId(null)} onSave={saveMatch} onDelete={deleteMatch} />
      )}
      {showAddMatch && (
        <AddMatchSheet T={T} onClose={() => setShowAddMatch(false)} onAdd={addMatch} suggestedJornada={maxJornada + 1} />
      )}
    </div>
  );
}
