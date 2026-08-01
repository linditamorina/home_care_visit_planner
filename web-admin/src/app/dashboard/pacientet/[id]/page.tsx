import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NdryshoPacientModal from './NdryshoPacientModal'
import HistorikuVizitave from './HistorikuVizitave'

export default async function DetajetEPacientit({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const patientId = resolvedParams.id

  if (!patientId || patientId === 'undefined') notFound()

  const supabase = await createClient()

  // 1. Marrim Profilin dhe bëjmë lidhjen me tabelën zones
  const { data: patient } = await supabase
    .from('patients')
    .select('*, zones(name)') // <-- NDRYSHIMI KËTU
    .eq('id', patientId)
    .maybeSingle()

  if (!patient) notFound()

  // 2. Marrim Vizitat
  const { data: visits } = await supabase
    .from('visits')
    .select(`*, users!assigned_staff_id (full_name)`)
    .eq('patient_id', patient.id)
    .order('scheduled_start', { ascending: false })

  const visitsList = visits || []

  // 3. Marrim Raportet Klinike vetëm për këto vizita
  const fieldNotesMap: Record<string, any> = {}
  if (visitsList.length > 0) {
    const visitIds = visitsList.map((v: any) => v.id)
    const { data: notesData } = await supabase
      .from('field_notes')
      .select('*')
      .in('visit_id', visitIds)
      
    notesData?.forEach((note) => {
      fieldNotesMap[note.visit_id] = note
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header-i */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pacientet" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              {patient.reference_code}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Profili Mjekësor i Pacientit</p>
          </div>
        </div>
        <NdryshoPacientModal patient={patient} />
      </div>

      {/* Kartat e Lokacionit dhe Shëndetit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">📍 Lokacioni</h3>
          {/* NDRYSHIMI KËTU: Tregojmë emrin e zonës */}
          <p className="text-slate-900 font-medium">{patient.zones?.name || 'Zonë e panjohur'}</p>
          <p className="text-slate-500 text-sm mt-1">{patient.address}</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">⚕️ Kushtet Mjekësore & Alergjitë</h3>
          <p className="text-slate-900 font-medium">{patient.medical_conditions || 'Nuk ka të dhëna'}</p>
        </div>
      </div>

      {/* Tabela Interaktive me Modal */}
      <HistorikuVizitave visits={visitsList} fieldNotesMap={fieldNotesMap} />
    </div>
  )
}