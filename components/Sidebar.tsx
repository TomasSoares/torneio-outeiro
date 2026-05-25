'use client';

import type { ReactNode } from 'react';
import type { ThemeColors } from '@/lib/theme';
import { Eyebrow, LiveDot } from './primitives';

type Page = 'table' | 'calendar';

interface Props {
  page: Page;
  onChange: (p: Page) => void;
  isAdmin: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
  T: ThemeColors;
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="14" height="14" rx="2" />
      <path d="M1 5h14M5 5v9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="2" width="14" height="13" rx="2" />
      <path d="M1 6h14M5 1v2M11 1v2" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

const NAV: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'table',    label: 'Classificação', icon: <TableIcon /> },
  { id: 'calendar', label: 'Calendário',    icon: <CalendarIcon /> },
];

export function Sidebar({ page, onChange, isAdmin, theme, onToggleTheme, onLogin, onLogout, T }: Props) {
  const isLight = theme === 'light';
  return (
    <div
      style={{
        width: 240, height: '100dvh', position: 'sticky', top: 0,
        display: 'flex', flexDirection: 'column',
        background: T.bg2, borderRight: `1px solid ${T.line}`,
        padding: '28px 16px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4, marginBottom: 36 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: T.lime, color: T.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 18, letterSpacing: -0.5,
            flexShrink: 0,
          }}
        >
          T
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: -0.3, color: T.text, lineHeight: 1 }}>
            Torneio Outeiro
          </div>
          <div style={{ marginTop: 3 }}>
            <Eyebrow size={9} color={T.mute2} T={T}>2026</Eyebrow>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Eyebrow size={9} color={T.mute3} style={{ paddingLeft: 12, marginBottom: 6 }} T={T}>Menu</Eyebrow>
        {NAV.map((it) => {
          const active = page === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: active ? T.limeDim : 'transparent',
                color: active ? T.lime : T.mute,
                border: `1px solid ${active ? T.lime + '33' : 'transparent'}`,
                fontWeight: active ? 600 : 500, fontSize: 14, letterSpacing: -0.2,
                textAlign: 'left',
              }}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={onToggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'transparent', color: T.mute,
            border: '1px solid transparent',
            fontWeight: 500, fontSize: 14, letterSpacing: -0.2,
          }}
        >
          {isLight ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
          {isLight ? 'Modo escuro' : 'Modo claro'}
        </button>

        {isAdmin ? (
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: T.limeDim, color: T.lime,
              border: `1px solid ${T.lime}33`,
              fontWeight: 500, fontSize: 14, letterSpacing: -0.2,
            }}
          >
            <LiveDot color={T.lime} T={T} />
            Sair (admin)
          </button>
        ) : (
          <button
            onClick={onLogin}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: T.surf2, color: T.text,
              border: `1px solid ${T.line2}`,
              fontWeight: 500, fontSize: 14, letterSpacing: -0.2,
            }}
          >
            <LoginIcon />
            Entrar
          </button>
        )}
      </div>
    </div>
  );
}
