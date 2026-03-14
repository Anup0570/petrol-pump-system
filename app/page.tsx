import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  // get logged in user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    redirect('/login')
  }

  const role = profile?.role?.trim().toLowerCase()

  if (role === 'admin') {
    redirect('/admin/dashboard')
  }

  if (role === 'staff') {
    redirect('/staff')
  }

  // fallback
  redirect('/login')
}