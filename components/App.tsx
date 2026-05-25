'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Match, Theme } from '@/lib/types';
import { V2_DARK, V2_LIGHT } from '@/lib/theme';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { StandingsPage } from './StandingsPage';
import { CalendarPage } from './CalendarPage';
import { LoginSheet, EditMatchSheet, AddMatchSheet } from './AdminSheets';

const SESSION_KEY = 'torneio-outeiro-admin-v2';
const THEME_KEY   = 'torneio-outeiro-theme-v2';

type Page = 'table' | 'calendar';

async function apiCall(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function App() {
  const [matches, setMatches] = useState<Match[]>([]);
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
  const [isDesktop, setIsDesktop] = useState(false);

  const T = theme === 'light' ? V2_LIGHT : V2_DARK;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMatches(data); })
      .catch(console.error);
  }, []);

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

  async function saveMatch(updated: Match) {
    await apiCall(`/api/matches/${updated.id}`, 'PATCH', updated);
    setMatches(matches.map((m) => (m.id === updated.id ? updated : m)));
    setEditMatchId(null);
  }
  async function deleteMatch() {
    await apiCall(`/api/matches/${editMatchId}`, 'DELETE');
    setMatches(matches.filter((m) => m.id !== editMatchId));
    setEditMatchId(null);
  }
  async function addMatch(newMatch: Match) {
    await apiCall('/api/matches', 'POST', newMatch);
    const next = [...matches, newMatch].sort((a, b) => {
      if (a.jornada !== b.jornada) return a.jornada - b.jornada;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    setMatches(next);
    setShowAddMatch(false);
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
