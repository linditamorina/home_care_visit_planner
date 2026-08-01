'use client'

import { useState } from 'react'
import VisitDetailModal from './VisitDetailModal'

export default function HistorikuVizitave({ 
  visits, 
  fieldNotesMap 
}: { 
  visits: any[], 
  fieldNotesMap: Record<string, any> 
}) {
  const [selectedVisit, setSelectedVisit] = useState<any>(null)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Historiku i Vizitave</h3>
            <p className="text-xs text-slate-500 mt-1">Kliko vizitën për të hapur raportin klinik të terrenit</p>
          </div>
          <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {visits.length} Vizita
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-400 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data dhe Ora</th>
                <th className="px-6 py-4">Stafi i Terrenit</th>
                <th className="px-6 py-4">Statusi</th>
                <th className="px-6 py-4 text-right">Aksioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">Nuk ka vizita të regjistruara për këtë pacient.</td>
                </tr>
              ) : (
                visits.map((visit) => {
                  const hasNote = !!fieldNotesMap[visit.id]
                  return (
                    <tr 
                      key={visit.id} 
                      onClick={() => setSelectedVisit(visit)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {new Date(visit.scheduled_start).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{visit.users?.full_name || 'I pacaktuar'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                          visit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {visit.status === 'completed' ? 'Përfunduar' : 'Planifikuar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 font-semibold text-xs rounded-lg transition-all shadow-sm">
                          {hasNote ? 'Shiko Raportin' : 'Detajet'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renderimi i Modalit */}
      {selectedVisit && (
        <VisitDetailModal 
          visit={selectedVisit} 
          fieldNote={fieldNotesMap[selectedVisit.id]} 
          onClose={() => setSelectedVisit(null)} 
        />
      )}
    </>
  )
}