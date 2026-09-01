'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const expectedRole = formData.get('expectedRole') as string

  if (!email || !password) {
    redirect('/login?error=Email and password are required')
  }

  let redirectPath: string = ''

  try {
    console.log('[Login Action] Debug: Initiating login for email:', email)
    console.log('[Login Action] Debug: NEXT_PUBLIC_SUPABASE_URL is', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'UNDEFINED')
    console.log('[Login Action] Debug: NEXT_PUBLIC_SUPABASE_ANON_KEY is', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED')

    const supabase = await createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('[Login Action] Error: Authentication failed -', authError.message)
      const errMsg = authError.message.includes('fetch failed')
        ? 'Database connection failed. Please check your internet connection or verify SUPABASE_URL in project environment settings.'
        : authError.message
      redirectPath = `/login?error=${encodeURIComponent(errMsg)}`
    } else {
      console.log('[Login Action] Success: Authentication successful. Fetching user info...')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('[Login Action] Error: Login succeeded but failed to retrieve user information.')
        redirectPath = '/login?error=Login failed'
      } else {
        console.log('[Login Action] Debug: User ID is', user.id, '- Fetching profile role...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[Login Action] Error: Profile role fetch failed -', profileError.message)
          redirectPath = `/login?error=${encodeURIComponent(profileError.message)}`
        } else {
          const role = profile?.role?.trim().toLowerCase()
          console.log('[Login Action] Success: Profile role is', role)

          if (expectedRole && expectedRole.toLowerCase() !== role) {
            console.error('[Login Action] Error: Role mismatch - Selected:', expectedRole, 'Database:', role)
            redirectPath = `/login?error=${encodeURIComponent(`Unauthorized: You do not have ${expectedRole === 'admin' ? 'Admin' : 'Staff'} privileges.`)}`
          } else if (role === 'admin') {
            redirectPath = '/admin/dashboard'
          } else if (role === 'staff') {
            redirectPath = '/staff'
          } else {
            console.error('[Login Action] Error: Invalid role assignment:', role)
            redirectPath = '/login?error=Invalid role assignment'
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Login Action] Critical Exception: Unexpected error during login flow:', err)
    let userMsg = 'Database connection failed. Please check your internet connection or verify SUPABASE_URL in project environment settings.'
    if (err && err.message && !err.message.includes('fetch failed')) {
      userMsg = `Connection error: ${err.message}`
    }
    redirectPath = `/login?error=${encodeURIComponent(userMsg)}`
  }

  if (redirectPath) {
    console.log('[Login Action] Debug: Redirecting to path:', redirectPath)
    redirect(redirectPath)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
