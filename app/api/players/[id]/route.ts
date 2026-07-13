import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { bad, isStr, parseBody } from '@/lib/validate'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [body, err] = await parseBody(req)
  if (err) return err

  const { name, team } = body
  if (!isStr(name, 80)) return bad('Nome inválido (1–80 caracteres)')
  if (!isStr(team, 4)) return bad('Equipa inválida')

  try {
    await pool.query(
      `UPDATE players SET name=$1, team_code=$2 WHERE id=$3`,
      [(name as string).trim(), (team as string).trim(), id]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await pool.query(`DELETE FROM players WHERE id=$1`, [id])
  return NextResponse.json({ ok: true })
}
