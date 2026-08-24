import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminLogoutButton from './AdminLogoutButton'
import AdminNotifications from './AdminNotifications'
import AdminNavLinks from './AdminNavLinks' // <-- Importi i komponentit interaktiv

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Administrator'
  const displayRole = profile?.role === 'admin' ? 'Administrator Kryesor' : 'Admin'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden w-full">
      
      {/* Sidebar-i origjinal dhe i pastër */}
      <aside className="w-64 bg-slate-950 text-white flex-col hidden md:flex border-r border-slate-800 h-full flex-none">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 flex-none">
          <h1 className="text-xl font-black tracking-tight text-white">
            VIZI<span className="text-purple-500">TRACK</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              Admin
            </span>
          </h1>
        </div>
        
        {/* NAVIGIMI INTERAKTIV */}
        <AdminNavLinks />

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
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Pjesa e përmbajtjes kryesore */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        
        {/* HEADER TRANSPARENT (Merr një pjesë nga paddingu i sipërm) */}
        <div className="w-full flex justify-end px-6 md:px-8 pt-6 pb-2 sticky top-0 z-40 bg-slate-50">
          <AdminNotifications />
        </div>

        {/* Përmbajtja e faqes merr padding më të vogël sipër sepse zëvendësohet nga header-i transparent */}
        <div className="px-6 md:px-8 pb-8 flex-1">
          {children}
        </div>
      </main>
      
    </div>
  )
}