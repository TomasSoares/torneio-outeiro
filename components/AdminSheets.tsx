'use client';

import { useState, type CSSProperties, type ReactNode, type InputHTMLAttributes, type FormEvent } from 'react';
import type { Match, FlatScorer } from '@/lib/types';
import type { ThemeColors } from '@/lib/theme';
import { useTeams, usePlayers } from '@/lib/context';
import { fmtDateLong } from '@/lib/helpers';
import { Badge, Eyebrow, LiveDot } from './primitives';

// ── Sheet base ─────────────────────────────────────────────

function Sheet({
  children, onClose, title, eyebrow, T,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  T: ThemeColors;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: T.scrim, backdropFilter: 'blur(2px)' }} />
      <div
        className="sheet-panel"
        style={{
          marginTop: 'auto', position: 'relative',
          background: T.bg2, maxHeight: '90dvh',
          width: '100%',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTop: `1px solid ${T.line2}`,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: T.surf3 }} />
        </div>
        <div style={{ padding: '14px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {eyebrow && <Eyebrow size={9} color={T.lime} T={T}>{eyebrow}</Eyebrow>}
            <div style={{ fontWeight: 700, fontSize: 22, color: T.text, marginTop: 6, letterSpacing: -0.6 }}>{title}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.surf, border: `1px solid ${T.line2}`,
              width: 32, height: 32, borderRadius: 100, color: T.mute,
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            ✕
          </button>
        </div>
        <div className="scroll-hide" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Form primitives ────────────────────────────────────────

function Field({ label, children, T }: { label: string; children: ReactNode; T: ThemeColors }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Eyebrow size={9} color={T.mute} T={T}>{label}</Eyebrow>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

function Input({ T, style, ...props }: InputHTMLAttributes<HTMLInputElement> & { T: ThemeColors; style?: CSSProperties }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '12px 14px',
        background: T.surf, color: T.text,
        border: `1px solid ${T.line2}`, borderRadius: 10,
        outline: 'none', fontSize: 15,
        ...style,
      }}
    />
  );
}

function Btn({
  onClick, children, primary, danger, disabled, style = {}, T,
}: {
  onClick?: () => void;
  children: ReactNode;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  T: ThemeColors;
}) {
  const baseBg = primary ? T.lime : danger ? 'transparent' : T.surf2;
  const baseColor = primary ? T.bg : danger ? T.loss : T.text;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '14px',
        background: baseBg, color: baseColor,
        border: primary ? 'none' : `1px solid ${danger ? 'rgba(255,77,90,0.3)' : T.line2}`,
        borderRadius: 100, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontWeight: 600, fontSize: 14, letterSpacing: -0.2,
        marginTop: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Login sheet ────────────────────────────────────────────

export function LoginSheet({ onClose, onLogin, T }: { onClose: () => void; onLogin: () => void; T: ThemeColors }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      });
      if (res.ok) onLogin();
      else if (res.status === 429) setErr('Demasiadas tentativas. Tenta novamente em 15 minutos.');
      else setErr('Credenciais inválidas.');
    } catch {
      setErr('Erro de ligação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet onClose={onClose} title="Entrar" eyebrow="GJOL" T={T}>
      <div style={{ fontSize: 14, color: T.mute, lineHeight: 1.5, marginBottom: 22 }}>
        Sessão reservada à comissão organizadora.<br />
        Aqui podes lançar resultados e registar marcadores.
      </div>

      <form onSubmit={submit}>
        <Field label="Palavra-passe" T={T}>
          <Input T={T} type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(null); }} placeholder="••••••" autoFocus />
        </Field>

        {err && (
          <div style={{ marginTop: -6, marginBottom: 12, padding: '8px 12px', background: 'rgba(255,77,90,0.1)', border: '1px solid rgba(255,77,90,0.25)', borderRadius: 8, color: T.loss, fontSize: 12 }}>
            {err}
          </div>
        )}

        <Btn T={T} primary onClick={() => submit()} disabled={loading}>
          {loading ? 'A entrar…' : 'Entrar'}
        </Btn>
      </form>
    </Sheet>
  );
}

// ── Edit match sheet ───────────────────────────────────────

