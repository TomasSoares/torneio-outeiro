'use client';

import { useState, useMemo } from 'react';
import type { Match, StandingRow } from '@/lib/types';
import type { ThemeColors } from '@/lib/theme';
import { computeStandings, computeTopScorers, computeBestDefense } from '@/lib/helpers';
import { useTeams, usePlayers } from '@/lib/context';
import { Badge, Eyebrow, LiveDot, Pill } from './primitives';

interface Props { matches: Match[]; T: ThemeColors; }

export function StandingsPage({ matches, T }: Props) {
  const [tab, setTab] = useState<'table' | 'scorers' | 'defense'>('table');

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }} className="scroll-hide">
      {/* Sub-tabs */}
      <div style={{ display: 'flex', padding: '14px 20px', gap: 18, borderBottom: `1px solid ${T.line}` }}>
        {([{ id: 'table', label: 'Classificação' }, { id: 'scorers', label: 'Marcadores' }, { id: 'defense', label: 'Melhor Defesa' }] as const).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ background: 'transparent', border: 'none', padding: 0, position: 'relative', paddingBottom: 6 }}
            >
              <div style={{ fontSize: 16, fontWeight: active ? 600 : 500, color: active ? T.text : T.mute, letterSpacing: -0.2 }}>
                {t.label}
              </div>
              {active && (
                <div style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 2, background: T.lime, borderRadius: 2 }} />
              )}
            </button>
          );
        })}
      </div>

      {tab === 'table' ? (
        <StandingsTab matches={matches} T={T} />
      ) : tab === 'scorers' ? (
        <ScorersTab matches={matches} T={T} />
      ) : (
        <DefenseTab matches={matches} T={T} />
      )}
    </div>
  );
}

function StandingsTab({ matches, T }: { matches: Match[]; T: ThemeColors }) {
  const teams = useTeams();
  const rows = useMemo(() => computeStandings(matches, teams), [matches, teams]);
  const played = matches.filter((m) => m.played).length;
  const total  = matches.length;

  return (
    <div>
      <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow size={10} color={T.mute} T={T}>Classificação</Eyebrow>
        <Eyebrow size={10} color={T.mute2} T={T}>{played}/{total} jogos</Eyebrow>
      </div>

      {/* Column header + rows share the same outer padding */}
      <div style={{ padding: '0 16px' }}>
        <div className="standings-row" style={{ padding: '6px 10px', display: 'grid', gap: 6, alignItems: 'center' }}>
          <div /><div />
          {['V', 'E', 'D', 'GM', 'GS', 'DG', 'PTS'].map((h) => (
            <div key={h} className="mono" style={{ fontSize: 9, fontWeight: 500, color: T.mute2, textAlign: 'center', letterSpacing: 0.8 }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            key={r.code}
            className="standings-row"
            style={{
              padding: '12px 10px', marginBottom: 6,
              display: 'grid',
              gap: 6, alignItems: 'center',
              background: T.surf, borderRadius: 12,
              border: `1px solid ${T.line}`,
              position: 'relative',
            }}
          >
            <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: T.mute, textAlign: 'center' }}>{i + 1}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Badge code={r.code} size={24} T={T} />
              <div style={{ fontWeight: 600, fontSize: 13, color: T.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {r.short}
              </div>
            </div>
            {(['V', 'E', 'D', 'GM', 'GS'] as const).map((k) => (
              <div key={k} className="mono" style={{ fontSize: 13, fontWeight: 500, color: T.mute, textAlign: 'center' }}>{r[k]}</div>
            ))}
            <div className="mono" style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', color: r.DG > 0 ? T.lime : r.DG < 0 ? T.loss : T.mute }}>
              {r.DG > 0 ? '+' + r.DG : r.DG}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', color: T.text, letterSpacing: -0.5 }}>{r.PTS}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScorersTab({ matches, T }: { matches: Match[]; T: ThemeColors }) {
  const teams = useTeams();
  const players = usePlayers();
  const list = useMemo(() => computeTopScorers(matches, players), [matches, players]);
  const top = list[0];
  const maxGoals = top?.count ?? 1;

  return (
    <div style={{ padding: '18px 16px 30px' }}>
      <div style={{ padding: '0 4px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow size={10} color={T.mute} T={T}>Melhor Marcador</Eyebrow>
        <Eyebrow size={10} color={T.mute2} T={T}>{list.reduce((s, x) => s + x.count, 0)} golos</Eyebrow>
      </div>

      {top && <TopScorerCard scorer={top} T={T} />}

      <div style={{ marginTop: 18 }}>
        {list.slice(1).map((s, i) => {
          const team = teams[s.player.team];
          return (
            <div
              key={s.player.id}
              style={{
                display: 'grid', gridTemplateColumns: '24px 28px 1fr auto',
                gap: 12, alignItems: 'center',
                padding: '14px 6px', borderBottom: `1px solid ${T.line}`,
              }}
            >
              <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: T.mute2, textAlign: 'center' }}>
                {String(i + 2).padStart(2, '0')}
              </div>
              <Badge code={s.player.team} size={26} T={T} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.player.name}
                </div>
                <div style={{ marginTop: 4 }}>
                  <div className="mono" style={{ fontSize: 9, color: T.mute2, letterSpacing: 0.6 }}>{team.code}</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text, minWidth: 26, textAlign: 'right', letterSpacing: -0.5 }}>{s.count}</div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: T.mute2, fontSize: 13 }}>
            Sem golos registados.
          </div>
        )}
      </div>
    </div>
  );
}

function DefenseTab({ matches, T }: { matches: Match[]; T: ThemeColors }) {
  const teams = useTeams();
  const rows = useMemo(() => computeBestDefense(matches, teams), [matches, teams]);
  const top = rows[0];

  return (
    <div style={{ padding: '18px 16px 30px' }}>
      <div style={{ padding: '0 4px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow size={10} color={T.mute} T={T}>Melhor Defesa</Eyebrow>
        <Eyebrow size={10} color={T.mute2} T={T}>{rows.reduce((s, r) => s + r.GS, 0)} golos sofridos</Eyebrow>
      </div>

      {top && <BestDefenseCard row={top} T={T} />}

      <div style={{ marginTop: 18 }}>
        {rows.slice(1).map((r, i) => (
          <div
            key={r.code}
            style={{
              display: 'grid', gridTemplateColumns: '24px 28px 1fr auto',
              gap: 12, alignItems: 'center',
              padding: '14px 6px', borderBottom: `1px solid ${T.line}`,
            }}
          >
            <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: T.mute2, textAlign: 'center' }}>
              {String(i + 2).padStart(2, '0')}
            </div>
            <Badge code={r.code} size={26} T={T} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}
              </div>
              <div style={{ marginTop: 4 }}>
                <div className="mono" style={{ fontSize: 9, color: T.mute2, letterSpacing: 0.6 }}>{r.J} {r.J === 1 ? 'jogo' : 'jogos'}</div>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, minWidth: 26, textAlign: 'right', letterSpacing: -0.5 }}>{r.GS}</div>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: T.mute2, fontSize: 13 }}>
            Ainda sem jogos disputados.
          </div>
        )}
      </div>
    </div>
  );
}

