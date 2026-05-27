import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { bad, isStr, isInt, isGroup, isKORound, isDate, isTime, parseBody } from '@/lib/validate'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [body, err] = await parseBody(req)
  if (err) return err

  const { jornada, group, round, date, time, home, away, venue, played, hs, as: as_, scorers } = body

  if (!isInt(jornada, 1, 50)) return bad('Jornada inválida (1–50)')

  // Exatamente um de (group, round) deve ser fornecido
  const hasGroup = isGroup(group)
  const hasRound = isKORound(round)
  if (hasGroup === hasRound) return bad('Especifique grupo (A/B) OU ronda eliminatória (SF1/SF2/F/3P), não ambos')

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
      `UPDATE matches SET
        played=$1, home_score=$2, away_score=$3, jornada=$4,
        match_date=$5, match_time=$6, home_code=$7, away_code=$8, venue=$9, "group"=$10, round=$11
       WHERE id=$12`,
      [played, hs ?? null, as_ ?? null, jornada, date, time, (home as string).trim(), (away as string).trim(), (venue as string).trim(), hasGroup ? group : null, hasRound ? round : null, id]
    )
    await client.query('DELETE FROM match_scorers WHERE match_id=$1', [id])
    for (const s of (scorers as { p: string; t: string; c: number; min: number | null }[]) ?? []) {
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await pool.query('DELETE FROM matches WHERE id=$1', [id])
  return NextResponse.json({ ok: true })
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
