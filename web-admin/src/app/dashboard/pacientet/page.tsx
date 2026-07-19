import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function PacientetPage() {
  const supabase = await createClient()

  // Marrim listën e pacientëve sintetikë nga databaza (të renditur nga më i riu)
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-500">Gabim gjatë ngarkimit të të dhënave: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lista e Personave (Pacientët)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Menaxhimi i profileve të pseudonimizuara dhe historikut të tyre.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Shto Pacient të Ri
        </button>
      </div>

      {/* Tabela Vizuale e Pacientëve */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Kodi i Referencës</th>
                <th className="px-6 py-4">Grupmosha</th>
                <th className="px-6 py-4">Zona / Regjioni</th>
                <th className="px-6 py-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients?.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {patient.reference_code}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {patient.age_group}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {patient.zone_id}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/pacientet/${patient.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Shiko Historikun &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              
              {(!patients || patients.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nuk u gjet asnjë pacient në databazë.
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