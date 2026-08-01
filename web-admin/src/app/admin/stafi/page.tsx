export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import ShtoStafModal from './ShtoStafModal'
import NdryshoStafModal from './NdryshoStafModal'

export default async function MenaxhimiStafit() {
  const supabase = await createClient()

  // Tërheqim përdoruesit dhe bëjmë JOIN me tabelën 'teams' për të marrë emrin e ekipit
  const { data: users } = await supabase
    .from('users')
    .select('*, teams(name)')
    .order('created_at', { ascending: false })

  const staffList = users || []
  
  // Ndajmë përdoruesit bazuar në rolin e tyre
  const admins = staffList.filter(u => u.role === 'admin')
  const operationsStaff = staffList.filter(u => u.role !== 'admin')

  return (
    // 1. KUFIZIMI I LARTËSISË: Bllokon faqen globale nga scroll-i i padëshiruar
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-7xl mx-auto w-full">
      
      {/* 2. HEADER STATIK (flex-none) */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            ⚙️ Menaxhimi i Stafit & Ekipeve
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Shto staf, përcakto profesionet (Mjek/Infermier) dhe asenjo ekipet operacionale.
          </p>
        </div>
        <ShtoStafModal />
      </div>

      {/* 3. KONTEJNERI SCROLLABLE: Këtu brenda do të bëjnë scroll të dyja tabelat së bashku */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        
        {/* TABELA 1: Administratorët (Nuk kanë nevojë për ekip/profesion) */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden ring-1 ring-purple-100 flex-none">
          <div className="px-5 py-3 border-b border-purple-100 bg-purple-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 text-sm">🛡️</span>
              <h3 className="font-bold text-purple-900 text-sm">Administratorët e Sistemit</h3>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-purple-200">
              {admins.length} Llogari
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-white text-slate-400 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Emri i Plotë</th>
                  <th className="px-5 py-3">E-mail Adresa</th>
                  <th className="px-5 py-3">Roli</th>
                  <th className="px-5 py-3 text-right">Aksione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {admins.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500 text-xs">Nuk ka administratorë.</td></tr>
                ) : admins.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-2.5 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="truncate">{user.full_name}</span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-500">{user.email}</td>
                    <td className="px-5 py-2.5">
                      <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        Admin
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right opacity-80 group-hover:opacity-100 transition-opacity">
                      <NdryshoStafModal user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELA 2: Stafi Operativ (Me Profesion & Ekip) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-none">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>👥</span> Stafi Operativ (Terren & Mbikëqyrje)
            </h3>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {operationsStaff.length} Llogari
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-white text-slate-400 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Emri i Plotë</th>
                  <th className="px-5 py-3">Roli & Profesioni</th>
                  <th className="px-5 py-3">Ekipi i Asenjuar</th>
                  <th className="px-5 py-3 text-right">Aksione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {operationsStaff.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500 text-xs">Nuk ka staf operativ.</td></tr>
                ) : operationsStaff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate">{user.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          user.role === 'supervisor' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          {user.role === 'supervisor' ? 'Mbikëqyrës' : 'Në Terren'}
                        </span>
                        {/* Shfaqja e Profesionit */}
                        {user.profession ? (
                          <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-400"></span> {user.profession}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Pa profesion</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {/* Shfaqja e Ekipit */}
                      {user.teams?.name ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">
                          🚑 {user.teams.name}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          I pacaktuar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right opacity-80 group-hover:opacity-100 transition-opacity">
                      <NdryshoStafModal user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}