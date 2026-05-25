'use client';

import type { ThemeColors } from '@/lib/theme';
import { Eyebrow, LiveDot } from './primitives';

interface Props {
  isAdmin: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
  T: ThemeColors;
}

export function Header({ isAdmin, theme, onToggleTheme, onLogin, onLogout, T }: Props) {
  const isLight = theme === 'light';
  return (
    <div style={{ background: T.bg, borderBottom: `1px solid ${T.line}` }}>
      <div
        style={{
          padding: '16px 20px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: T.lime, color: T.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 17, letterSpacing: -0.5,
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

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onToggleTheme}
            aria-label="Mudar tema"
            style={{
              width: 32, height: 32, padding: 0, borderRadius: 100,
              background: T.surf, color: T.mute,
              border: `1px solid ${T.line2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isLight ? (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>

          {isAdmin ? (
            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: T.surf2, color: T.text,
                border: `1px solid ${T.line2}`,
                padding: '7px 12px', borderRadius: 100,
                fontSize: 10, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase',
              }}
            >
              <LiveDot color={T.lime} T={T} />
              <span className="mono">admin</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              style={{
                background: 'transparent', color: T.text,
                border: `1px solid ${T.line2}`,
                padding: '7px 14px', borderRadius: 100,
                fontSize: 12, fontWeight: 500, letterSpacing: 0.2,
              }}
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
