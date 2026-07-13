import type { Match, Player, Team } from './types';

export const TEAMS: Record<string, Team> = {
  CRV: { code: 'CRV', name: 'Os Carvalhos',     short: 'Carvalhos',  group: 'A', color: '#0c5036' },
  LAM: { code: 'LAM', name: 'União Lameira',     short: 'Lameira',    group: 'A', color: '#7a3b1d' },
  ACP: { code: 'ACP', name: 'Académico Pinhal',  short: 'Académico',  group: 'A', color: '#1f3a6b' },
  ERI: { code: 'ERI', name: 'Estrela do Rio',    short: 'Estrela',    group: 'A', color: '#a31b2a' },
  AOT: { code: 'AOT', name: 'Atlético Outeiro',  short: 'Outeiro',    group: 'B', color: '#0a4a86' },
  SVL: { code: 'SVL', name: 'Sporting Vilar',    short: 'Vilar',      group: 'B', color: '#1a6b3a' },
  CDP: { code: 'CDP', name: 'Casa do Povo',      short: 'Casa Povo',  group: 'B', color: '#5a2569' },
  RFC: { code: 'RFC', name: 'Ribeira F.C.',      short: 'Ribeira',    group: 'B', color: '#c6791a' },
};

export const INITIAL_MATCHES: Match[] = [
  // Jornada 1 — 04 Maio 2026
  { id: 'm1',  jornada: 1, group: 'A', round: null, date: '2026-05-04', time: '17:00', home: 'CRV', away: 'LAM', played: true,  hs: 2, as: 1, venue: 'Saibreira',
    scorers: [ {p:'p1', t:'CRV', c:1, min:23}, {p:'p2', t:'CRV', c:1, min:67}, {p:'p7', t:'LAM', c:1, min:81} ] },
  { id: 'm2',  jornada: 1, group: 'A', round: null, date: '2026-05-04', time: '19:00', home: 'ACP', away: 'ERI', played: true,  hs: 0, as: 0, venue: 'Saibreira', scorers: [] },
  { id: 'm3',  jornada: 1, group: 'B', round: null, date: '2026-05-04', time: '17:00', home: 'AOT', away: 'SVL', played: true,  hs: 2, as: 2, venue: 'Saibreira',
    scorers: [ {p:'p3', t:'AOT', c:1, min:12}, {p:'p9', t:'AOT', c:1, min:55}, {p:'p4', t:'SVL', c:1, min:33}, {p:'p13', t:'SVL', c:1, min:88} ] },
  { id: 'm4',  jornada: 1, group: 'B', round: null, date: '2026-05-04', time: '19:00', home: 'CDP', away: 'RFC', played: true,  hs: 1, as: 0, venue: 'Saibreira',
    scorers: [ {p:'p5', t:'CDP', c:1, min:71} ] },

  // Jornada 2 — 11 Maio 2026
  { id: 'm5',  jornada: 2, group: 'A', round: null, date: '2026-05-11', time: '17:00', home: 'CRV', away: 'ACP', played: true,  hs: 3, as: 0, venue: 'Saibreira',
    scorers: [ {p:'p1', t:'CRV', c:2, min:15}, {p:'p1', t:'CRV', c:1, min:48}, {p:'p10', t:'CRV', c:1, min:74} ] },
  { id: 'm6',  jornada: 2, group: 'A', round: null, date: '2026-05-11', time: '19:00', home: 'LAM', away: 'ERI', played: true,  hs: 1, as: 2, venue: 'Saibreira',
    scorers: [ {p:'p11', t:'LAM', c:1, min:29}, {p:'p8', t:'ERI', c:1, min:52}, {p:'p8', t:'ERI', c:1, min:79} ] },
  { id: 'm7',  jornada: 2, group: 'B', round: null, date: '2026-05-11', time: '17:00', home: 'AOT', away: 'CDP', played: true,  hs: 4, as: 1, venue: 'Saibreira',
    scorers: [ {p:'p3', t:'AOT', c:2, min:8}, {p:'p3', t:'AOT', c:1, min:62}, {p:'p9', t:'AOT', c:1, min:34}, {p:'p12', t:'AOT', c:1, min:90}, {p:'p5', t:'CDP', c:1, min:55} ] },
  { id: 'm8',  jornada: 2, group: 'B', round: null, date: '2026-05-11', time: '19:00', home: 'SVL', away: 'RFC', played: true,  hs: 1, as: 1, venue: 'Saibreira',
    scorers: [ {p:'p14', t:'SVL', c:1, min:40}, {p:'p6', t:'RFC', c:1, min:83} ] },

  // Jornada 3 — 18 Maio 2026
  { id: 'm9',  jornada: 3, group: 'A', round: null, date: '2026-05-18', time: '17:00', home: 'CRV', away: 'ERI', played: false, hs: null, as: null, venue: 'Saibreira', scorers: [] },
  { id: 'm10', jornada: 3, group: 'A', round: null, date: '2026-05-18', time: '19:00', home: 'LAM', away: 'ACP', played: false, hs: null, as: null, venue: 'Saibreira', scorers: [] },
  { id: 'm11', jornada: 3, group: 'B', round: null, date: '2026-05-18', time: '17:00', home: 'AOT', away: 'RFC', played: false, hs: null, as: null, venue: 'Saibreira', scorers: [] },
  { id: 'm12', jornada: 3, group: 'B', round: null, date: '2026-05-18', time: '19:00', home: 'SVL', away: 'CDP', played: false, hs: null, as: null, venue: 'Saibreira', scorers: [] },
];

export const PLAYERS: Record<string, Player> = {
  p1:  { id: 'p1',  name: 'Tiago Mendes',    team: 'CRV', n: 9  },
  p2:  { id: 'p2',  name: 'Vasco Pinto',     team: 'CRV', n: 11 },
  p10: { id: 'p10', name: 'André Gonçalves', team: 'CRV', n: 7  },
  p7:  { id: 'p7',  name: 'Miguel Tavares',  team: 'LAM', n: 10 },
  p11: { id: 'p11', name: 'Rafael Gomes',    team: 'LAM', n: 9  },
  p15: { id: 'p15', name: 'Pedro Faria',     team: 'ACP', n: 8  },
  p8:  { id: 'p8',  name: 'Diogo Almeida',   team: 'ERI', n: 9  },
  p3:  { id: 'p3',  name: 'João Pereira',    team: 'AOT', n: 10 },
  p9:  { id: 'p9',  name: 'Francisco Neves', team: 'AOT', n: 7  },
  p12: { id: 'p12', name: 'Hugo Sampaio',    team: 'AOT', n: 14 },
  p4:  { id: 'p4',  name: 'Rui Santos',      team: 'SVL', n: 10 },
  p13: { id: 'p13', name: 'Filipe Cunha',    team: 'SVL', n: 7  },
  p14: { id: 'p14', name: 'Nuno Carmo',      team: 'SVL', n: 9  },
  p5:  { id: 'p5',  name: 'Bruno Costa',     team: 'CDP', n: 9  },
  p16: { id: 'p16', name: 'Sérgio Pacheco',  team: 'CDP', n: 11 },
  p6:  { id: 'p6',  name: 'Henrique Lopes',  team: 'RFC', n: 9  },
  p17: { id: 'p17', name: 'Daniel Ferraz',   team: 'RFC', n: 8  },
};
