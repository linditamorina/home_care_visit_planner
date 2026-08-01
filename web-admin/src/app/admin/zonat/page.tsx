export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import ShtoZoneModal from './ShtoZoneModal'
import ZoneActions from './ZoneActions'

export default async function MenaxhimiZonave() {
  const supabase = await createClient()

  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .order('created_at', { ascending: false })

  const zonesList = zones || []

  return (
    // E lejmë faqen të marrë hapësirën e saj natyrale poshtë (pa h-screen)
    <div className="max-w-6xl mx-auto space-y-6 pb-12 w-full">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            📍 Menaxhimi i Zonave
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfiguro zonat gjeografike për shpërndarjen e pacientëve.
          </p>
        </div>
        <ShtoZoneModal />
      </div>

      {/* KONTEJNERI I TABELËS - Pa scroll të brendshëm vertical */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Koka e Tabelës */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Zonat Aktive</h3>
          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {zonesList.length} Zona
          </span>
        </div>
        
        {/* Trupi i Tabelës */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-[10px] text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Emri i Zonës</th>
                <th className="px-5 py-4">Data e Regjistrimit</th>
                <th className="px-5 py-4 text-right">Aksione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {zonesList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center">
                    <span className="text-3xl block mb-3">🌍</span>
                    <p className="text-xs text-slate-500 font-medium">Nuk ka asnjë zonë të regjistruar.</p>
                  </td>
                </tr>
              ) : (
                zonesList.map((zone) => (
                  <tr key={zone.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{zone.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                      {new Date(zone.created_at).toLocaleDateString('sq-AL', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3.5 text-right opacity-80 group-hover:opacity-100 transition-opacity">
                      <ZoneActions zone={zone} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}