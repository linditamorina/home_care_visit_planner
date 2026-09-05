'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import ShtoPacientModal from './ShtoPacientModal'

export default function PacientetPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')

  const supabase = createClient()

  async function loadPatients() {
    setLoading(true)
    // NDRYSHIMI: Bëjmë JOIN me tabelën zones për të marrë emrin
    const { data, error } = await supabase
      .from('patients')
      .select('*, zones(name)') 
      .order('created_at', { ascending: false })

    if (!error && data) {
      // DEBUG: Shiko në Console (F12) nëse objekti i pacientit e ka kolonën 'id' apo quhet ndryshe (psh. 'pacient_id')
      console.log("Të dhënat nga Supabase:", data) 
      setPatients(data)
    } else if (error) {
      console.error("Gabim gjatë marrjes së pacientëve:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  // NDRYSHIMI: Marrim emrat unikë të zonave nga objekti i lidhur 'zones'
  const uniqueZones = Array.from(
    new Set(
      patients
        .map(p => p.zones?.name)
        .filter(Boolean)
    )
  )

  // NDRYSHIMI: Filtrojmë duke përdorur p.zones.name në vend të p.zone_id
  const filteredPatients = patients.filter(patient => {
    // Shtuar opsional chaining (?.) tek reference_code për të parandaluar crash nëse është null
    const matchesSearch = patient.reference_code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
    const matchesZone = zoneFilter === 'all' || patient.zones?.name === zoneFilter
    return matchesSearch && matchesZone
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lista e Personave (Pacientët)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Menaxhimi i profileve të pseudonimizuara dhe historikut të tyre.
          </p>
        </div>
        <ShtoPacientModal onPatientAdded={loadPatients} />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-sm font-bold">Totali: {filteredPatients.length}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Kërko kodin (psh. PAT-...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 text-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
            />
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 text-slate-950 cursor-pointer w-full sm:w-48"
          >
            <option value="all">Të gjitha Zonat</option>
            {uniqueZones.map((zone, index) => (
              <option key={index} value={zone as string}>{zone as string}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Kodi i Referencës</th>
                <th className="px-6 py-4">Grupmosha</th>
                <th className="px-6 py-4">Zona / Regjioni</th>
                <th className="px-6 py-4">Të Dhëna Shtesë</th>
                <th className="px-6 py-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 animate-pulse">
                    Duke ngarkuar pacientët...
                  </td>
                </tr>
              ) : filteredPatients.map((patient, index) => (
                <tr key={patient.id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {patient.reference_code}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {patient.age_group}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {patient.zones?.name || 'Pa zonë'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {patient.allergies ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                        ⚠️ Alergjik
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/pacientet/${patient.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      onClick={(e) => {
                        // Kjo pengon 404-ën dhe të tregon nëse ID mungon vërtet
                        if (!patient.id) {
                          e.preventDefault();
                          alert(`Gabim: Ky pacient (${patient.reference_code}) nuk ka ID. Kontrollo Console!`);
                          console.error("Pacienti pa ID:", patient);
                        }
                      }}
                    >
                      Shiko Historikun &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <p className="text-slate-500 font-medium">Nuk u gjet asnjë pacient që përputhet me filtrat.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}