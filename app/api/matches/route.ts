import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Match } from '@/lib/types'

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
  if (!await isAdminRequest()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const match: Match = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO matches (id, jornada, "group", match_date, match_time, home_code, away_code, played, home_score, away_score, venue)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [match.id, match.jornada, match.group, match.date, match.time, match.home, match.away, match.played, match.hs, match.as, match.venue]
    )
    for (const s of match.scorers ?? []) {
      await client.query(
        'INSERT INTO match_scorers (match_id, player_id, team_code, goal_count, minute) VALUES ($1,$2,$3,$4,$5)',
        [match.id, s.p, s.t, s.c, s.min ?? null]
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
