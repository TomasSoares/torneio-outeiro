import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Match } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const match: Match = await req.json()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE matches SET
        played=$1, home_score=$2, away_score=$3, jornada=$4,
        match_date=$5, match_time=$6, home_code=$7, away_code=$8, venue=$9, "group"=$10
       WHERE id=$11`,
      [match.played, match.hs, match.as, match.jornada, match.date, match.time, match.home, match.away, match.venue, match.group, id]
    )
    await client.query('DELETE FROM match_scorers WHERE match_id=$1', [id])
    for (const s of match.scorers ?? []) {
      await client.query(
        'INSERT INTO match_scorers (match_id, player_id, team_code, goal_count, minute) VALUES ($1,$2,$3,$4,$5)',
        [id, s.p, s.t, s.c, s.min ?? null]
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await pool.query('DELETE FROM matches WHERE id=$1', [id])
  return NextResponse.json({ ok: true })
}
