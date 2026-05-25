import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Player } from '@/lib/types'
import { bad, isStr, isInt, parseBody } from '@/lib/validate'

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

  const [body, err] = await parseBody(req)
  if (err) return err

  const { id, name, team, n } = body
  if (!isStr(id, 20)) return bad('ID inválido')
  if (!isStr(name, 80)) return bad('Nome inválido (1–80 caracteres)')
  if (!isStr(team, 4)) return bad('Equipa inválida')
  if (!isInt(n, 1, 99)) return bad('Número de camisola inválido (1–99)')

  try {
    await pool.query(
      `INSERT INTO players (id, name, team_code, jersey_num) VALUES ($1,$2,$3,$4)`,
      [(id as string).trim(), (name as string).trim(), (team as string).trim(), n]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
