export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'

// 1. Fjalori i Plotësuar i Përkthimeve
const fieldTranslations: Record<string, string> = {
  status: 'Statusi',
  priority: 'Prioriteti',
  care_category: 'Kategoria e Shërbimit',
  actual_start: 'Koha e Fiksuar (Check-In)',
  actual_end: 'Koha e Përfundimit (Check-Out)',
  scheduled_start: 'Orari i Planifikuar',
  scheduled_end: 'Orari i Përfundimit',
  patient_id: 'ID e Pacientit',
  assigned_team_id: 'Ekipi i Asenjuar',
  clinical_observations: 'Vëzhgimet Objektive',
  doctor_therapy: 'Detyrat e Kryera',
  interventions_performed: 'Ndërhyrjet e Kryera',
  vital_signs_bp: 'Tensioni (BP)',
  vital_signs_hr: 'Pulsi (HR)',
  vital_signs_spo2: 'Oksigjeni (SpO2)',
  vital_signs_temp: 'Temperatura',
  lab_results: 'Rezultatet Laboratorike',
  requested_lab_tests: 'Analizat e Kërkuara',
  is_patient_notified: 'Pacienti i Njoftuar',
  full_name: 'Emri i Plotë',
  role: 'Roli / Pozicioni',
  name: 'Emri'
}

// 2. Formatimi Inteligjent i Vlerave (Trajtimi i Datave, Booleans dhe UUIDs)
const formatValue = (key: string, val: unknown) => {
  if (val === null || val === undefined || val === '') return <span className="text-slate-400 italic">Bosh</span>
  if (typeof val === 'boolean') return val ? 'Po' : 'Jo'

  if (key === 'status' && typeof val === 'string') {
    const statuses: Record<string, string> = {
      scheduled: 'Në Pritje',
      in_progress: 'Në Zhvillim (Check-In)',
      completed: 'Përfunduar (Check-Out)',
      cancelled: 'Anuluar'
    }
    return statuses[val] || val
  }

  // Shkurtimi i UUID-ve të gjata (p.sh. ID e pacientit ose ekipit)
  if (typeof val === 'string' && val.length === 36 && val.includes('-')) {
    return (
      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500" title={val}>
        {val.substring(0, 8)}...
      </span>
    )
  }

  // Formatimi i datave ISO
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(val).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })
  }

  return String(val)
}

// 3. UI Profesional i Ndryshimeve (GitHub Diff Style)
const LogDetailsViewer = ({ action, oldData, newData }: { action: string, oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null }) => {
  const ignoredFields = ['id', 'uuid', 'created_at', 'updated_at', 'visit_id', 'actor_id', 'user_id', 'nurse_id', 'doctor_id', 'laborant_id']

  if (action === 'UPDATE' && oldData && newData) {
    const changedKeys = Object.keys(newData).filter(key => 
      !ignoredFields.includes(key) && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
    )

    if (changedKeys.length === 0) return <p className="text-slate-400 italic text-[11px]">Ndryshime teknike në prapaskenë.</p>

    return (
      <div className="flex flex-col gap-2">
        {changedKeys.map(key => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[11px]">
            <span className="w-36 font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0">
              {fieldTranslations[key] || key}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 line-through opacity-80">
                {formatValue(key, oldData[key])}
              </span>
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-semibold">
                {formatValue(key, newData[key])}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'INSERT' && newData) {
    const keys = Object.keys(newData).filter(k => !ignoredFields.includes(k) && newData[k] !== null)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {keys.map(key => (
          <div key={key} className="flex flex-col gap-0.5 text-[11px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{fieldTranslations[key] || key}</span>
            <span className="font-medium text-slate-700">{formatValue(key, newData[key])}</span>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'DELETE' && oldData) {
    const keys = Object.keys(oldData).filter(k => !ignoredFields.includes(k) && oldData[k] !== null)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 opacity-70">
        {keys.map(key => (
          <div key={key} className="flex flex-col gap-0.5 text-[11px]">
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">{fieldTranslations[key] || key}</span>
            <span className="font-medium text-slate-600 line-through">{formatValue(key, oldData[key])}</span>
          </div>
        ))}
      </div>
    )
  }

  return <p className="text-slate-400 italic text-[11px]">Detajet nuk janë të disponueshme.</p>
}

const formatLogAction = (action: string, table: string) => {
  const tableNames: Record<string, string> = { visits: 'Vizitë', patients: 'Pacient', users: 'Përdorues', teams: 'Ekip', field_notes: 'Raport Terreni' }
  const tableName = tableNames[table] || table
  switch (action) { case 'INSERT': return `Krijoi një ${tableName} të re`; case 'UPDATE': return `Përditësoi të dhënat e ${tableName}`; case 'DELETE': return `Fshiu një ${tableName}`; default: return `${action} në ${tableName}` }
}

const getActionColor = (action: string) => {
  switch (action) { case 'INSERT': return 'bg-emerald-100 text-emerald-700 border-emerald-200'; case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200'; case 'DELETE': return 'bg-red-100 text-red-700 border-red-200'; default: return 'bg-slate-100 text-slate-700 border-slate-200' }
}

export default async function AuditLogsPage() {
  const supabase = await createClient()

  const { data: logs, error: logsError } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(500)

  if (logsError) console.error("ERROR:", logsError)

  const { data: usersList } = await supabase.from('users').select('id, full_name, role')

  const auditLogs = logs?.map(log => {
    const matchedUser = usersList?.find(u => u.id === log.user_id)
    return { ...log, users: matchedUser || null }
  }) || []

  return (
    <div className="flex flex-col h-full min-h-0 max-w-7xl mx-auto w-full">
      <div className="flex-none flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Regjistri i Auditimit (Audit Logs)</h2>
          <p className="text-sm text-slate-500 mt-1">Gjurmimi i të gjitha veprimeve të kryera në sistem për arsye sigurie dhe transparence.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
            {auditLogs.length} Veprimet e Fundit
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4 w-40">Data & Ora</th>
                  <th className="px-6 py-4 w-52">Përdoruesi</th>
                  <th className="px-6 py-4 w-60">Veprimi & Entiteti</th>
                  <th className="px-6 py-4">Detajet e Ndryshimit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nuk u gjet asnjë gjurmë auditimi.</td></tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.uuid || log.id} className="hover:bg-slate-50/40 transition-colors">
                      
                      <td className="px-6 py-5 align-top">
                        <div className="font-bold text-slate-800">{new Date(log.timestamp).toLocaleDateString('sq-AL')}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{new Date(log.timestamp).toLocaleTimeString('sq-AL')}</div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        {log.users ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {log.users.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-xs">{log.users.full_name}</span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{log.users.role.replace('_', ' ')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-500 text-xs italic">Sistemi / Apikacioni</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-mono font-bold rounded">
                              🗄️ {log.table_name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {formatLogAction(log.action, log.table_name)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <LogDetailsViewer 
                          action={log.action} 
                          oldData={log.previous_data} 
                          newData={log.new_data} 
                        />
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}