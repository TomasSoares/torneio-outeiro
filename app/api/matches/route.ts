import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Match } from '@/lib/types'
import { bad, isStr, isInt, isGroup, isDate, isTime, parseBody } from '@/lib/validate'

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        m.id, m.jornada, m."group",
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
      GROUP BY m.id
      ORDER BY m.jornada, m.match_date, m.match_time
    `)

    const matches: Match[] = rows.map(({ away_score, ...r }) => ({ ...r, as: away_score }))
    return NextResponse.json(matches)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [body, err] = await parseBody(req)
  if (err) return err

  const { id, jornada, group, date, time, home, away, venue, played, hs, as: as_, scorers } = body

  if (!isStr(id, 20)) return bad('ID inválido')
  if (!isInt(jornada, 1, 50)) return bad('Jornada inválida (1–50)')
  if (!isGroup(group)) return bad('Grupo inválido (A ou B)')
  if (!isDate(date)) return bad('Data inválida (YYYY-MM-DD)')
  if (!isTime(time)) return bad('Hora inválida (HH:MM)')
  if (!isStr(home, 4)) return bad('Equipa da casa inválida')
  if (!isStr(away, 4)) return bad('Equipa visitante inválida')
  if ((home as string).trim() === (away as string).trim()) return bad('Casa e visitante não podem ser iguais')
  if (!isStr(venue, 100)) return bad('Recinto inválido (1–100 caracteres)')
  if (typeof played !== 'boolean') return bad('Campo "played" inválido')
  if (hs !== null && hs !== undefined && !isInt(hs, 0, 99)) return bad('Resultado da casa inválido')
  if (as_ !== null && as_ !== undefined && !isInt(as_, 0, 99)) return bad('Resultado visitante inválido')

  const scorersErr = validateScorers(scorers)
  if (scorersErr) return bad(scorersErr)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO matches (id, jornada, "group", match_date, match_time, home_code, away_code, played, home_score, away_score, venue)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [(id as string).trim(), jornada, group, date, time, (home as string).trim(), (away as string).trim(), played, hs ?? null, as_ ?? null, (venue as string).trim()]
    )
    for (const s of (scorers as { p: string; t: string; c: number; min: number | null }[]) ?? []) {
      await client.query(
        'INSERT INTO match_scorers (match_id, player_id, team_code, goal_count, minute) VALUES ($1,$2,$3,$4,$5)',
        [(id as string).trim(), s.p, s.t, s.c, s.min ?? null]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  } finally {
    client.release()
  }
}

function validateScorers(scorers: unknown): string | null {
  if (scorers === null || scorers === undefined) return null
  if (!Array.isArray(scorers)) return 'Marcadores inválidos'
  if (scorers.length > 30) return 'Demasiados marcadores'
  for (const s of scorers) {
    if (typeof s !== 'object' || s === null) return 'Marcador inválido'
    const { p, t, c, min } = s as Record<string, unknown>
    if (!isStr(p, 20)) return 'ID de jogador inválido'
    if (!isStr(t, 4)) return 'Código de equipa inválido no marcador'
    if (!isInt(c, 1, 20)) return 'Contagem de golos inválida'
    if (min !== null && min !== undefined && !isInt(min, 0, 120)) return 'Minuto inválido'
  }
  return null
}
