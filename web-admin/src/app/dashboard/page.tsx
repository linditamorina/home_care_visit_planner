export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()

  // 1. Tërheqja e të dhënave
  const [
    { data: visits },
    { data: staff },
    { data: patients },
    { data: zones } 
  ] = await Promise.all([
    supabase.from('visits').select('*'),
    supabase.from('users').select('id').eq('role', 'field_worker'),
    supabase.from('patients').select('zone_id, zones(name)'),
    supabase.from('zones').select('name')
  ])

  // Supabase infers embedded to-one relations (patients.zones) as arrays in its generic types,
  // but at runtime `zones(name)` returns a single object here (same as elsewhere in this app).
  type PatientWithZone = { zone_id: string; zones: { name?: string } | null }

  const visitsList = visits || []
  const patientsList = (patients || []) as unknown as PatientWithZone[]
  const officialZones = zones || []
  
  // 2. Llogaritjet për Kartat e Sipërme
  const pendingVisitsCount = visitsList.filter(v => v.status === 'scheduled').length
  const activeStaffCount = staff?.length || 0
  const emergencyCount = visitsList.filter(v => v.priority === 'emergjente' && v.status !== 'completed' && v.status !== 'cancelled').length

  const now = new Date()
  const startOfDay = new Date(now.setHours(0, 0, 0, 0))
  const endOfDay = new Date(now.setHours(23, 59, 59, 999))

  const todayVisits = visitsList.filter(v => {
    const vDate = new Date(v.scheduled_start)
    return vDate >= startOfDay && vDate <= endOfDay
  })

  const todayCompleted = todayVisits.filter(v => v.status === 'completed').length
  const todayTotal = todayVisits.length
  const completionRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0

  // 3. Shpërndarja Gjeografike
  const zoneCounts: Record<string, number> = {}

  officialZones.forEach(z => {
    zoneCounts[z.name] = 0
  })

  let unassignedCount = 0
  patientsList.forEach((patient) => {
    const zoneName = patient.zones?.name
    if (zoneName && zoneCounts[zoneName] !== undefined) {
      zoneCounts[zoneName] += 1
    } else if (zoneName) {
      zoneCounts[zoneName] = (zoneCounts[zoneName] || 0) + 1
    } else {
      unassignedCount += 1
    }
  })

  if (unassignedCount > 0) {
    zoneCounts['E paspecifikuar'] = unassignedCount
  }

  const allZones = Object.entries(zoneCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const totalPatientsCount = patientsList.length
  const TOP_LIMIT = 5
  const displayZones = allZones.slice(0, TOP_LIMIT)
  const otherZones = allZones.slice(TOP_LIMIT)
  
  if (otherZones.length > 0) {
    const othersCount = otherZones.reduce((sum, z) => sum + z.count, 0)
    displayZones.push({ name: 'Të tjera', count: othersCount })
  }

  const chartColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#94a3b8']

  let currentPercentage = 0
  const gradientStops = displayZones.map((zone, idx) => {
    const color = chartColors[idx % chartColors.length]
    const percentage = totalPatientsCount > 0 ? (zone.count / totalPatientsCount) * 100 : 0
    const start = currentPercentage
    const end = currentPercentage + percentage
    currentPercentage = end
    return `${color} ${start}% ${end}%`
  }).join(', ')

  const donutStyle = totalPatientsCount > 0 
    ? { background: `conic-gradient(${gradientStops})` } 
    : { background: '#f1f5f9' }

  // 4. Statusi i Përgjithshëm
  const totalCompleted = visitsList.filter(v => v.status === 'completed').length
  const totalInProgress = visitsList.filter(v => v.status === 'in_progress').length
  const totalCancelled = visitsList.filter(v => v.status === 'cancelled').length

  // Variablat për animacionin e gjysmë-rrethit (Gauge Chart)
  const arcLength = 125.66 // Perimetri i gjysmë rrethit me rreze 40 (Pi * r)
  const strokeOffset = arcLength - (arcLength * completionRate) / 100

  return (
    <div className="max-w-[1400px] mx-auto pb-8">
      
      {/* HEADER */}
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          Paneli Administrativ
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Përmbledhja e përgjithshme e operacioneve në terren.
        </p>
      </div>

      {/* RRESHTI I SIPËRM (3 Karta Kompakte) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Link href="/dashboard/vizitat?filter=scheduled" className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 hover:border-blue-200 transition-all group flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vizita të Planifikuara</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 leading-none">{pendingVisitsCount}</span>
              <span className="text-[10px] font-medium text-slate-500">në pritje</span>
            </div>
          </div>
          <span className="w-10 h-10 rounded-full bg-blue-50/50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-sm">
            📊
          </span>
        </Link>

        <Link href="/dashboard/stafi" className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 hover:border-purple-200 transition-all group flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stafi në Terren</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 leading-none">{activeStaffCount}</span>
              <span className="text-[10px] font-medium text-slate-500">aktivë</span>
            </div>
          </div>
          <span className="w-10 h-10 rounded-full bg-purple-50/50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors text-sm">
            👥
          </span>
        </Link>

        <Link href="/dashboard/vizitat?filter=emergjente" className="bg-white rounded-xl shadow-sm border border-red-100 p-4 hover:border-red-200 transition-all group flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
          <div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">Raste Emergjente</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600 leading-none">{emergencyCount}</span>
              <span className="text-[10px] font-medium text-red-400">kërkojnë vëmendje</span>
            </div>
          </div>
          <span className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center animate-pulse text-sm mr-3">
            ⚠️
          </span>
        </Link>
      </div>

      {/* RRESHTI I MESIT (Progresi dhe Gjeografia) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        
        {/* KARTA E MAJTË: Progresi i Ditës (Tani me gjysmë-rreth profesional) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 flex flex-col items-center justify-center relative min-h-[200px]">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 w-full text-left">
            Progresi i Ditës së Sotme
          </h3>
          
          <div className="relative w-full max-w-[200px] mt-4">
            {/* SVG Gauge Chart */}
            <svg viewBox="0 0 100 55" className="w-full overflow-visible drop-shadow-sm">
              {/* Vija Background */}
              <path 
                d="M 10,50 A 40,40 0 0,1 90,50" 
                fill="none" 
                stroke="#f1f5f9" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
              {/* Vija e Progresit */}
              <path 
                d="M 10,50 A 40,40 0 0,1 90,50" 
                fill="none" 
                stroke={completionRate === 100 ? '#10b981' : '#3b82f6'} 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Teksti në qendër të gjysmë-rrethit */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2">
              <span className="text-4xl font-black text-slate-800 leading-none">{completionRate}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Kryer
              </span>
            </div>
          </div>

          <div className="mt-4 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-600">
              <strong className="text-slate-800">{todayCompleted}</strong> nga <strong className="text-slate-800">{todayTotal}</strong> vizita
            </span>
          </div>
        </div>

        {/* KARTA E DJATHTË: Gjeografia */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 flex flex-col min-h-[200px]">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5 flex-none">Përqendrimi i Pacientit</h3>
          
          <div className="flex-1 flex items-center justify-between gap-4">
            {/* Lista e Legjendës */}
            <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-3 overflow-y-auto pr-1 h-full content-center">
              {displayZones.map((zone, idx) => {
                const sharePercentage = totalPatientsCount > 0 ? Math.round((zone.count / totalPatientsCount) * 100) : 0
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 shadow-sm" 
                      style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                    ></span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 truncate" title={zone.name}>{zone.name}</span>
                      <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                        {zone.count} pac. <span className="font-semibold text-slate-500 ml-1">{sharePercentage}%</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Grafiku Donut */}
            <div className="relative w-28 h-28 flex-shrink-0 rounded-full shadow-sm" style={donutStyle}>
              <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-xl font-black text-slate-800 leading-none">{totalPatientsCount}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RRESHTI I POSHTËM I RI: Pasqyra e Përgjithshme */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
          Pasqyra e Përgjithshme e Statusit
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50 transition-colors hover:bg-emerald-50">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Të Kryera</span>
              <span className="text-3xl font-black text-emerald-600 leading-none">{totalCompleted}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              ✓
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">Në Proces</span>
              <span className="text-3xl font-black text-blue-600 leading-none">{totalInProgress}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              ⚡
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 transition-colors hover:bg-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Të Anuluara</span>
              <span className="text-3xl font-black text-slate-700 leading-none">{totalCancelled}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              ✕
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}