import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/**
 * POST /api/matches/generate-finals
 * Gera a Final e o jogo do 3º/4º lugar com base nos resultados das meias-finais.
 * Final:    Vencedor SF1 vs Vencedor SF2
 * 3º/4º:   Perdedor SF1 vs Perdedor SF2
 */
export async function POST() {
  if (!await isAdminRequest())
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Buscar SF1 e SF2
    const { rows } = await client.query(
      `SELECT id, round, home_code AS home, away_code AS away, played, home_score AS hs, away_score AS as_
       FROM matches WHERE round IN ('SF1', 'SF2')`
    )

    const sf1 = rows.find((r) => r.round === 'SF1')
    const sf2 = rows.find((r) => r.round === 'SF2')

    if (!sf1 || !sf2) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'As meias-finais ainda não foram geradas' }, { status: 400 })
    }

    if (!sf1.played || !sf2.played) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Ambas as meias-finais têm de estar disputadas' }, { status: 400 })
    }

    if (sf1.hs === null || sf1.as_ === null || sf1.hs === sf1.as_) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Resultado de SF1 inconclusivo (empate não permitido em KO)' }, { status: 422 })
    }

    if (sf2.hs === null || sf2.as_ === null || sf2.hs === sf2.as_) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Resultado de SF2 inconclusivo (empate não permitido em KO)' }, { status: 422 })
    }

    // 2. Verificar que Final ainda não existe
    const { rows: fRows } = await client.query(
      `SELECT id FROM matches WHERE round = 'F' LIMIT 1`
    )
    if (fRows.length > 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'A final já foi gerada' }, { status: 409 })
    }

    // 3. Determinar vencedores e perdedores
    const sf1Winner = sf1.hs > sf1.as_ ? sf1.home : sf1.away
    const sf1Loser  = sf1.hs > sf1.as_ ? sf1.away : sf1.home
    const sf2Winner = sf2.hs > sf2.as_ ? sf2.home : sf2.away
    const sf2Loser  = sf2.hs > sf2.as_ ? sf2.away : sf2.home

    // Data placeholder — admin pode editar depois
    const fDate  = '2026-06-14'
    const fVenue = 'Saibreira'

    await client.query(
      `INSERT INTO matches
        (id, jornada, "group", round, match_date, match_time, home_code, away_code, played, venue)
       VALUES
        ($1, 5, NULL, 'F',  $2, '17:00', $3, $4, FALSE, $5),
        ($6, 5, NULL, '3P', $2, '15:00', $7, $8, FALSE, $5)`,
      ['ko_f', fDate, sf1Winner, sf2Winner, fVenue, 'ko_3p', sf1Loser, sf2Loser]
    )

    await client.query('COMMIT')
    return NextResponse.json({
      ok: true,
      final:  { home: sf1Winner, away: sf2Winner },
      third:  { home: sf1Loser,  away: sf2Loser },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  } finally {
    client.release()
  }
}
