import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function DetajetEPacientit({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // 1. Marrim të dhënat e pacientit
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!patient) {
    notFound() // Shfaq faqen 404 nëse ID nuk ekziston
  }

  // 2. Marrim historikun e vizitave, duke përfshirë emrin e stafit përmes lidhjes FK
  const { data: visits } = await supabase
    .from('visits')
    .select(`
      *,
      users!assigned_staff_id (full_name)
    `)
    .eq('patient_id', patient.id)
    .order('scheduled_start', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header-i i faqes */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/pacientet"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Pacienti: {patient.reference_code}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Profili dhe historiku i plotë i vizitave
          </p>
        </div>
      </div>

      {/* Karta e Detajeve */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex gap-10">
        <div>
          <p className="text-sm font-medium text-slate-500">Grupmosha</p>
          <p className="text-lg font-semibold text-slate-900">{patient.age_group}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Zona / Regjioni</p>
          <p className="text-lg font-semibold text-slate-900">{patient.zone_id}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Regjistruar më</p>
          <p className="text-lg font-semibold text-slate-900">
            {new Date(patient.created_at).toLocaleDateString('sq-AL')}
          </p>
        </div>
      </div>

      {/* Tabela e Historikut të Vizitave */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Historiku i Vizitave</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Data e Planifikuar</th>
                <th className="px-6 py-4">Stafi i Caktuar</th>
                <th className="px-6 py-4">Statusi</th>
                <th className="px-6 py-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits?.map((visit) => (
                <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {new Date(visit.scheduled_start).toLocaleString('sq-AL', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {visit.users?.full_name || 'I pacaktuar'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                      visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      visit.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Detajet
                    </button>
                  </td>
                </tr>
              ))}

              {(!visits || visits.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nuk ka asnjë vizitë të regjistruar për këtë pacient.
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