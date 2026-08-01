export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()

  // 1. Tërheqja e të dhënave në mënyrë paralele
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

  const visitsList = visits || []
  const patientsList = patients || []
  const officialZones = zones || []
  
  // 2. Llogaritjet për Kartat e Sipërme
  const pendingVisitsCount = visitsList.filter(v => v.status === 'scheduled').length
  const activeStaffCount = staff?.length || 0
  const emergencyCount = visitsList.filter(v => v.priority === 'emergjente' && v.status !== 'completed' && v.status !== 'cancelled').length

  // 3. Llogaritjet për Analitikat e Reja (Efikasiteti Ditor)
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

  // 4. Llogaritjet për Shpërndarjen Gjeografike (Logjika për Grafikut Donut)
  const zoneCounts: Record<string, number> = {}

  officialZones.forEach(z => {
    zoneCounts[z.name] = 0
  })

  let unassignedCount = 0
  patientsList.forEach((patient: any) => {
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

  // --- LOGJIKA E GRAFIKUT DONUT ---
  const TOP_LIMIT = 5
  let displayZones = allZones.slice(0, TOP_LIMIT)
  const otherZones = allZones.slice(TOP_LIMIT)
  
  if (otherZones.length > 0) {
    const othersCount = otherZones.reduce((sum, z) => sum + z.count, 0)
    displayZones.push({ name: 'Të tjera', count: othersCount })
  }

  // Ngjyra të bukura, moderne dhe me kontrast për grafikun
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

  // 5. Statusi i Përgjithshëm
  const totalCompleted = visitsList.filter(v => v.status === 'completed').length
  const totalInProgress = visitsList.filter(v => v.status === 'in_progress').length
  const totalCancelled = visitsList.filter(v => v.status === 'cancelled').length

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          Paneli Administrativ
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Përmbledhja e përgjithshme e operacioneve në terren dhe gjendjes së sistemit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/vizitat" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vizita të Planifikuara</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              📊
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-slate-800">{pendingVisitsCount}</span>
            <span className="text-sm font-medium text-slate-500 mb-1">në pritje për t'u kryer</span>
          </div>
        </Link>

        <Link href="/dashboard/stafi" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stafi në Terren</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              👥
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-slate-800">{activeStaffCount}</span>
            <span className="text-sm font-medium text-slate-500 mb-1">punëtorë aktivë</span>
          </div>
        </Link>

        <Link href="/dashboard/vizitat?filter=emergjente" className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 hover:shadow-md hover:border-red-300 transition-all group bg-red-50/30">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Raste Emergjente</span>
            <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
              ⚠️
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-red-600">{emergencyCount}</span>
            <span className="text-sm font-medium text-red-500 mb-1">kërkojnë vëmendje</span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <span>📈</span> Progresi i Ditës së Sotme
          </h3>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-4xl font-black text-slate-800">{completionRate}%</span>
              <span className="text-sm font-bold text-slate-500 mb-1">
                {todayCompleted} nga {todayTotal} vizita të përfunduara
              </span>
            </div>
            
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  completionRate === 100 ? 'bg-emerald-500' : 
                  completionRate > 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center italic">
              Kjo metrikë reflekton vetëm vizitat e planifikuara për datën e sotme.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              <span>📍</span> Përqendrimi i Pacientëve
            </h3>
            
            {/* Dizajni VIZUAL Donut Chart & Legend */}
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 justify-center mt-2">
              
              {/* Grafiku Unazë (Donut) */}
              <div className="relative w-36 h-36 rounded-full flex-shrink-0 transition-transform hover:scale-105" style={donutStyle}>
                <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                  <span className="text-3xl font-black text-slate-800 leading-none">{totalPatientsCount}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                </div>
              </div>

              {/* Legjenda Grid - Shmang Scroll-in */}
              <div className="w-full sm:flex-1 grid grid-cols-2 gap-x-2 gap-y-4">
                {displayZones.map((zone, idx) => {
                  const sharePercentage = totalPatientsCount > 0 ? Math.round((zone.count / totalPatientsCount) * 100) : 0
                  
                  return (
                    <div key={idx} className="flex items-start gap-2.5 group">
                      <span 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0 shadow-sm transition-transform group-hover:scale-125" 
                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                      ></span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 truncate" title={zone.name}>
                          {zone.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {zone.count} pac. <span className="text-slate-300">|</span> <span className="font-semibold text-slate-600">{sharePercentage}%</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>📊</span> Pasqyra Globale e Sistemit
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xl font-bold text-emerald-600">{totalCompleted}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Të Kryera</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xl font-bold text-purple-600">{totalInProgress}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Në Proces</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xl font-bold text-slate-600">{totalCancelled}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Të Anuluara</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}