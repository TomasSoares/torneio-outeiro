import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
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
