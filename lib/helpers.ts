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

  // Critérios de desempate: 1. pontos, 2. confronto direto (mini-liga entre
  // as equipas empatadas), 3. diferença de golos geral, 4. golos marcados geral, 5. nome.
  const byPTS = new Map<number, StandingRow[]>();
  rows.forEach((r) => {
    if (!byPTS.has(r.PTS)) byPTS.set(r.PTS, []);
    byPTS.get(r.PTS)!.push(r);
  });

  const sorted: StandingRow[] = [];
  [...byPTS.keys()].sort((a, b) => b - a).forEach((pts) => {
    const group = byPTS.get(pts)!;
    if (group.length > 1) {
      const codes = new Set(group.map((r) => r.code));
      const h2h = computeHeadToHead(codes, matches);
      group.sort(
        (a, b) =>
          h2h[b.code].pts - h2h[a.code].pts ||
          h2h[b.code].dg - h2h[a.code].dg ||
          h2h[b.code].gm - h2h[a.code].gm ||
          b.DG - a.DG ||
          b.GM - a.GM ||
          a.name.localeCompare(b.name)
      );
    }
    sorted.push(...group);
  });

  return sorted;
}

/** Mini-liga entre as equipas empatadas em pontos, usando só os jogos entre si (confronto direto). */
function computeHeadToHead(codes: Set<string>, matches: Match[]): Record<string, { pts: number; dg: number; gm: number }> {
  const h2h: Record<string, { pts: number; dg: number; gm: number }> = {};
  codes.forEach((c) => { h2h[c] = { pts: 0, dg: 0, gm: 0 }; });

  for (const m of matches) {
    if (!m.played || !codes.has(m.home) || !codes.has(m.away)) continue;
    const h = h2h[m.home], a = h2h[m.away];
    h.gm += m.hs!; h.dg += m.hs! - m.as!;
    a.gm += m.as!; a.dg += m.as! - m.hs!;
    if (m.hs! > m.as!) h.pts += 3;
    else if (m.hs! < m.as!) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  }
  return h2h;
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
