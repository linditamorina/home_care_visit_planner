import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import NavLinks from './NavLinks' 
import LogoutButton from './LogoutButton'
import SupervisorNotifications from './SupervisorNotifications' // <-- Importi i Ri

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Tërheqim profilin e plotë të përdoruesit të kyçur nga tabela 'users'
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  // 2. Logjikë profesionale për përkthimin e rolit nga ENUM i databazës
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'supervisor': return 'Mbikëqyrës'
      case 'field_worker': return 'Punëtor në Terren'
      default: return 'Staf'
    }
  }

  // 3. Përgatisim të dhënat vizuale (fallback në rast se profili s'është plotësuar ende)
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Përdorues'
  const displayRole = profile?.role ? getRoleDisplay(profile.role) : 'Administrator'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* SIDEBAR-i mbetet 100% i paprekur dhe solid */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-wider text-blue-400">VIZI<span className="text-white">TRACK</span></span>
        </div>
        
        <NavLinks />

        {/* Paneli i Identitetit të Përdoruesit */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-slate-800">
              {initial}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate" title={displayName}>
                {displayName}
              </p>
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider truncate mt-0.5">
                {displayRole}
              </p>
            </div>
          </div>
          
          <LogoutButton />
        </div>
      </aside>

      {/* Pjesa Kryesore (Main) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* HEADER TRANSPARENT ME ZILEN LART DJATHTAS */}
        <div className="w-full flex justify-end px-8 pt-6 pb-2 sticky top-0 z-40 bg-slate-50">
          <SupervisorNotifications />
        </div>

        {/* Kontenieri i faqeve (fëmijëve). Padding-u i sipërm zvogëlohet për shkak të header-it transparent */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}