export function EditMatchSheet({
  match, onClose, onSave, onDelete, T,
}: {
  match: Match;
  onClose: () => void;
  onSave: (m: Match) => void;
  onDelete: () => void;
  T: ThemeColors;
}) {
  const [hs, setHs] = useState(match.hs == null ? '' : String(match.hs));
  const [as, setAs] = useState(match.as == null ? '' : String(match.as));
  const [date, setDate] = useState(match.date);
  const [time, setTime] = useState(match.time);
  const [venue, setVenue] = useState(match.venue);
  const [scorers, setScorers] = useState<FlatScorer[]>(() =>
    (match.scorers ?? []).flatMap((s) =>
      Array.from({ length: s.c }, () => ({ p: s.p, t: s.t, min: s.min ?? null }))
    )
  );
  const [adding, setAdding] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const TEAMS = useTeams();
  const PLAYERS = usePlayers();
  const h = TEAMS[match.home], a = TEAMS[match.away];
  const hsN = parseInt(hs, 10), asN = parseInt(as, 10);
  const scoreValid = !isNaN(hsN) && !isNaN(asN) && hsN >= 0 && asN >= 0;
  const scoreEmpty = hs.trim() === '' && as.trim() === '';
  const canSave = scoreValid || (!match.played && scoreEmpty);

  const homeScorers = scorers.filter((s) => s.t === match.home);
  const awayScorers = scorers.filter((s) => s.t === match.away);
  const totalGoals = homeScorers.length + awayScorers.length;
  const mismatch = scoreValid && totalGoals > 0 && (hsN !== homeScorers.length || asN !== awayScorers.length);

  function addScorer(playerId: string, teamCode: string) {
    setScorers([...scorers, { p: playerId, t: teamCode, min: null }]);
    setAdding(false);
  }
  function removeScorer(idx: number) { setScorers(scorers.filter((_, i) => i !== idx)); }

  function save() {
    if (!canSave) return;
    if (!scoreValid) {
      // Sem resultado ainda: apenas atualiza data/hora/recinto, sem marcar como jogado.
      onSave({ ...match, date, time, venue });
      return;
    }
    const m = new Map<string, { p: string; t: string; c: number; min: number | null }>();
    for (const s of scorers) {
      const key = s.p + '|' + (s.min ?? '');
      if (!m.has(key)) m.set(key, { p: s.p, t: s.t, c: 0, min: s.min });
      m.get(key)!.c += 1;
    }
    onSave({ ...match, date, time, venue, played: true, hs: hsN, as: asN, scorers: [...m.values()] });
  }

  return (
    <Sheet onClose={onClose} title={`${h.short} vs ${a.short}`} eyebrow={
      match.round
        ? ({ SF1: 'Meia-Final 1', SF2: 'Meia-Final 2', F: 'Final', '3P': '3.º/4.º Lugar' } as Record<string, string>)[match.round] ?? match.round
        : `Jornada ${match.jornada} · Grupo ${match.group}`
    } T={T}>
      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <div>
          <Eyebrow size={9} color={T.mute2} style={{ marginBottom: 6 }} T={T}>Data</Eyebrow>
          <Input T={T} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Eyebrow size={9} color={T.mute2} style={{ marginBottom: 6 }} T={T}>Hora</Eyebrow>
          <Input T={T} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <Eyebrow size={9} color={T.mute2} style={{ marginBottom: 6 }} T={T}>Recinto</Eyebrow>
        <Input T={T} value={venue} onChange={(e) => setVenue(e.target.value)} />
      </div>

      {/* Score inputs */}
      <Eyebrow size={10} color={T.mute} T={T}>Resultado</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 10, alignItems: 'center', marginTop: 12 }}>
        <ScoreSide team={match.home} score={hs} setScore={setHs} T={T} />
        <div style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: T.mute3 }}>–</div>
        <ScoreSide team={match.away} score={as} setScore={setAs} T={T} />
      </div>

      {mismatch && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,77,90,0.08)', border: '1px solid rgba(255,77,90,0.25)', borderRadius: 10, color: T.loss, fontSize: 12, lineHeight: 1.4 }}>
          O resultado <strong>{hsN}–{asN}</strong> não bate certo com os marcadores ({homeScorers.length}–{awayScorers.length}).
        </div>
      )}

      {/* Scorers */}
      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Eyebrow size={10} color={T.mute} T={T}>Marcadores</Eyebrow>
        <Eyebrow size={10} color={T.mute2} T={T}>{totalGoals} {totalGoals === 1 ? 'golo' : 'golos'}</Eyebrow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <ScorerCol
          teamCode={match.home}
          scorers={homeScorers}
          scorerIdxs={scorers.map((s, i) => (s.t === match.home ? i : -1)).filter((i) => i >= 0)}
          onRemove={removeScorer}
          T={T}
        />
        <ScorerCol
          teamCode={match.away}
          scorers={awayScorers}
          scorerIdxs={scorers.map((s, i) => (s.t === match.away ? i : -1)).filter((i) => i >= 0)}
          onRemove={removeScorer}
          T={T}
        />
      </div>

      <Btn T={T} onClick={() => setAdding(true)} style={{ marginTop: 12, background: 'transparent', border: `1px dashed ${T.lime}`, color: T.lime }}>
        + Adicionar marcador
      </Btn>

      {/* Actions */}
      <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${T.line}` }}>
        <Btn T={T} primary onClick={save} disabled={!canSave}>
          {match.played || !scoreValid ? 'Guardar alterações' : 'Lançar resultado'}
        </Btn>
        {match.played && (
          <Btn T={T} onClick={() => onSave({ ...match, played: false, hs: null, as: null, scorers: [] })}>
            Anular resultado
          </Btn>
        )}
        {!delConfirm ? (
          <Btn T={T} danger onClick={() => setDelConfirm(true)}>Eliminar jogo</Btn>
        ) : (
          <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,77,90,0.08)', border: '1px solid rgba(255,77,90,0.25)', borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: T.text, marginBottom: 10 }}>Eliminar este jogo? Não pode ser desfeito.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn T={T} onClick={() => setDelConfirm(false)} style={{ marginTop: 0, flex: 1 }}>Cancelar</Btn>
              <button
                onClick={onDelete}
                style={{ flex: 1, padding: '14px', background: T.loss, color: '#fff', border: 'none', borderRadius: 100, fontWeight: 600, fontSize: 14, letterSpacing: -0.2 }}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {adding && (
        <ScorerPicker homeTeam={match.home} awayTeam={match.away} onCancel={() => setAdding(false)} onPick={addScorer} T={T} />
      )}
    </Sheet>
  );
}

function ScoreSide({ team, score, setScore, T }: { team: string; score: string; setScore: (v: string) => void; T: ThemeColors }) {
  const TEAMS = useTeams();
  const t = TEAMS[team];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'center' }}>
        <Badge code={team} size={22} T={T} />
        <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{t.short}</div>
      </div>
      <input
        type="number" inputMode="numeric"
        value={score}
        onChange={(e) => setScore(e.target.value.replace(/[^\d]/g, ''))}
        placeholder="—"
        style={{
          width: '100%', boxSizing: 'border-box',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 42, fontWeight: 700, textAlign: 'center',
          color: T.text, background: T.surf,
          border: `1px solid ${T.line2}`, borderRadius: 14, outline: 'none',
          padding: '12px 0', letterSpacing: -1,
        }}
      />
    </div>
  );
}

function ScorerCol({ teamCode, scorers, scorerIdxs, onRemove, T }: { teamCode: string; scorers: FlatScorer[]; scorerIdxs: number[]; onRemove: (i: number) => void; T: ThemeColors }) {
  const TEAMS = useTeams();
  const PLAYERS = usePlayers();
  const t = TEAMS[teamCode];
  const agg = new Map<string, { p: string; items: { idx: number }[] }>();
  scorers.forEach((s, i) => {
    if (!agg.has(s.p)) agg.set(s.p, { p: s.p, items: [] });
    agg.get(s.p)!.items.push({ idx: scorerIdxs[i] });
  });
  return (
    <div style={{ padding: 10, background: T.surf, border: `1px solid ${T.line}`, borderRadius: 10, minHeight: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Badge code={teamCode} size={16} T={T} />
        <div className="mono" style={{ fontSize: 10, color: T.mute, letterSpacing: 0.6 }}>{t.code}</div>
      </div>
      {[...agg.values()].map((g) => {
        const p = PLAYERS[g.p];
        return (
          <div key={g.p} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: T.text, lineHeight: 1.2 }}>{p ? p.name : g.p}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {g.items.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onRemove(m.idx)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: T.limeDim, color: T.lime, border: `1px solid rgba(200,255,61,0.25)`,
                    padding: '2px 6px', borderRadius: 100,
                    fontSize: 9, letterSpacing: 0.5,
                  }}
                >
                  <span className="mono">● ✕</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {agg.size === 0 && <div style={{ fontSize: 11, color: T.mute2 }}>—</div>}
    </div>
  );
}

function ScorerPicker({ homeTeam, awayTeam, onCancel, onPick, T }: { homeTeam: string; awayTeam: string; onCancel: () => void; onPick: (playerId: string, teamCode: string) => void; T: ThemeColors }) {
  const TEAMS = useTeams();
  const PLAYERS = usePlayers();
  const [team, setTeam] = useState(homeTeam);
  const players = Object.values(PLAYERS).filter((p) => p.team === team);

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.scrim, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 60, animation: 'fadeIn 160ms ease' }}>
      <div onClick={onCancel} style={{ flex: 1, width: '100%' }} />
      <div
        className="sheet-panel"
        style={{
          background: T.bg2, padding: '14px 20px 22px',
          animation: 'slideUp 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          borderTop: `1px solid ${T.line2}`,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LiveDot color={T.lime} T={T} />
            <Eyebrow size={10} color={T.lime} T={T}>Adicionar marcador</Eyebrow>
          </div>
          <button onClick={onCancel} style={{ background: T.surf, border: `1px solid ${T.line2}`, color: T.mute, width: 28, height: 28, borderRadius: 100, padding: 0 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 4, background: T.surf, borderRadius: 100, border: `1px solid ${T.line}` }}>
          {[homeTeam, awayTeam].map((tc) => {
            const active = team === tc;
            return (
              <button
                key={tc}
                onClick={() => setTeam(tc)}
                style={{
                  flex: 1, padding: '8px 10px',
                  background: active ? T.lime : 'transparent',
                  color: active ? T.bg : T.mute,
                  border: 'none', borderRadius: 100,
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                }}
              >
                <Badge code={tc} size={14} T={T} />
                {TEAMS[tc]?.short}
              </button>
            );
          })}
        </div>

        <div style={{ maxHeight: 240, overflowY: 'auto' }} className="scroll-hide">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id, team)}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', gap: 12,
                padding: '12px 8px', background: 'transparent',
                border: 'none', borderBottom: `1px solid ${T.line}`, textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: T.text, flex: 1 }}>{p.name}</div>
              <div style={{ color: T.lime, fontSize: 12, fontWeight: 600 }}>+ golo</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Add match sheet ────────────────────────────────────────

export function AddMatchSheet({ onClose, onAdd, suggestedJornada, T }: { onClose: () => void; onAdd: (m: Match) => void; suggestedJornada: number; T: ThemeColors }) {
  const TEAMS = useTeams();
  const [group, setGroup] = useState<'A' | 'B'>('A');
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [date, setDate] = useState('2026-05-25');
  const [time, setTime] = useState('17:00');
  const [venue, setVenue] = useState('Saibreira');
  const [jornada, setJornada] = useState(String(suggestedJornada || 4));

  const teams = Object.values(TEAMS).filter((t) => t.group === group);
  const canSave = home && away && home !== away && date && time && venue && jornada;

  function submit() {
    if (!canSave) return;
    onAdd({
      id: 'm_' + Math.random().toString(36).slice(2, 8),
      jornada: parseInt(jornada, 10) || 1,
      group, round: null, date, time, home, away, venue,
      played: false, hs: null, as: null, scorers: [],
    });
  }

  return (
    <Sheet onClose={onClose} title="Novo jogo" eyebrow="Adicionar partida" T={T}>
      <Field label="Grupo" T={T}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: T.surf, borderRadius: 100, border: `1px solid ${T.line}` }}>
          {(['A', 'B'] as const).map((g) => (
            <button
              key={g}
              onClick={() => { setGroup(g); setHome(''); setAway(''); }}
              style={{
                flex: 1, padding: '8px',
                background: group === g ? T.lime : 'transparent',
                color: group === g ? T.bg : T.mute,
                border: 'none', borderRadius: 100,
                fontWeight: 600, fontSize: 13,
              }}
            >
              Grupo {g}
            </button>
          ))}
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Casa" T={T}>
          <Select2 value={home} teams={teams.filter((t) => t.code !== away)} onChange={setHome} T={T} />
        </Field>
        <Field label="Visitante" T={T}>
          <Select2 value={away} teams={teams.filter((t) => t.code !== home)} onChange={setAway} T={T} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
        <Field label="Data" T={T}>
          <Input T={T} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hora" T={T}>
          <Input T={T} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <Field label="Jornada" T={T}>
        <Input T={T} type="number" min="1" value={jornada} onChange={(e) => setJornada(e.target.value)} />
      </Field>
      <Field label="Recinto" T={T}>
        <Input T={T} value={venue} onChange={(e) => setVenue(e.target.value)} />
      </Field>

      <Btn T={T} primary onClick={submit} disabled={!canSave}>Adicionar jogo</Btn>
    </Sheet>
  );
}

function Select2({ value, teams, onChange, T }: { value: string; teams: { code: string; name: string }[]; onChange: (v: string) => void; T: ThemeColors }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '12px 14px',
        background: T.surf, color: value ? T.text : T.mute2,
        border: `1px solid ${T.line2}`, borderRadius: 10,
        outline: 'none', fontSize: 14,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M0 0l5 6 5-6z' fill='%23a3aaa0'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: 32,
      }}
    >
      <option value="">— equipa —</option>
      {teams.map((t) => (
        <option key={t.code} value={t.code}>{t.name}</option>
      ))}
    </select>
  );
}
