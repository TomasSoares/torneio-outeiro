'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTeams } from '@/lib/context';
import type { ThemeColors } from '@/lib/theme';

export type ToastState = { msg: string; type: 'success' | 'error' } | null;

export function ToastBar({ toast, T }: { toast: ToastState; T: ThemeColors }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div
      style={{
        position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
        zIndex: 200, pointerEvents: 'none',
        animation: 'slideUp 220ms cubic-bezier(0.2,0.8,0.2,1)',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 100,
          background: isErr ? 'rgba(255,77,90,0.12)' : T.limeDim,
          border: `1px solid ${isErr ? 'rgba(255,77,90,0.4)' : T.lime + '55'}`,
          color: isErr ? '#ff4d5a' : T.lime,
          fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: 15 }}>{isErr ? '✕' : '✓'}</span>
        {toast.msg}
      </div>
    </div>
  );
}

export function Badge({ code, size = 32, T }: { code: string; size?: number; T: ThemeColors }) {
  const teams = useTeams();
  const team = teams[code];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size / 4,
        background: team?.color ?? T.mute2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, color: '#fff', fontSize: size * 0.34, letterSpacing: -0.3,
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {team?.code ?? code}
    </div>
  );
}

export function Eyebrow({
  children,
  color,
  size = 10,
  style = {},
  T,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
  T: ThemeColors;
}) {
  return (
    <div
      className="mono"
      style={{
        fontSize: size,
        fontWeight: 500,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: color ?? T.mute,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  color,
  bg,
  style = {},
  T,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
  T: ThemeColors;
}) {
  return (
    <div
      className="mono"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', borderRadius: 100,
        background: bg ?? T.surf2, color: color ?? T.text,
        fontSize: 10, fontWeight: 500,
        letterSpacing: 1, textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function LiveDot({ color, T }: { color?: string; T: ThemeColors }) {
  const c = color ?? T.lime;
  return (
    <div
      style={{
        width: 7, height: 7, borderRadius: '50%', background: c,
        boxShadow: `0 0 8px ${c}`,
        animation: 'pulse 1.6s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  );
}

export function FormDots({ form, size = 6, T }: { form: ('V' | 'E' | 'D')[]; size?: number; T: ThemeColors }) {
  const last = form.slice(-5);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {last.map((r, i) => {
        const col = r === 'V' ? T.lime : r === 'D' ? T.loss : T.mute2;
        return (
          <div
            key={i}
            style={{ width: size, height: size, borderRadius: '50%', background: col, opacity: r === 'V' ? 1 : 0.85 }}
          />
        );
      })}
      {Array.from({ length: 5 - last.length }).map((_, i) => (
        <div
          key={'e' + i}
          style={{ width: size, height: size, borderRadius: '50%', border: `1px solid ${T.line2}` }}
        />
      ))}
    </div>
  );
}
