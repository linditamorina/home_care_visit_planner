export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Tërheqim të dhënat për analitikën e biznesit dhe operacioneve
  const [
    { count: zonesCount },
    { count: patientsCount },
    { data: usersList },
    { data: visitsList }
  ] = await Promise.all([
    supabase.from('zones').select('*', { count: 'exact', head: true }),
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('id, full_name, role, email, created_at').order('created_at', { ascending: false }),
    supabase.from('visits').select('status, priority')
  ])

  const zCount = zonesCount || 0
  const pCount = patientsCount || 0
  const users = usersList || []
  const visits = visitsList || []

  // --- LLOGARITJET OPERACIONALE ---
  const totalVisits = visits.length
  const completedVisits = visits.filter(v => v.status === 'completed').length
  const scheduledVisits = visits.filter(v => v.status === 'scheduled').length
  const inProgressVisits = visits.filter(v => v.status === 'in_progress').length
  const cancelledVisits = visits.filter(v => v.status === 'cancelled').length
  
  const totalEmergencies = visits.filter(v => v.priority === 'emergjente').length
  const pendingEmergencies = visits.filter(v => v.priority === 'emergjente' && v.status !== 'completed' && v.status !== 'cancelled').length

  const successRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0

  // --- LLOGARITJET E BURIMEVE NJERËZORE ---
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const supervisorCount = users.filter(u => u.role === 'supervisor').length
  const fieldWorkerCount = users.filter(u => u.role === 'field_worker').length

  const latestUsers = users.slice(0, 4) // Merr 4 të fundit për tabelën kompakte

  return (
    // Reduktuam hapësirat (space-y dhe pb) për ta bërë kompakte dhe për të shmangur scroll-in
    <div className="max-w-7xl mx-auto flex flex-col gap-5 pb-4">
      
      {/* 1. Koka e Panelit (Më kompakte) */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Qendra Operacionale</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Përmbledhja analitike e VisiTrack. Monitoroni performancën e vizitave dhe strukturën e stafit.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest">Sistemi Online</span>
        </div>
      </div>

      {/* 2. Treguesit Kryesorë (KPIs - Reduktuar padding-un në p-4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm">🗺️</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zonat</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{zCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Territore të mbuluara</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-sm">❤️</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pacientë</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{pCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">Të regjistruar në sistem</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">👥</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stafi</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{totalUsers}</p>
            <p className="text-[11px] text-slate-500 font-medium">Përdorues aktivë</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-16 h-16 bg-orange-50 rounded-tl-full opacity-50"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-sm">📊</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vizita</span>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-black text-slate-800">{totalVisits}</p>
            <p className="text-[11px] text-slate-500 font-medium">Historiku total</p>
          </div>
        </div>
      </div>

      {/* 3. Seksioni Analitik (3 Kolona të barabarta për të shmangur scroll-in) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Kolona 1: Performanca */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span>🎯</span> Performanca e Vizitave
          </h3>
          
          <div className="flex items-center gap-5 mb-6">
            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-full w-20 h-20 border-[3px] border-white shadow-sm shrink-0">
              <span className="text-xl font-black text-emerald-600">{successRate}%</span>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 leading-relaxed">Norma e suksesit bazuar në <span className="font-bold text-slate-700">{totalVisits}</span> vizita totale të menaxhuara nga sistemi.</p>
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-emerald-700">Të Përfunduara</span>
                <span className="text-slate-600">{completedVisits}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalVisits ? (completedVisits/totalVisits)*100 : 0}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-blue-700">Në Pritje & Proces</span>
                <span className="text-slate-600">{scheduledVisits + inProgressVisits}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalVisits ? ((scheduledVisits+inProgressVisits)/totalVisits)*100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-slate-500">Të Anuluara</span>
                <span className="text-slate-600">{cancelledVisits}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${totalVisits ? (cancelledVisits/totalVisits)*100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolona 2: Stafi & Emergjencat */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-5 text-white flex-1 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full"></div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
              <span>👥</span> Struktura e Stafit
            </h3>
            
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                  <span className="text-xs font-medium text-slate-200">Administratorë</span>
                </div>
                <span className="text-base font-black">{adminCount}</span>
              </div>
              
              <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs font-medium text-slate-200">Mbikëqyrës</span>
                </div>
                <span className="text-base font-black">{supervisorCount}</span>
              </div>

              <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-medium text-slate-200">Staf Terreni</span>
                </div>
                <span className="text-base font-black">{fieldWorkerCount}</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${pendingEmergencies > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${pendingEmergencies > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                ⚠️
              </div>
              <div>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${pendingEmergencies > 0 ? 'text-red-800' : 'text-slate-600'}`}>Emergjencat</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Nga {totalEmergencies} në total</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl font-black ${pendingEmergencies > 0 ? 'text-red-600' : 'text-slate-400'}`}>{pendingEmergencies}</span>
            </div>
          </div>
        </div>

        {/* Kolona 3: Regjistrimet */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🆕</span> Regjistrimet e Fundit
            </h3>
            <Link href="/admin/stafi" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline">
              Shiko &rarr;
            </Link>
          </div>
          
          <div className="flex flex-col gap-2 flex-1 justify-center">
            {latestUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[120px]">{user.full_name}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {user.role === 'admin' ? 'Admin' : user.role === 'supervisor' ? 'Mbikëqyrës' : 'Terren'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                  {new Date(user.created_at).toLocaleDateString('sq-AL', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}