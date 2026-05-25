'use client';

import type { ThemeColors } from '@/lib/theme';

type Page = 'table' | 'calendar';

interface Props {
  page: Page;
  onChange: (p: Page) => void;
  T: ThemeColors;
}

const ITEMS: { id: Page; label: string }[] = [
  { id: 'table', label: 'Classificação' },
  { id: 'calendar', label: 'Calendário' },
];

export function BottomNav({ page, onChange, T }: Props) {
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
                border: 'none', padding: '10px 12px', borderRadius: 100,
                fontSize: 13, fontWeight: active ? 600 : 500, letterSpacing: -0.1,
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
