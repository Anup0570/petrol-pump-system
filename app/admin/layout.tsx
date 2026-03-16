import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/staff?error=NoProfile')
  }

  if (profile.role?.trim().toLowerCase() !== 'admin') {
    redirect(`/staff?error=NotAdmin&role=${profile.role}`)
  }

  return (
    <div className="admin-theme" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <AdminSidebar adminName={(profile as any)?.name || 'Admin'} />
      <main style={{ marginLeft: '240px', flex: 1, padding: '28px', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
