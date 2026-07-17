import { PLAYERS, TEAMS } from './data';
import type { Match, Player, StandingRow, Team, TopScorer } from './types';

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

export function computeStandings(matches: Match[], teamsMap: Record<string, Team> = TEAMS): StandingRow[] {
  const teams = Object.values(teamsMap);
  const rows: StandingRow[] = teams.map((t) => ({
    code: t.code, name: t.name, short: t.short,
    J: 0, V: 0, E: 0, D: 0, GM: 0, GS: 0, DG: 0, PTS: 0, form: [],
  }));
  const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));

  for (const m of matches) {
    if (!m.played) continue;
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

/** Ranking de melhor defesa: menos golos sofridos primeiro (só equipas com jogos disputados). */
export function computeBestDefense(matches: Match[], teamsMap: Record<string, Team> = TEAMS): StandingRow[] {
  const rows = computeStandings(matches, teamsMap).filter((r) => r.J > 0);
  return rows.sort((a, b) => a.GS - b.GS || b.J - a.J || a.name.localeCompare(b.name));
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
