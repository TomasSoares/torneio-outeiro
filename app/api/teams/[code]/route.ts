import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await params
  const { name, short, group, color } = await req.json()
  try {
    await pool.query(
      `UPDATE teams SET name=$1, short=$2, "group"=$3, color=$4 WHERE code=$5`,
      [name, short, group, color, code]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await params
  const { rowCount } = await pool.query(
    `SELECT 1 FROM matches WHERE home_code=$1 OR away_code=$1 LIMIT 1`, [code]
  )
  if (rowCount && rowCount > 0) {
    return NextResponse.json({ error: 'Equipa tem jogos associados. Remove os jogos primeiro.' }, { status: 409 })
  }
  await pool.query(`DELETE FROM teams WHERE code=$1`, [code])
  return NextResponse.json({ ok: true })
}
