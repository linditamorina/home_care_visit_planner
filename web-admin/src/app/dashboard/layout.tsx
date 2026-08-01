import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logoutAction } from './actions'
import NavLinks from './NavLinks' 

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
          <form action={logoutAction}>
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Dil nga sistemi
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">Paneli Administrativ</h1>
        </header> */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}