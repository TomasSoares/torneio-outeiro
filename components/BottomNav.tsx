'use client';

import type { ThemeColors } from '@/lib/theme';
import type { TournamentPhase } from '@/lib/helpers';

type Page = 'table' | 'bracket' | 'calendar' | 'admin';

interface Props {
  page: Page;
  onChange: (p: Page) => void;
  isAdmin: boolean;
  phase: TournamentPhase;
  T: ThemeColors;
}

export function BottomNav({ page, onChange, isAdmin, phase: _phase, T }: Props) {
  const ITEMS: { id: Page; label: string }[] = [
    { id: 'table',    label: 'Classificação' },
    { id: 'bracket',  label: 'Fase Final' },
    { id: 'calendar', label: 'Calendário' },
    ...(isAdmin ? [{ id: 'admin' as Page, label: 'Equipas' }] : []),
  ];
  const compact = ITEMS.length >= 4;
  return (
    <div
      style={{
        padding: '10px 16px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
        background: T.bg, borderTop: `1px solid ${T.line}`,
      }}
    >
      <div
        style={{
          display: 'flex', gap: 4, padding: 4, borderRadius: 100,
          background: T.surf, border: `1px solid ${T.line}`,
        }}
      >
        {ITEMS.map((it) => {
          const active = page === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              style={{
                flex: 1, background: active ? T.lime : 'transparent',
                color: active ? T.bg : T.mute,
                border: 'none',
                padding: compact ? '8px 6px' : '10px 12px',
                borderRadius: 100,
                fontSize: compact ? 11 : 13,
                fontWeight: active ? 600 : 500,
                letterSpacing: compact ? -0.3 : -0.1,
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
