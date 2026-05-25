import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { bad, isStr, isGroup, isHex, parseBody } from '@/lib/validate'

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code: oldCode } = await params

  const [body, err] = await parseBody(req)
  if (err) return err

  const { code, name, short, group, color } = body
  if (!isStr(code, 4)) return bad('Código inválido (1–4 caracteres)')
  if (!isStr(name, 60)) return bad('Nome inválido (1–60 caracteres)')
  if (!isStr(short, 30)) return bad('Nome curto inválido (1–30 caracteres)')
  if (!isGroup(group)) return bad('Grupo inválido (A ou B)')
  if (!isHex(color)) return bad('Cor inválida (formato #rrggbb)')

  const newCode = (code as string).trim().toUpperCase()
  const safeName = (name as string).trim()
  const safeShort = (short as string).trim()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (newCode !== oldCode) {
      await client.query(
        `INSERT INTO teams (code, name, short, "group", color) VALUES ($1,$2,$3,$4,$5)`,
        [newCode, safeName, safeShort, group, color]
      )
      await client.query(`UPDATE players SET team_code=$1 WHERE team_code=$2`, [newCode, oldCode])
      await client.query(`UPDATE matches SET home_code=$1 WHERE home_code=$2`, [newCode, oldCode])
      await client.query(`UPDATE matches SET away_code=$1 WHERE away_code=$2`, [newCode, oldCode])
      await client.query(`UPDATE match_scorers SET team_code=$1 WHERE team_code=$2`, [newCode, oldCode])
      await client.query(`DELETE FROM teams WHERE code=$1`, [oldCode])
    } else {
      await client.query(
        `UPDATE teams SET name=$1, short=$2, "group"=$3, color=$4 WHERE code=$5`,
        [safeName, safeShort, group, color, oldCode]
      )
    }
    await client.query('COMMIT')
    return NextResponse.json({ ok: true, newCode })
  } catch (err: unknown) {
    await client.query('ROLLBACK')
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await params
  if (!isStr(code, 4)) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

  const { rowCount } = await pool.query(
    `SELECT 1 FROM matches WHERE home_code=$1 OR away_code=$1 LIMIT 1`, [code]
  )
  if (rowCount && rowCount > 0) {
    return NextResponse.json({ error: 'Equipa tem jogos associados. Remove os jogos primeiro.' }, { status: 409 })
  }
  await pool.query(`DELETE FROM teams WHERE code=$1`, [code])
  return NextResponse.json({ ok: true })
}
