import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const querySchema = z.object({
  code: z.string().optional(),
})

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(requestUrl.searchParams))
  if (!parsed.success) {
    redirect('/login')
  }
  const { code } = parsed.data

  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

    const supabaseAdmin = createAdminClient()
  await supabaseAdmin.from('profiles').upsert({
    id: session.user.id,
    email: session.user.email,
    role: 'customer',
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'admin' || profile?.role === 'staff') {
    redirect('/admin/dashboard')
  }

  redirect('/dashboard')
}
