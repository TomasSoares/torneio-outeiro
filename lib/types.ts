export interface Team {
  code: string;
  name: string;
  short: string;
  group: 'A' | 'B';
  color: string;
}

export interface Scorer {
  p: string;
  t: string;
  c: number;
  min?: number | null;
}

export interface FlatScorer {
  p: string;
  t: string;
  min: number | null;
}

export type KORound = 'SF1' | 'SF2' | 'F' | '3P';

export interface KOSlot {
  code: string | null; // null = a definir (TBD)
  label: string;       // e.g. "1º Grupo A", "Vencedor SF1"
}

export interface Match {
  id: string;
  jornada: number;
  group: 'A' | 'B' | null; // null nos jogos da fase final
  round: KORound | null;    // null nos jogos de grupo
  date: string;
  time: string;
  home: string;
  away: string;
  played: boolean;
  hs: number | null;
  as: number | null;
  venue: string;
  scorers: Scorer[];
}

export interface Player {
  id: string;
  name: string;
  team: string;
  n: number;
}

export interface StandingRow {
  code: string;
  name: string;
  short: string;
  J: number;
  V: number;
  E: number;
  D: number;
  GM: number;
  GS: number;
  DG: number;
  PTS: number;
  form: ('V' | 'E' | 'D')[];
}

export interface TopScorer {
  player: Player;
  count: number;
}

export type Theme = 'dark' | 'light';