function BestDefenseCard({ row, T }: { row: StandingRow; T: ThemeColors }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: T.surf, border: `1px solid ${T.line}`, borderRadius: 16, padding: 18 }}>
      <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, background: `radial-gradient(circle, ${T.lime}33 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LiveDot color={T.lime} T={T} />
            <Eyebrow size={9} color={T.lime} T={T}>Líder</Eyebrow>
          </div>
          <div style={{ fontWeight: 700, fontSize: 24, color: T.text, marginTop: 10, letterSpacing: -0.8, lineHeight: 1 }}>
            {row.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Badge code={row.code} size={22} T={T} />
            <div style={{ fontSize: 13, color: T.mute }}>{row.J} {row.J === 1 ? 'jogo' : 'jogos'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 64, color: T.lime, letterSpacing: -3, lineHeight: 0.85 }}>{row.GS}</div>
          <Eyebrow size={9} color={T.mute} style={{ marginTop: 4 }} T={T}>{row.GS === 1 ? 'golo sofrido' : 'golos sofridos'}</Eyebrow>
        </div>
      </div>
    </div>
  );
}

function TopScorerCard({ scorer, T }: { scorer: { player: { id: string; name: string; team: string }; count: number }; T: ThemeColors }) {
  const teams = useTeams();
  const team = teams[scorer.player.team];
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: T.surf, border: `1px solid ${T.line}`, borderRadius: 16, padding: 18 }}>
      <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, background: `radial-gradient(circle, ${T.lime}33 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LiveDot color={T.lime} T={T} />
            <Eyebrow size={9} color={T.lime} T={T}>Líder</Eyebrow>
          </div>
          <div style={{ fontWeight: 700, fontSize: 24, color: T.text, marginTop: 10, letterSpacing: -0.8, lineHeight: 1 }}>
            {scorer.player.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Badge code={scorer.player.team} size={22} T={T} />
            <div style={{ fontSize: 13, color: T.mute }}>{team.name}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 64, color: T.lime, letterSpacing: -3, lineHeight: 0.85 }}>{scorer.count}</div>
          <Eyebrow size={9} color={T.mute} style={{ marginTop: 4 }} T={T}>{scorer.count === 1 ? 'golo' : 'golos'}</Eyebrow>
        </div>
      </div>
    </div>
  );
}
