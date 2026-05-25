import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Player } from '@/lib/types'

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, team_code AS team, jersey_num AS n FROM players ORDER BY team_code, jersey_num`
    )
    const map = Object.fromEntries(rows.map((p: Player) => [p.id, p]))
    return NextResponse.json(map)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, name, team, n } = await req.json()
  try {
    await pool.query(
      `INSERT INTO players (id, name, team_code, jersey_num) VALUES ($1,$2,$3,$4)`,
      [id, name, team, n]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
