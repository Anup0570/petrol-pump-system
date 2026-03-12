import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResetForm from './ResetForm'

export default async function TankResetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  // Fetch current tank inventory to display capacity
  const { data: tanks } = await supabase
    .from('tank_inventory')
    .select('*')

  const petrolTank = (tanks || []).find((t: any) => t.fuel_type === 'petrol') || { current_stock: 0, capacity: 20000 }
  const dieselTank = (tanks || []).find((t: any) => t.fuel_type === 'diesel') || { current_stock: 0, capacity: 20000 }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tank Stock Correction</h1>
        <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
          Use this option only if tank stock is incorrect due to wrong delivery entries or shift mistakes. This will override the current tank stock.
        </p>
      </div>
      <ResetForm 
        adminName={profile?.name || user.email || 'Admin'} 
        petrolStock={petrolTank.current_stock}
        dieselStock={dieselTank.current_stock}
        petrolCapacity={petrolTank.capacity}
        dieselCapacity={dieselTank.capacity}
      />
    </div>
  )
}
