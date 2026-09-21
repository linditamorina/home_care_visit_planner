'use client'

import { useState } from 'react'

export type Member = { profession?: string; full_name: string }
export type Visit = {
  id: string
  status?: string
  scheduled_start: string
  assigned_team_id?: string
  patients?: { reference_code?: string; zones?: { name?: string } } | null
  [key: string]: unknown
}
export type Team = { id: string; name?: string; shift_type?: string; users?: Member[] }

export default function TeamCard({ team, visits, zones }: { team: Team, visits: Visit[], zones: string[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Formatim i saktë i orës për të parandaluar Hydration Error
  const formatTime = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Fail-Safe: Pastrimi i stringjeve nga hapësirat dhe shkronjat e mëdha
  const safeStatus = (status: string | undefined) => status ? status.trim().toLowerCase() : ''

  // Llogaritjet Dinamike për Live Tracking
  const validVisits = visits.filter(v => safeStatus(v.status) !== 'cancelled')
  const completedVisitsCount = validVisits.filter(v => safeStatus(v.status) === 'completed').length
  const progressPercentage = validVisits.length > 0 ? Math.round((completedVisitsCount / validVisits.length) * 100) : 0
  
  // Gjetja e statusit aktual të ekipit
  const inProgressVisit = visits.find(v => safeStatus(v.status) === 'in_progress')
  
  const scheduledVisits = visits
    .filter(v => safeStatus(v.status) === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
  
  const nextVisit = scheduledVisits.length > 0 ? scheduledVisits[0] : null
  const isAllCompleted = validVisits.length > 0 && completedVisitsCount === validVisits.length

  // Përcaktimi i Statusit të Kokës së Kartës
  let headerBadge = { text: 'Në Pritje', color: 'bg-slate-50 text-slate-500 border-slate-200/50', dotColor: 'bg-slate-400', ping: false }
  
  if (inProgressVisit) {
    headerBadge = { text: 'Në Terren', color: 'bg-blue-50 text-blue-700 border-blue-100/50', dotColor: 'bg-blue-500', ping: true }
  } else if (isAllCompleted) {
    headerBadge = { text: 'I Lirë', color: 'bg-emerald-50 text-emerald-700 border-emerald-100/50', dotColor: 'bg-emerald-500', ping: false }
  } else if (nextVisit) {
    headerBadge = { text: 'Në Gatishmëri', color: 'bg-amber-50 text-amber-700 border-amber-100/50', dotColor: 'bg-amber-500', ping: false }
  }

  // Nxjerrja e stafit
  const members = team.users || []
  const doctor = members.find((m) => m.profession?.toLowerCase() === 'mjek')
  const nurses = members.filter((m) => m.profession?.toLowerCase() === 'infermier')

  return (
    <>
      <div className={`bg-white rounded-2xl border border-slate-200/75 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 flex flex-col p-4 relative group ${inProgressVisit ? 'border-blue-200 shadow-blue-900/5' : ''}`}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">{team.name}</h3>
          
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${headerBadge.color} transition-colors`}>
            {headerBadge.ping ? (
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${headerBadge.dotColor} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${headerBadge.dotColor}`}></span>
              </span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${headerBadge.dotColor}`}></span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider">{headerBadge.text}</span>
          </div>
        </div>

        {/* ZONAT */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="truncate font-medium">
            {zones.length > 0 ? zones.join(', ') : 'S\'ka zona të caktuara'}
          </span>
        </div>

        {/* STAFI (Grid simbolik zyrtar) */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="flex items-center gap-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
            <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mjek</span>
              <span className="text-xs font-semibold text-slate-700 truncate">{doctor ? doctor.full_name.split(' ')[0] : 'I pacaktuar'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
            <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Infermierë</span>
              <span className="text-xs font-semibold text-slate-700 truncate">{nurses.length}/3 caktuar</span>
            </div>
          </div>
        </div>

        {/* LIVE TRACKER MODULE (Zyrtar, pa emoji) */}
        {validVisits.length > 0 && (
          <div className={`mb-4 p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
            inProgressVisit ? 'bg-blue-50/50 border-blue-100/60' : 
            isAllCompleted ? 'bg-emerald-50/50 border-emerald-100/60' : 
            'bg-slate-50/80 border-slate-100'
          }`}>
            {inProgressVisit ? (
              <>
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Vizita në proces</span>
                  <span className="text-xs text-slate-700 font-medium truncate">Pacienti: {inProgressVisit.patients?.reference_code}</span>
                </div>
              </>
            ) : nextVisit ? (
              <>
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    E Radhës: {formatTime(nextVisit.scheduled_start)}
                  </span>
                  <span className="text-xs text-slate-700 font-medium truncate">Pacienti: {nextVisit.patients?.reference_code}</span>
                </div>
              </>
            ) : isAllCompleted ? (
              <>
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Misioni Përfundoi</span>
                  <span className="text-xs text-slate-600 font-medium truncate">Ekipi është i lirë.</span>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* AGJENDA & PROGRESS BAR */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ecuria e Vizitave</span>
            <span className="text-xs font-bold text-slate-700">{completedVisitsCount} / {validVisits.length}</span>
          </div>
          
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-slate-800'}`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={visits.length === 0}
            className={`w-full text-xs font-semibold py-2 rounded-lg transition-all ${
              visits.length > 0 
                ? 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200' 
                : 'text-slate-400 bg-slate-50/50 border border-slate-100 cursor-not-allowed'
            }`}
          >
            {visits.length > 0 ? 'Shiko Detajet e Agjendës' : 'S\'ka vizita sot'}
          </button>
        </div>
      </div>

      {/* MODALI I DETAJUAR (Profesional) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Agjenda e {team.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Detajet dhe statusi i operacioneve</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/30">
              <div className="relative space-y-4">
                
                <div className="absolute top-2 bottom-2 left-[9px] w-[2px] bg-slate-200" />

                {visits.map((visit) => {
                  const status = safeStatus(visit.status)
                  const isCompleted = status === 'completed'
                  const isInProgress = status === 'in_progress'
                  const isCancelled = status === 'cancelled'
                  
                  let dotColor = 'bg-slate-300 ring-white'
                  let statusBadge = 'bg-slate-100 text-slate-600 border border-slate-200'
                  let statusText = 'Në Pritje'
                  
                  if (isCompleted) { 
                    dotColor = 'bg-emerald-500 ring-emerald-50' 
                    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    statusText = 'E Përfunduar'
                  } else if (isInProgress) { 
                    dotColor = 'bg-blue-500 ring-blue-50 animate-pulse' 
                    statusBadge = 'bg-blue-50 text-blue-700 border-blue-200'
                    statusText = 'Në Proces'
                  } else if (isCancelled) {
                    dotColor = 'bg-red-400 ring-red-50'
                    statusBadge = 'bg-red-50 text-red-600 border-red-200'
                    statusText = 'E Anuluar'
                  }

                  return (
                    <div key={visit.id} className="relative pl-8">
                      <div className={`absolute left-[5px] top-4 w-2.5 h-2.5 rounded-full ring-4 ${dotColor} z-10`} />
                      
                      <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md ${isCancelled ? 'opacity-60' : ''} ${isInProgress ? 'border-blue-300 shadow-blue-50' : ''}`}>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-black text-slate-800">
                            {formatTime(visit.scheduled_start)}
                          </p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusBadge}`}>
                            {statusText}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Subjekti:</span>
                            <span className="font-bold text-slate-800">{visit.patients?.reference_code || 'I panjohur'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Zona:</span>
                            <span className="font-semibold text-slate-700">{visit.patients?.zones?.name || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}