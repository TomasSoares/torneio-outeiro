'use client';

import { useMemo } from 'react';
import type { Match } from '@/lib/types';
import type { ThemeColors } from '@/lib/theme';
import { useTeams } from '@/lib/context';
import { fmtDateLong, fmtDateShort, weekday } from '@/lib/helpers';
import { Badge, Eyebrow, LiveDot, Pill } from './primitives';

interface Props {
  matches: Match[];
  isAdmin: boolean;
  onEditMatch: (id: string) => void;
  onAddMatch: () => void;
  T: ThemeColors;
}

export function CalendarPage({ matches, isAdmin, onEditMatch, onAddMatch, T }: Props) {
  const jornadas = useMemo(() => [...new Set(matches.map((m) => m.jornada))].sort((a, b) => a - b), [matches]);
  const nextMatch = useMemo(() => matches.find((m) => !m.played), [matches]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg, paddingBottom: 30 }} className="scroll-hide">
      {nextMatch && <NextMatchCard match={nextMatch} T={T} />}

      <div style={{ padding: '6px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow size={10} color={T.mute} T={T}>Jornadas</Eyebrow>
        <Eyebrow size={10} color={T.mute2} T={T}>
          {matches.filter((m) => m.played).length}/{matches.length} jogos disputados
        </Eyebrow>
      </div>

      {jornadas.map((num) => (
        <Jornada
          key={num}
          num={num}
          matches={matches.filter((m) => m.jornada === num)}
          isAdmin={isAdmin}
          onEditMatch={onEditMatch}
          T={T}
        />
      ))}

      {isAdmin && (
        <div style={{ padding: '18px 20px 0' }}>
          <button
            onClick={onAddMatch}
            style={{
              width: '100%', padding: '14px',
              background: T.lime, color: T.bg,
              border: 'none', borderRadius: 100,
              fontWeight: 600, fontSize: 14, letterSpacing: -0.2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Adicionar jogo
          </button>
        </div>
      )}
    </div>
  );
}

function NextMatchCard({ match, T }: { match: Match; T: ThemeColors }) {
  const teams = useTeams();
  const h = teams[match.home], a = teams[match.away];
  if (!h || !a) return null;
  return (
    <div style={{ padding: '18px 16px 8px' }}>
      <div
        style={{
          position: 'relative', overflow: 'hidden',
          background: T.surf, border: `1px solid ${T.line2}`,
          borderRadius: 18, padding: 18,
        }}
      >
        <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: `radial-gradient(circle, ${T.lime}1f 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LiveDot color={T.lime} T={T} />
              <Eyebrow size={9} color={T.lime} T={T}>Próximo</Eyebrow>
            </div>
            <Pill color={T.mute} bg={T.surf2} T={T}>J{match.jornada} · Gr. {match.group}</Pill>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginTop: 22, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Badge code={match.home} size={48} T={T} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10, letterSpacing: -0.2 }}>{h.short}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 6px' }}>
              <div className="mono" style={{ fontSize: 11, color: T.mute, letterSpacing: 1 }}>
                {weekday(match.date)} {fmtDateShort(match.date)}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.text, marginTop: 6, letterSpacing: -1 }}>{match.time}</div>
              <div style={{ width: 24, height: 2, background: T.lime, margin: '8px auto 0', borderRadius: 1 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <Badge code={match.away} size={48} T={T} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10, letterSpacing: -0.2 }}>{a.short}</div>
            </div>
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: 10, color: T.mute2, letterSpacing: 1 }}>
              <span style={{ color: T.mute }}>◉</span> {match.venue}
            </div>
            <div className="mono" style={{ fontSize: 10, color: T.mute2, letterSpacing: 1 }}>{fmtDateLong(match.date)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Jornada({ num, matches, isAdmin, onEditMatch, T }: { num: number; matches: Match[]; isAdmin: boolean; onEditMatch: (id: string) => void; T: ThemeColors }) {
  const date = matches[0]?.date;
  const allPlayed = matches.every((m) => m.played);
  return (
    <div style={{ marginTop: 20, padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: T.text, letterSpacing: -0.8 }}>Jornada {num}</div>
          {!allPlayed && <Pill color={T.lime} bg={T.limeDim} T={T}>por jogar</Pill>}
        </div>
        <Eyebrow size={10} color={T.mute2} T={T}>{date ? fmtDateLong(date) : ''}</Eyebrow>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} isAdmin={isAdmin} onEdit={() => onEditMatch(m.id)} T={T} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, isAdmin, onEdit, T }: { match: Match; isAdmin: boolean; onEdit: () => void; T: ThemeColors }) {
  const played = match.played;
  const homeWin = played && match.hs! > match.as!;
  const awayWin = played && match.as! > match.hs!;

  return (
    <div
      onClick={isAdmin ? onEdit : undefined}
      style={{
        padding: '14px', background: T.surf,
        border: `1px solid ${T.line}`, borderRadius: 12,
        cursor: isAdmin ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="mono" style={{ fontSize: 10, color: T.mute2, letterSpacing: 0.8 }}>
          {match.time} · Gr. {match.group}
        </div>
        {played ? (
          <Pill color={T.mute2} bg="transparent" style={{ padding: '2px 0', border: 'none' }} T={T}>final</Pill>
        ) : (
          <Pill color={T.lime} bg={T.limeDim} T={T}>vs</Pill>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TeamLine code={match.home} winner={homeWin} dimmed={played && !homeWin && match.hs! < match.as!} T={T} />
          <TeamLine code={match.away} winner={awayWin} dimmed={played && !awayWin && match.as! < match.hs!} T={T} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', paddingLeft: 10, borderLeft: `1px solid ${T.line}` }}>
          {played ? (
            <>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: homeWin ? T.text : T.mute, lineHeight: 1 }}>{match.hs}</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: awayWin ? T.text : T.mute, lineHeight: 1 }}>{match.as}</div>
            </>
          ) : (
            <div className="mono" style={{ fontSize: 12, color: T.mute2, textAlign: 'center', letterSpacing: 0.5 }}>{fmtDateShort(match.date)}</div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow size={9} color={T.mute2} T={T}>toca para {played ? 'editar' : 'lançar resultado'}</Eyebrow>
          <div style={{ color: T.lime, fontSize: 14, fontWeight: 600 }}>›</div>
        </div>
      )}
    </div>
  );
}

function TeamLine({ code, winner, dimmed, T }: { code: string; winner: boolean; dimmed: boolean; T: ThemeColors }) {
  const teams = useTeams();
  const team = teams[code];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Badge code={code} size={22} T={T} />
      <div style={{ fontSize: 14, fontWeight: winner ? 600 : 500, color: dimmed ? T.mute : T.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {team?.name ?? code}
      </div>
    </div>
  );
}
