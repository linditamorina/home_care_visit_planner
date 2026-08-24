export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import ShtoStafModal from './ShtoStafModal'
import NdryshoStafModal from './NdryshoStafModal'
import ShtoEkipModal from './ShtoEkipModal'

export default async function MenaxhimiStafit() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*, teams(name)')
    .order('created_at', { ascending: false })

  const staffList = users || []
  
  const admins = staffList.filter(u => u.role === 'admin')
  const operationsStaff = staffList.filter(u => u.role !== 'admin')

  return (
    // ZGJIDHJA INXHINIERIKE: Zëvendësuam h-[calc(100vh-6rem)] me h-full min-h-0
    // Kjo eliminon scrollin e jashtëm fantazmë dhe ruan strukturën e brendshme
    <div className="flex flex-col h-full min-h-0 max-w-7xl mx-auto w-full">
      
      {/* HEADER PROFESIONAL (flex-none e mban të palëvizshëm lart) */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Menaxhimi i Stafit & Ekipeve
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Konfiguro profilet e përdoruesve, përcakto rolet mjekësore dhe asenjo ekipet.
          </p>
        </div>
        
        {/* GRUPIMI I BUTONAVE */}
        <div className="flex items-center gap-3">
          <ShtoEkipModal />
          <ShtoStafModal />
        </div>
      </div>

      {/* KONTEJNERI I TABELAVE (Këtu ndodh scroll-i i vetëm dhe i pastër) */}
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        
        {/* SEKSIONI 1: ADMINISTRATORËT */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Administratorët
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {admins.length} Llogari
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Përdoruesi</th>
                    <th className="px-6 py-4">Kredencialet</th>
                    <th className="px-6 py-4">Niveli i Qasjes</th>
                    <th className="px-6 py-4 text-right">Menaxhimi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nuk ka administratorë në sistem.</td></tr>
                  ) : admins.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                            {user.full_name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="font-bold text-slate-800">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white shadow-sm">
                          Admin
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <NdryshoStafModal user={user} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SEKSIONI 2: STAFI OPERATIV */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Stafi Operativ (Klinik & Terren)
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {operationsStaff.length} Llogari
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Përdoruesi & Kredencialet</th>
                    <th className="px-6 py-4">Roli & Profesioni</th>
                    <th className="px-6 py-4">Ekipi i Asenjuar</th>
                    <th className="px-6 py-4 text-right">Menaxhimi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operationsStaff.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nuk ka staf operativ në sistem.</td></tr>
                  ) : operationsStaff.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{user.full_name}</span>
                            <span className="text-xs text-slate-400 mt-0.5">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            user.role === 'supervisor' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {user.role === 'supervisor' ? 'Mbikëqyrës' : 'Në Terren'}
                          </span>
                          {user.profession ? (
                            <span className="text-xs font-semibold text-slate-600">
                              {user.profession}
                            </span>
                          ) : (
                            <span className="text-xs italic text-slate-400">Pa profesion klinik</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {user.teams?.name ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            {user.teams.name}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400">I pacaktuar</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <NdryshoStafModal user={user} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}