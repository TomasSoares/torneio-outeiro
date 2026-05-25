import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Team } from '@/lib/types'

export async function GET() {
  try {
    const { rows } = await pool.query<Team>(`SELECT code, name, short, "group", color FROM teams ORDER BY "group", name`)
    const map = Object.fromEntries(rows.map((t) => [t.code, t]))
    return NextResponse.json(map)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const team: Team = await req.json()
  try {
    await pool.query(
      `INSERT INTO teams (code, name, short, "group", color) VALUES ($1,$2,$3,$4,$5)`,
      [team.code, team.name, team.short, team.group, team.color]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
