'use client';

import { useMemo } from 'react';
import type { Match, KOSlot } from '@/lib/types';
import type { ThemeColors } from '@/lib/theme';
import { useTeams } from '@/lib/context';
import { buildBracket, canGenerateKO, canGenerateFinals, fmtDateShort, fmtDateLong, weekday } from '@/lib/helpers';
import { Badge, Eyebrow, Pill } from './primitives';

const ROUND_LABELS: Record<string, string> = {
  SF1: 'Meia-Final 1',
  SF2: 'Meia-Final 2',
  F:   'Final',
  '3P': '3.º/4.º Lugar',
};

interface Props {
  matches: Match[];
  isAdmin: boolean;
  onEditMatch: (id: string) => void;
  onGenerateKO: () => void;
  onGenerateFinals: () => void;
  T: ThemeColors;
}

export function BracketPage({ matches, isAdmin, onEditMatch, onGenerateKO, onGenerateFinals, T }: Props) {
  const teams = useTeams();
  const bracket = useMemo(() => buildBracket(matches, teams), [matches, teams]);

  const showGenerateKO     = isAdmin && !matches.some((m) => m.round !== null); // TODO: restaurar canGenerateKO(matches)
  const showGenerateFinals = isAdmin && canGenerateFinals(matches);

  // Has any KO match been generated yet?
  const hasKO = matches.some((m) => m.round !== null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg, paddingBottom: 40 }} className="scroll-hide">
      {/* Header */}
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow size={10} color={T.mute} T={T}>Fase Final</Eyebrow>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.8, marginTop: 4 }}>
            Eliminatórias
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 100,
          background: T.limeDim, border: `1px solid ${T.lime}44`,
          color: T.lime, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
          fontFamily: 'monospace',
        }}>
          ELIMINATÓRIAS
        </div>
      </div>

      {/* Admin: gerar fase final */}
      {showGenerateKO && (
        <div style={{ padding: '0 20px 16px' }}>
          <button
            onClick={onGenerateKO}
            style={{
              width: '100%', padding: 14,
              background: T.lime, color: T.bg,
              border: 'none', borderRadius: 100,
              fontWeight: 600, fontSize: 14, letterSpacing: -0.2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            Gerar Fase Final
          </button>
          <div style={{ marginTop: 8, fontSize: 12, color: T.mute2, textAlign: 'center' }}>
            Irá criar as meias-finais com base na classificação dos grupos
          </div>
        </div>
      )}

      {/* Se não há jogos KO ainda e o admin não pode gerar (nem todos disputados) */}
      {!hasKO && !showGenerateKO && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>

          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>
            Fase de grupos em curso
          </div>
          <div style={{ fontSize: 13, color: T.mute, marginTop: 6, lineHeight: 1.5 }}>
            A fase final será disponibilizada quando todos os jogos de grupo estiverem disputados
          </div>
        </div>
      )}

      {/* Bracket */}
      {hasKO && (
        <>
          <div className="bracket-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
            {/* Final e 3º/4º — aparecem primeiro quando existem */}
            {(bracket.fMatch || bracket.tpMatch || showGenerateFinals) && (
              <div>
                <Eyebrow size={9} color={T.mute3} style={{ paddingLeft: 4, paddingBottom: 8 }} T={T}>
                  Fase Final
                </Eyebrow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <BracketMatchCard
                    match={bracket.fMatch}
                    home={bracket.fHome}
                    away={bracket.fAway}
                    label="Final"
                    isAdmin={isAdmin}
                    onEdit={bracket.fMatch ? () => onEditMatch(bracket.fMatch!.id) : undefined}
                    T={T}
                    highlight
                  />
                  <BracketMatchCard
                    match={bracket.tpMatch}
                    home={bracket.tpHome}
                    away={bracket.tpAway}
                    label="3.º/4.º Lugar"
                    isAdmin={isAdmin}
                    onEdit={bracket.tpMatch ? () => onEditMatch(bracket.tpMatch!.id) : undefined}
                    T={T}
                  />
                </div>
              </div>
            )}

            {/* Admin: gerar Final */}
            {showGenerateFinals && (
              <button
                onClick={onGenerateFinals}
                style={{
                  width: '100%', padding: 14,
                  background: T.lime, color: T.bg,
                  border: 'none', borderRadius: 100,
                  fontWeight: 600, fontSize: 14, letterSpacing: -0.2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer',
                }}
              >
                Gerar Final e 3.º/4.º Lugar
              </button>
            )}

            {/* Meias-finais */}
            <div>
              <Eyebrow size={9} color={T.mute3} style={{ paddingLeft: 4, paddingBottom: 8 }} T={T}>
                Meias-Finais
              </Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <BracketMatchCard
                  match={bracket.sf1Match}
                  home={bracket.sf1Home}
                  away={bracket.sf1Away}
                  label="Meia-Final 1"
                  isAdmin={isAdmin}
                  onEdit={bracket.sf1Match ? () => onEditMatch(bracket.sf1Match!.id) : undefined}
                  T={T}
                />
                <BracketMatchCard
                  match={bracket.sf2Match}
                  home={bracket.sf2Home}
                  away={bracket.sf2Away}
                  label="Meia-Final 2"
                  isAdmin={isAdmin}
                  onEdit={bracket.sf2Match ? () => onEditMatch(bracket.sf2Match!.id) : undefined}
                  T={T}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BracketMatchCard
// ---------------------------------------------------------------------------

function BracketMatchCard({
  match, home, away, label, isAdmin, onEdit, T, highlight = false,
}: {
  match: Match | null;
  home: KOSlot;
  away: KOSlot;
  label: string;
  isAdmin: boolean;
  onEdit?: () => void;
  T: ThemeColors;
  highlight?: boolean;
}) {
  const played  = match?.played ?? false;
  const homeWin = played && match!.hs! > match!.as!;
  const awayWin = played && match!.as! > match!.hs!;
  const isDraw  = played && match!.hs === match!.as;

  const isClickable = isAdmin && !!match;

  return (
    <div
      onClick={isClickable ? onEdit : undefined}
      style={{
        padding: 16,
        background: highlight ? (played ? T.surf : `linear-gradient(135deg, ${T.surf}, ${T.limeDim}22)`) : T.surf,
        border: `1px solid ${highlight ? T.lime + '55' : played ? T.line2 : T.line}`,
        borderRadius: 14,
        cursor: isClickable ? 'pointer' : 'default',
        opacity: match ? 1 : 0.5,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle highlight glow for Final */}
      {highlight && !played && (
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 100, height: 100,
          background: `radial-gradient(circle, ${T.lime}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: highlight ? T.lime : T.mute, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </div>
        {played ? (
          <span style={{ fontSize: 10, color: T.mute2, fontFamily: 'monospace', letterSpacing: 0.5 }}>FINAL</span>
        ) : match ? (
          <Pill color={T.lime} bg={T.limeDim} T={T}>vs</Pill>
        ) : (
          <span style={{ fontSize: 10, color: T.mute3, fontFamily: 'monospace' }}>A DEFINIR</span>
        )}
      </div>

      {/* Teams + Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: 10, alignItems: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <KOTeamLine slot={home} winner={homeWin} dimmed={played && !homeWin} T={T} />
          <KOTeamLine slot={away} winner={awayWin} dimmed={played && !awayWin} T={T} />
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          alignItems: 'center', justifyContent: 'center',
          paddingLeft: 10, borderLeft: `1px solid ${T.line}`,
          minHeight: 60,
        }}>
          {played ? (
            <>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: homeWin ? T.text : T.mute, lineHeight: 1 }}>{match!.hs}</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: awayWin ? T.text : T.mute, lineHeight: 1 }}>{match!.as}</div>
              {isDraw && <div style={{ fontSize: 9, color: T.mute3, textAlign: 'center', letterSpacing: 0.5 }}>EMPATE</div>}
            </>
          ) : match ? (
            <div className="mono" style={{ fontSize: 11, color: T.mute2, textAlign: 'center', lineHeight: 1.4 }}>
              {fmtDateShort(match.date)}<br />
              <span style={{ color: T.mute3 }}>{match.time}</span>
            </div>
          ) : (
            <div className="mono" style={{ fontSize: 16, color: T.mute3, lineHeight: 1 }}>—</div>
          )}
        </div>
      </div>

      {/* Admin hint */}
      {isClickable && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow size={9} color={T.mute2} T={T}>toca para {played ? 'editar' : 'lançar resultado'}</Eyebrow>
          <div style={{ color: T.lime, fontSize: 14, fontWeight: 600 }}>›</div>
        </div>
      )}

      {/* Venue & date if match exists */}
      {match && !isAdmin && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mono" style={{ fontSize: 10, color: T.mute2, letterSpacing: 0.5 }}>
            <span style={{ color: T.mute }}>◉</span> {match.venue}
          </div>
          <div className="mono" style={{ fontSize: 10, color: T.mute2 }}>{fmtDateLong(match.date)}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KOTeamLine
// ---------------------------------------------------------------------------

function KOTeamLine({ slot, winner, dimmed, T }: { slot: KOSlot; winner: boolean; dimmed: boolean; T: ThemeColors }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {slot.code ? (
        <Badge code={slot.code} size={24} T={T} />
      ) : (
        <div style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          border: `1.5px dashed ${T.mute3}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} />
      )}
      <div style={{
        fontSize: 13, fontWeight: winner ? 700 : 500,
        color: dimmed ? T.mute3 : slot.code ? T.text : T.mute2,
        letterSpacing: -0.2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {slot.label}
      </div>
    </div>
  );
}

// Export round labels for use in other components
export { ROUND_LABELS };
