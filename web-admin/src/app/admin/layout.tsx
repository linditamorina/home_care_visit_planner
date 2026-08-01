import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logoutAction } from '../dashboard/actions' // Përshtate rrugën nëse skedari actions.ts ndodhet diku tjetër

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // 1. Verifikimi i sigurisë dhe marrja e sesionit
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Tërheqja e identitetit nga baza e të dhënave
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  // 3. Logjika e formatimit të identitetit
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Administrator'
  const displayRole = profile?.role === 'admin' ? 'Administrator Kryesor' : 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    // NDËRHYRJA KRYESORE 1: h-screen dhe overflow-hidden bllokojnë faqen globale të mos bëjë scroll!
    <div className="h-screen bg-slate-50 flex overflow-hidden w-full">
      
      {/* Sidebar-i ekskluziv i Administratorit */}
      {/* flex-none siguron që sidebar-i të mos tkurret, h-full merr 100% të lartësisë së bllokuar */}
      <aside className="w-64 bg-slate-950 text-white flex-col hidden md:flex border-r border-slate-800 h-full flex-none">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 flex-none">
          <h1 className="text-xl font-black tracking-tight text-white">
            VIZI<span className="text-purple-500">TRACK</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              Admin
            </span>
          </h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            Paneli Qendror
          </Link>
          <Link href="/admin/zonat" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            Menaxhimi i Zonave
          </Link>
          <Link href="/admin/stafi" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            Stafi & Rolet
          </Link>
          <Link href="/admin/audit-logs" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            Audit Logs
          </Link>
        </nav>

        {/* Paneli i Identitetit dhe Daljes (flex-none e mban gjithmonë në fund) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex-none">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-slate-800 shrink-0">
              {initial}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate" title={displayName}>
                {displayName}
              </p>
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider truncate mt-0.5">
                {displayRole}
              </p>
            </div>
          </div>
          
          <form action={logoutAction}>
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-red-950 hover:text-red-400 hover:border-red-900/50 text-sm font-medium rounded-lg transition-colors text-slate-400 border border-slate-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Dil nga sistemi
            </button>
          </form>
        </div>
      </aside>

      {/* NDËRHYRJA KRYESORE 2: overflow-y-auto bën që VETËM kjo pjesë e djathtë të bëjë scroll! */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {/* Kontenieri i përmbajtjes */}
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
      
    </div>
  )
}