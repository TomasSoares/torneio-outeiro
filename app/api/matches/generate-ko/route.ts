import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { computeStandings } from '@/lib/helpers'
import type { Match, Scorer } from '@/lib/types'

// Mapeia uma row da BD para o tipo Match
function mapRow(r: Record<string, unknown>): Match {
  return {
    id:      r.id as string,
    jornada: r.jornada as number,
    group:   r.group as 'A' | 'B' | null,
    round:   r.round as Match['round'],
    date:    r.date as string,
    time:    r.time as string,
    home:    r.home as string,
    away:    r.away as string,
    played:  r.played as boolean,
    hs:      r.hs as number | null,
    as:      r.away_score as number | null,
    venue:   r.venue as string,
    scorers: (r.scorers as Scorer[]) ?? [],
  }
}

/**
 * POST /api/matches/generate-ko
 * Gera as meias-finais (SF1 e SF2) com base nos standings da fase de grupos.
 * SF1: 1º Grupo A vs 2º Grupo B
 * SF2: 1º Grupo B vs 2º Grupo A
 */
export async function POST() {
  if (!await isAdminRequest())
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // TODO: restaurar validação — 1. Verificar que todos os jogos de grupo estão disputados

    // 2. Verificar que não existem jogos KO (idempotência)
    const { rows: koRows } = await client.query(
      `SELECT id FROM matches WHERE round IS NOT NULL LIMIT 1`
    )
    if (koRows.length > 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'A fase final já foi gerada' }, { status: 409 })
    }

    // 3. Buscar todos os jogos para calcular standings em TypeScript
    const { rows } = await client.query(`
      SELECT
        m.id, m.jornada, m."group", m.round,
        m.match_date::text AS date,
        m.match_time AS time,
        m.home_code AS home, m.away_code AS away,
        m.played, m.home_score AS hs, m.away_score,
        m.venue,
        COALESCE(
          json_agg(
            json_build_object('p', s.player_id, 't', s.team_code, 'c', s.goal_count, 'min', s.minute)
            ORDER BY s.id
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS scorers
      FROM matches m
      LEFT JOIN match_scorers s ON s.match_id = m.id
      WHERE m."group" IS NOT NULL
      GROUP BY m.id
    `)

    const allMatches = rows.map(mapRow)

    // 4. Calcular classificações
    const { rows: teamsRows } = await client.query(
      `SELECT code, name, short, "group", color FROM teams`
    )
    const teamsMap = Object.fromEntries(teamsRows.map((t) => [t.code, t]))

    const standA = computeStandings('A', allMatches, teamsMap)
    const standB = computeStandings('B', allMatches, teamsMap)

    if (standA.length < 2 || standB.length < 2) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Não foi possível calcular os classificados' }, { status: 422 })
    }

    // SF1: 1º A vs 2º B  |  SF2: 1º B vs 2º A
    const sf1Home = standA[0].code
    const sf1Away = standB[1].code
    const sf2Home = standB[0].code
    const sf2Away = standA[1].code

    // Data e hora placeholder — admin pode editar depois
    const sfDate  = '2026-06-07'
    const sfVenue = 'Saibreira'

    await client.query(
      `INSERT INTO matches
        (id, jornada, "group", round, match_date, match_time, home_code, away_code, played, venue)
       VALUES
        ($1, 4, NULL, 'SF1', $2, '17:00', $3, $4, FALSE, $5),
        ($6, 4, NULL, 'SF2', $2, '19:00', $7, $8, FALSE, $5)`,
      ['ko_sf1', sfDate, sf1Home, sf1Away, sfVenue, 'ko_sf2', sf2Home, sf2Away]
    )

    await client.query('COMMIT')
    return NextResponse.json({
      ok: true,
      sf1: { home: sf1Home, away: sf1Away },
      sf2: { home: sf2Home, away: sf2Away },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  } finally {
    client.release()
  }
}
