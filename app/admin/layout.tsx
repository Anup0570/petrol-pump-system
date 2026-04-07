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
    <div className="admin-theme flex min-h-screen">
      <AdminSidebar adminName={(profile as any)?.name || 'Admin'} />
      <main className="flex-1 min-w-0 md:ml-[260px] pt-20 px-4 pb-8 md:p-8 w-full md:w-[calc(100%-260px)]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
