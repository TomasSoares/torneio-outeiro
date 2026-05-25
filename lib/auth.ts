import { cookies } from 'next/headers'

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin_session')?.value === process.env.ADMIN_SECRET
}
