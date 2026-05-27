import { PLAYERS, TEAMS } from './data';
import type { KOSlot, Match, Player, StandingRow, Team, TopScorer } from './types';

const WD = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDateLong(iso: string): string {
  const d = parseISO(iso);
  return `${WD[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MO[d.getMonth()]}`;
}

export function fmtDateShort(iso: string): string {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function weekday(iso: string): string {
  return WD[parseISO(iso).getDay()];
}

export function computeStandings(group: 'A' | 'B', matches: Match[], teamsMap: Record<string, Team> = TEAMS): StandingRow[] {
  const teams = Object.values(teamsMap).filter((t) => t.group === group);
  const rows: StandingRow[] = teams.map((t) => ({
    code: t.code, name: t.name, short: t.short,
    J: 0, V: 0, E: 0, D: 0, GM: 0, GS: 0, DG: 0, PTS: 0, form: [],
  }));
  const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));

  for (const m of matches) {
    if (!m.played || m.group !== group) continue;
    const h = byCode[m.home], a = byCode[m.away];
    if (!h || !a) continue;
    h.J++; a.J++;
    h.GM += m.hs!; h.GS += m.as!;
    a.GM += m.as!; a.GS += m.hs!;
    if (m.hs! > m.as!) {
      h.V++; a.D++; h.PTS += 3; h.form.push('V'); a.form.push('D');
    } else if (m.hs! < m.as!) {
      a.V++; h.D++; a.PTS += 3; h.form.push('D'); a.form.push('V');
    } else {
      h.E++; a.E++; h.PTS += 1; a.PTS += 1; h.form.push('E'); a.form.push('E');
    }
  }

  rows.forEach((r) => (r.DG = r.GM - r.GS));
  rows.sort(
    (a, b) =>
      b.PTS - a.PTS ||
      b.DG - a.DG ||
      b.GM - a.GM ||
      a.name.localeCompare(b.name)
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Fase Final helpers
// ---------------------------------------------------------------------------

export type TournamentPhase = 'group' | 'knockout';

/** A fase é knockout se existir pelo menos um jogo KO na BD. */
export function detectPhase(matches: Match[]): TournamentPhase {
  return matches.some((m) => m.round !== null) ? 'knockout' : 'group';
}

/**
 * True quando o admin pode gerar a fase final:
 * todos os jogos de grupo disputados E nenhum jogo KO ainda criado.
 */
export function canGenerateKO(matches: Match[]): boolean {
  const group = matches.filter((m) => m.group !== null);
  const ko    = matches.filter((m) => m.round !== null);
  return group.length > 0 && group.every((m) => m.played) && ko.length === 0;
}

/**
 * True quando o admin pode gerar a Final e o 3º/4º lugar:
 * SF1 e SF2 disputados E Final ainda não existe.
 */
export function canGenerateFinals(matches: Match[]): boolean {
  const sf1 = matches.find((m) => m.round === 'SF1');
  const sf2 = matches.find((m) => m.round === 'SF2');
  const f   = matches.find((m) => m.round === 'F');
  return !!(sf1?.played && sf2?.played && !f);
}

export interface BracketData {
  sf1Match: Match | null;
  sf2Match: Match | null;
  fMatch:   Match | null;
  tpMatch:  Match | null;
  sf1Home: KOSlot;
  sf1Away: KOSlot;
  sf2Home: KOSlot;
  sf2Away: KOSlot;
  fHome:   KOSlot;
  fAway:   KOSlot;
  tpHome:  KOSlot;
  tpAway:  KOSlot;
}

/** Deriva a estrutura completa do bracket a partir dos jogos e standings. */
export function buildBracket(matches: Match[], teamsMap: Record<string, Team> = TEAMS): BracketData {
  const sf1 = matches.find((m) => m.round === 'SF1') ?? null;
  const sf2 = matches.find((m) => m.round === 'SF2') ?? null;
  const f   = matches.find((m) => m.round === 'F')   ?? null;
  const tp  = matches.find((m) => m.round === '3P')  ?? null;

  const standA = computeStandings('A', matches, teamsMap);
  const standB = computeStandings('B', matches, teamsMap);

  const shortOf = (code: string | null) => (code && teamsMap[code] ? teamsMap[code].short : code ?? '?');

  // SF1: 1º A vs 2º B
  const sf1Home: KOSlot = sf1
    ? { code: sf1.home, label: `1º Gr. A · ${shortOf(sf1.home)}` }
    : standA[0]
      ? { code: standA[0].code, label: `1º Gr. A · ${standA[0].short}` }
      : { code: null, label: '1º Grupo A' };

  const sf1Away: KOSlot = sf1
    ? { code: sf1.away, label: `2º Gr. B · ${shortOf(sf1.away)}` }
    : standB[1]
      ? { code: standB[1].code, label: `2º Gr. B · ${standB[1].short}` }
      : { code: null, label: '2º Grupo B' };

  // SF2: 1º B vs 2º A
  const sf2Home: KOSlot = sf2
    ? { code: sf2.home, label: `1º Gr. B · ${shortOf(sf2.home)}` }
    : standB[0]
      ? { code: standB[0].code, label: `1º Gr. B · ${standB[0].short}` }
      : { code: null, label: '1º Grupo B' };

  const sf2Away: KOSlot = sf2
    ? { code: sf2.away, label: `2º Gr. A · ${shortOf(sf2.away)}` }
    : standA[1]
      ? { code: standA[1].code, label: `2º Gr. A · ${standA[1].short}` }
      : { code: null, label: '2º Grupo A' };

  // Final: vencedores das MF
  const fHome: KOSlot = f
    ? { code: f.home, label: `Venc. SF1 · ${shortOf(f.home)}` }
    : { code: null, label: 'Vencedor SF1' };

  const fAway: KOSlot = f
    ? { code: f.away, label: `Venc. SF2 · ${shortOf(f.away)}` }
    : { code: null, label: 'Vencedor SF2' };

  // 3º/4º: perdedores das MF
  const tpHome: KOSlot = tp
    ? { code: tp.home, label: `Perd. SF1 · ${shortOf(tp.home)}` }
    : { code: null, label: 'Perdedor SF1' };

  const tpAway: KOSlot = tp
    ? { code: tp.away, label: `Perd. SF2 · ${shortOf(tp.away)}` }
    : { code: null, label: 'Perdedor SF2' };

  return { sf1Match: sf1, sf2Match: sf2, fMatch: f, tpMatch: tp, sf1Home, sf1Away, sf2Home, sf2Away, fHome, fAway, tpHome, tpAway };
}

// ---------------------------------------------------------------------------

export function computeTopScorers(matches: Match[], playersMap: Record<string, Player> = PLAYERS): TopScorer[] {
  const map = new Map<string, number>();
  for (const m of matches) {
    if (!m.played) continue;
    for (const s of m.scorers ?? []) {
      map.set(s.p, (map.get(s.p) ?? 0) + s.c);
    }
  }
  const out: TopScorer[] = [...map.entries()]
    .map(([p, c]) => ({ player: playersMap[p], count: c }))
    .filter((x) => x.player != null);
  out.sort((a, b) => b.count - a.count || a.player.name.localeCompare(b.player.name));
  return out;
}
