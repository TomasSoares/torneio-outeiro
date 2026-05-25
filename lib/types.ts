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

export interface Match {
  id: string;
  jornada: number;
  group: 'A' | 'B';
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
