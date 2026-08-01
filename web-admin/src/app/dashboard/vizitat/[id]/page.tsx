import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function DetajetEVizites({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const visitId = resolvedParams.id

  if (!visitId || visitId === 'undefined') notFound()

  const supabase = await createClient()

  // 1. Marrim të dhënat e vizitës duke përfshirë edhe pacientin dhe stafin (JOIN)
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select(`
      *,
      patients (*),
      users!assigned_staff_id (full_name)
    `)
    .eq('id', visitId)
    .maybeSingle()

  if (visitError || !visit) notFound()

  // 2. Marrim raportin klinik (nëse ekziston)
  const { data: fieldNote } = await supabase
    .from('field_notes')
    .select('*')
    .eq('visit_id', visitId)
    .maybeSingle()

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header i faqes */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Link 
          href="/dashboard/pacientet" 
          className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Detajet e Vizitës
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              visit.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
              visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              {visit.status === 'completed' ? 'E Përfunduar' : visit.status === 'scheduled' ? 'E Planifikuar' : 'Në Proces'}
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Pacienti: <Link href={`/dashboard/pacientet/${visit.patients?.id}`} className="text-blue-600 hover:underline">{visit.patients?.reference_code}</Link>
          </p>
        </div>
      </div>

      {/* Kartat e Logjistikës */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data dhe Ora</p>
          <p className="text-lg font-bold text-slate-800">
            {new Date(visit.scheduled_start).toLocaleString('sq-AL', { 
              weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stafi i Caktuar</p>
          <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
              {visit.users?.full_name?.charAt(0) || '?'}
            </span>
            {visit.users?.full_name || 'I pacaktuar'}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Adresa e Pacientit</p>
          <p className="text-base font-bold text-slate-800">{visit.patients?.address || 'E paspecifikuar'}</p>
          <p className="text-sm font-medium text-slate-500 mt-0.5">{visit.patients?.zone_id}</p>
        </div>
      </div>
    </div>
  )
}