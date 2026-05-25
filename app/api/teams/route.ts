import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import type { Team } from '@/lib/types'
import { bad, isStr, isGroup, isHex, parseBody } from '@/lib/validate'

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

  const [body, err] = await parseBody(req)
  if (err) return err

  const { code, name, short, group, color } = body
  if (!isStr(code, 4)) return bad('Código inválido (1–4 caracteres)')
  if (!isStr(name, 60)) return bad('Nome inválido (1–60 caracteres)')
  if (!isStr(short, 30)) return bad('Nome curto inválido (1–30 caracteres)')
  if (!isGroup(group)) return bad('Grupo inválido (A ou B)')
  if (!isHex(color)) return bad('Cor inválida (formato #rrggbb)')

  const safeCode = (code as string).trim().toUpperCase()

  try {
    await pool.query(
      `INSERT INTO teams (code, name, short, "group", color) VALUES ($1,$2,$3,$4,$5)`,
      [safeCode, (name as string).trim(), (short as string).trim(), group, color]
    )
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
