import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const limiter = new RateLimiterMemory({
  points: 5,       // 5 tentativas
  duration: 60 * 15, // por cada 15 minutos
  blockDuration: 60 * 15, // bloqueia 15 min após esgotar
})

export async function POST(req: Request) {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? 'unknown'

  try {
    await limiter.consume(ip)
  } catch {
    return NextResponse.json(
      { error: 'Demasiadas tentativas. Tenta novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  const { password } = await req.json()

  if (password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const store = await cookies()
  store.set('admin_session', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete('admin_session')
  return NextResponse.json({ ok: true })
}
