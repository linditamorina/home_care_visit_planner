'use client'

export default function VisitDetailModal({
  visit,
  fieldNote,
  onClose
}: {
  visit: any
  fieldNote: any
  onClose: () => void
}) {
  if (!visit) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              Raporti Klinik i Vizitës
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Data: {new Date(visit.scheduled_start).toLocaleString('sq-AL', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all">
            ✕
          </button>
        </div>

        {/* Përmbajtja */}
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              visit.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              Statusi: {visit.status === 'completed' ? 'Përfunduar' : 'Planifikuar'}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Stafi: {visit.users?.full_name || 'I pacaktuar'}
            </span>
          </div>

          {!fieldNote ? (
            <div className="text-center py-10 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="text-3xl block mb-3">⏳</span>
              <h4 className="text-sm font-bold text-slate-800">Në Pritje të Raportit</h4>
              <p className="text-xs text-slate-500 mt-1">Nuk ka të dhëna klinike të regjistruara nga terreni për këtë vizitë.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tensioni (BP)</span>
                  <p className="text-lg font-black text-slate-800 mt-1">{fieldNote.vital_signs_bp || '-'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Pulsi (HR)</span>
                  <p className="text-lg font-black text-slate-800 mt-1">{fieldNote.vital_signs_hr || '-'}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Vëzhgimet (Gjendja, Ankesat)</span>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{fieldNote.clinical_observations}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Ndërhyrjet e Kryera</span>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{fieldNote.interventions_performed}</p>
              </div>

              {fieldNote.recommendations && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1.5">
                  <span className="text-xs font-bold text-blue-700 uppercase">Rekomandime / Udhëzime</span>
                  <p className="text-sm font-medium text-blue-900 whitespace-pre-wrap">{fieldNote.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}