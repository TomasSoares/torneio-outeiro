'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Match, Team, Player, Theme } from '@/lib/types';
import { V2_DARK, V2_LIGHT } from '@/lib/theme';
import { AppCtx } from '@/lib/context';
import { ToastBar, type ToastState } from './primitives';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { StandingsPage } from './StandingsPage';
import { CalendarPage } from './CalendarPage';
import { AdminTeamsPage } from './AdminTeamsSheet';
import { LoginSheet, EditMatchSheet, AddMatchSheet } from './AdminSheets';

const SESSION_KEY = 'torneio-outeiro-admin-v2';

type Page = 'table' | 'calendar' | 'admin';

async function apiCall(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Erro de servidor');
  }
  return res.json();
}

export function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [page, setPage] = useState<Page>('table');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [hydrated, setHydrated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const T = theme === 'light' ? V2_LIGHT : V2_DARK;

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const reloadTeams = useCallback(() => {
    fetch('/api/teams').then((r) => r.json()).then((d) => { if (d && typeof d === 'object' && !d.error) setTeams(d); }).catch(console.error);
  }, []);

  const reloadPlayers = useCallback(() => {
    fetch('/api/players').then((r) => r.json()).then((d) => { if (d && typeof d === 'object' && !d.error) setPlayers(d); }).catch(console.error);
  }, []);

  const reloadMatches = useCallback(async () => {
    try {
      const r = await fetch('/api/matches');
      const d = await r.json();
      if (Array.isArray(d)) setMatches(d);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try {
      setIsAdmin(sessionStorage.getItem(SESSION_KEY) === '1');
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetch('/api/matches').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setMatches(d); }).catch(console.error);
    reloadTeams();
    reloadPlayers();
  }, [reloadTeams, reloadPlayers]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isAdmin) sessionStorage.setItem(SESSION_KEY, '1');
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }, [isAdmin, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.body.style.background = T.bg;
  }, [theme, T.bg, hydrated]);

  const editingMatch = useMemo(() => matches.find((m) => m.id === editMatchId) ?? null, [matches, editMatchId]);
  const maxJornada = useMemo(() => matches.reduce((mx, m) => Math.max(mx, m.jornada), 0), [matches]);

  async function saveMatch(updated: Match) {
    try {
      const prev = matches.find((m) => m.id === updated.id);
      await apiCall(`/api/matches/${updated.id}`, 'PATCH', updated);
      setMatches(matches.map((m) => (m.id === updated.id ? updated : m)));
      setEditMatchId(null);
      const msg = updated.played ? 'Resultado guardado' : prev?.played ? 'Resultado anulado' : 'Alterações guardadas';
      showToast(msg);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao guardar', 'error');
    }
  }
  async function deleteMatch() {
    try {
      await apiCall(`/api/matches/${editMatchId}`, 'DELETE');
      setMatches(matches.filter((m) => m.id !== editMatchId));
      setEditMatchId(null);
      showToast('Jogo eliminado');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao eliminar', 'error');
    }
  }
  async function addMatch(newMatch: Match) {
    try {
      await apiCall('/api/matches', 'POST', newMatch);
      const next = [...matches, newMatch].sort((a, b) => {
        if (a.jornada !== b.jornada) return a.jornada - b.jornada;
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
      setMatches(next);
      setShowAddMatch(false);
      showToast('Jogo adicionado');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erro ao adicionar jogo', 'error');
    }
  }

  const sharedNavProps = {
    page, onChange: (p: Page) => setPage(p),
    isAdmin, theme,
    onToggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    onLogin: () => setShowLogin(true),
    onLogout: () => {
      fetch('/api/admin/login', { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
      setIsAdmin(false);
      if (page === 'admin') setPage('table');
    },
    T,
  };

  const pageContent = (
    <>
      {page === 'table' && <StandingsPage matches={matches} T={T} />}
      {page === 'calendar' && (
        <CalendarPage matches={matches} isAdmin={isAdmin} onEditMatch={setEditMatchId} onAddMatch={() => setShowAddMatch(true)} T={T} />
      )}
    </>
  );

  return (
    <AppCtx.Provider value={{ teams, players, reloadTeams, reloadPlayers, reloadMatches, showToast }}>
      <div style={{ minHeight: '100dvh', background: T.bg }}>
        {isDesktop ? (
          <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: T.bg }}>
            <Sidebar {...sharedNavProps} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {pageContent}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: T.bg, position: 'relative', overflow: 'hidden' }}>
            <Header
              isAdmin={isAdmin} theme={theme}
              onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onLogin={() => setShowLogin(true)} onLogout={() => { setIsAdmin(false); if (page === 'admin') setPage('table'); }}
              T={T}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {pageContent}
            </div>
            <BottomNav page={page} onChange={(p) => setPage(p)} isAdmin={isAdmin} T={T} />
          </div>
        )}

        {showLogin && (
          <LoginSheet T={T} onClose={() => setShowLogin(false)} onLogin={() => { setIsAdmin(true); setShowLogin(false); showToast('Sessão iniciada'); }} />
        )}
        {editingMatch && (
          <EditMatchSheet T={T} match={editingMatch} onClose={() => setEditMatchId(null)} onSave={saveMatch} onDelete={deleteMatch} />
        )}
        {showAddMatch && (
          <AddMatchSheet T={T} onClose={() => setShowAddMatch(false)} onAdd={addMatch} suggestedJornada={maxJornada + 1} />
        )}
        {page === 'admin' && isAdmin && (
          <AdminTeamsPage T={T} onClose={() => setPage('table')} />
        )}

        <ToastBar toast={toast} T={T} />
      </div>
    </AppCtx.Provider>
  );
}
