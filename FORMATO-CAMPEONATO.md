# TODO (condicional): mudar para formato de campeonato

> Este ficheiro só é relevante se o utilizador pedir para avançar com esta
> mudança. Não implementar nada disto sem confirmação explícita — é uma nota
> de planeamento, não uma tarefa aprovada.

## Objetivo

7 equipas, liga única (round-robin), sem grupos A/B, sem fase final
(eliminatórias). O campeão é quem liderar a tabela final.

## Porquê

Com 7 equipas a divisão em 2 grupos fica desequilibrada (4 vs 3). Decisão:
uma tabela só, todos contra todos.

## DB — não precisa de migração

`teams.group` e `matches.group` já aceitam só `'A'`/`'B'` (constraint em
`scripts/setup-db.sh`). Basta criar as 7 equipas todas com `group = 'A'`.
Nenhuma alteração de schema necessária.

## Ficheiros a alterar/remover

- **`lib/helpers.ts`**
  - `computeStandings(group, matches, teamsMap)` (linha 26) — remover o
    parâmetro `group` e o filtro por grupo; passar a agregar todas as
    equipas.
  - `detectPhase()` (linha 68) e `type TournamentPhase` (linha 65) — deixam
    de fazer sentido (nunca há fase `knockout`); remover.
  - Linhas 115-116 (`standA`/`standB`) — código morto a remover junto com
    `detectPhase`.

- **`components/StandingsPage.tsx`**
  - `GroupTabs` (linha 48) e a sua chamada (linha 94) — remover.
  - `useState<'A'|'B'>('A')` para `group` (linha 14) — remover, chamar
    `computeStandings(matches, teams)` sem grupo.
  - Bloco "Apura para as meias-finais" + destaque visual das 2 primeiras
    linhas (`qualify = i < 2`, por volta da linha 111 e 148-151) — remover.

- **`components/App.tsx`**
  - `import { detectPhase }` (linha 6) e `const phase = ...` (linha 110) —
    remover.
  - `import { BracketPage }` (linha 14) e o bloco `{page === 'bracket' && ...}`
    (linha 192-193) — remover.
  - Linha 114 (`if (phase === 'knockout') setPage('bracket')`) — remover.
  - Linhas 157-159 e 168 (`generate-ko` / `generate-finals` calls e
    `setPage('bracket')`) — remover as funções que os chamam.
  - `type Page = 'table' | 'bracket' | 'calendar' | 'admin'` (linha 20) —
    remover `'bracket'`.

- **`components/BracketPage.tsx`** — ficheiro inteiro a remover.

- **`components/BottomNav.tsx`** e **`components/Sidebar.tsx`** — remover a
  entrada `{ id: 'bracket', label: 'Fase Final' }` e o tipo `Page` sem
  `'bracket'`; remover import/uso de `TournamentPhase`.

- **`app/api/matches/generate-ko/route.ts`** e
  **`app/api/matches/generate-finals/route.ts`** — remover as rotas
  inteiras (chamam `computeStandings('A'/'B', ...)`, que deixa de existir
  com essa assinatura).

## O que NÃO precisa de tocar

- CRUD de jogos/marcadores (`app/api/matches/route.ts`,
  `app/api/matches/[id]/route.ts`)
- `CalendarPage` — já organiza por jornada, agnóstico a grupo
- `AdminTeamsSheet` — gestão de equipas/jogadores (só deixar de mostrar o
  seletor de grupo A/B ao criar equipa, se existir)

## Resumo

Mais remoção/limpeza de UI do que reescrita. Zero risco de schema ou dados
em produção — a única mudança de dados é `group = 'A'` para todas as
equipas.
