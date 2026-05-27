import { NextResponse } from 'next/server'

export function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

export function isStr(v: unknown, max: number, min = 1): v is string {
  return typeof v === 'string' && v.trim().length >= min && v.trim().length <= max
}

export function isInt(v: unknown, min: number, max: number): v is number {
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max
}

export function isGroup(v: unknown): v is 'A' | 'B' {
  return v === 'A' || v === 'B'
}

const KO_ROUNDS = ['SF1', 'SF2', 'F', '3P'] as const

export function isKORound(v: unknown): v is import('./types').KORound {
  return typeof v === 'string' && (KO_ROUNDS as readonly string[]).includes(v)
}

export function isHex(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
}

export function isDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

export function isTime(v: unknown): v is string {
  return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)
}

export async function parseBody(req: Request): Promise<[Record<string, unknown>, null] | [null, NextResponse]> {
  try {
    const body = await req.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return [null, bad('Corpo do pedido inválido')]
    }
    return [body as Record<string, unknown>, null]
  } catch {
    return [null, bad('JSON inválido')]
  }
}
