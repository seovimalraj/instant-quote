export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type User = { id: string; email: string | null }

async function ensureProfile(user: User) {
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email: user.email,
    role: 'customer',
  })
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureProfile(session.user as User)

  return NextResponse.json({ ok: true })
}
