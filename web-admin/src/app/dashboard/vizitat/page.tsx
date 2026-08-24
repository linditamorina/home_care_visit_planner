// 'use client'

// import { useState, useEffect } from 'react'
// import { createClient } from '@/utils/supabase/client'
// import KrijoViziteModal from './KrijoViziteModal'
// import NdryshoViziteModal from './NdryshoViziteModal'
// import { anuloVizite } from './actions'
// import { useSearchParams } from 'next/navigation'

// export default function VizitatPage() {
//   const [visits, setVisits] = useState<any[]>([])
//   const [patientsList, setPatientsList] = useState<any[]>([])
//   const [teamsList, setTeamsList] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)

//   const searchParams = useSearchParams()
//   const urlFilter = searchParams.get('filter')

//   const [filter, setFilter] = useState<string>('all')
//   const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'created_desc'>('date_asc')

//   useEffect(() => {
//     if (urlFilter) {
//       setFilter(urlFilter)
//     }
//   }, [urlFilter])
  
//   const [visitToCancel, setVisitToCancel] = useState<string | null>(null)
//   const [isCancelling, setIsCancelling] = useState(false)

//   const supabase = createClient()

//   async function loadData() {
//     const { data: pList } = await supabase.from('patients').select('id, reference_code, zones(name)')
//     setPatientsList(pList || [])

//     const { data: tList } = await supabase.from('teams').select('id, name, shift_type')
//     setTeamsList(tList || [])

//     const { data: vList } = await supabase
//       .from('visits')
//       .select(`
//         *,
//         patients (
//           reference_code,
//           zone_id,
//           zones (name)
//         ),
//         teams (name)
//       `)

//     setVisits(vList || [])
//     setLoading(false)
//   }

//   useEffect(() => {
//     loadData()

//     const channel = supabase
//       .channel('live-visits')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
//         loadData()
//       })
//       .subscribe()

//     return () => {
//       supabase.removeChannel(channel)
//     }
//   }, [])

//   async function confirmCancel() {
//     if (!visitToCancel) return
//     setIsCancelling(true)
    
//     const res = await anuloVizite(visitToCancel)
//     if (res.success) {
//       await loadData()
//       setVisitToCancel(null) 
//     } else {
//       alert(res.error)
//     }
    
//     setIsCancelling(false)
//   }

//   const now = new Date()
//   const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

//   const counts = {
//     all: visits.length,
//     deadline: visits.filter(v => v.status === 'scheduled' && new Date(v.scheduled_start) >= now && new Date(v.scheduled_start) <= in24Hours).length,
//     emergjente: visits.filter(v => v.priority === 'emergjente').length,
//     scheduled: visits.filter(v => v.status === 'scheduled').length,
//     in_progress: visits.filter(v => v.status === 'in_progress').length,
//     completed: visits.filter(v => v.status === 'completed').length,
//     cancelled: visits.filter(v => v.status === 'cancelled').length,
//   }

//   const filteredVisits = visits.filter(visit => {
//     if (filter === 'all') return true
//     if (filter === 'emergjente') return visit.priority === 'emergjente'
//     if (filter === 'scheduled') return visit.status === 'scheduled'
//     if (filter === 'in_progress') return visit.status === 'in_progress'
//     if (filter === 'completed') return visit.status === 'completed'
//     if (filter === 'cancelled') return visit.status === 'cancelled'
    
//     if (filter === 'deadline') {
//       const vDate = new Date(visit.scheduled_start)
//       return visit.status === 'scheduled' && vDate >= now && vDate <= in24Hours
//     }

//     return true
//   })

//   const sortedAndFilteredVisits = [...filteredVisits].sort((a, b) => {
//     if (sortBy === 'date_asc') {
//       return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
//     }
//     if (sortBy === 'date_desc') {
//       return new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
//     }
//     if (sortBy === 'created_desc') {
//       return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//     }
//     return 0
//   })

//   const ktheStatusinNeShqip = (status: string) => {
//     switch (status) {
//       case 'scheduled': return 'E PLANIFIKUAR'
//       case 'in_progress': return 'NË PROCES'
//       case 'completed': return 'E PËRFUNDUAR'
//       case 'cancelled': return 'E ANULUAR'
//       default: return status.toUpperCase()
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-800">Planifikimi i Vizitave</h2>
//           <p className="text-sm text-slate-500 mt-1">
//             Menaxhimi logjistik i orareve, prioriteteve dhe stafit në terren.
//           </p>
//         </div>
//         <KrijoViziteModal patients={patientsList} teams={teamsList} />
//       </div>

//       <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
//         <div className="flex flex-wrap items-center gap-2 flex-1">
//           <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filtro:</span>
          
//           <button
//             onClick={() => setFilter('all')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
//               filter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//             }`}
//           >
//             Të gjitha ({counts.all})
//           </button>

//           <button
//             onClick={() => setFilter('deadline')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
//               filter === 'deadline' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
//             }`}
//           >
//             Afër Deadline ({counts.deadline})
//           </button>

//           <button
//             onClick={() => setFilter('emergjente')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
//               filter === 'emergjente' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
//             }`}
//           >
//             Emergjente ({counts.emergjente})
//           </button>

//           <button
//             onClick={() => setFilter('scheduled')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
//               filter === 'scheduled' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
//             }`}
//           >
//             E Planifikuar ({counts.scheduled})
//           </button>

//           <button
//             onClick={() => setFilter('in_progress')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
//               filter === 'in_progress' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
//             }`}
//           >
//             Në Proces ({counts.in_progress})
//           </button>

//           <button
//             onClick={() => setFilter('completed')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
//               filter === 'completed' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
//             }`}
//           >
//             E PËRFUNDUAR ({counts.completed})
//           </button>

//           <button
//             onClick={() => setFilter('cancelled')}
//             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
//               filter === 'cancelled' ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
//             }`}
//           >
//             E Anuluar ({counts.cancelled})
//           </button>
//         </div>

//         <div className="flex items-center gap-2 sm:ml-auto border-l border-slate-200 pl-4">
//           <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Rendit:</span>
//           <select
//             value={sortBy}
//             onChange={(e: any) => setSortBy(e.target.value)}
//             className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
//           >
//             <option value="date_asc">Sipas Orarit (Më të afërtat)</option>
//             <option value="date_desc">Sipas Orarit (Më të largëtat)</option>
//             <option value="created_desc">Të shtuara së fundmi</option>
//           </select>
//         </div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left text-sm text-slate-600">
//             <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
//               <tr>
//                 <th className="px-6 py-4">Data & Ora</th>
//                 <th className="px-6 py-4">Pacienti / Zona</th>
//                 <th className="px-6 py-4">Ekipi Operacional</th>
//                 <th className="px-6 py-4">Kategoria e Kujdesit</th>
//                 <th className="px-6 py-4">Statusi & Prioriteti</th>
//                 <th className="px-6 py-4 text-right">Veprime</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {loading && visits.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="px-6 py-8 text-center text-slate-400 animate-pulse">
//                     Po ngarkohen vizitat...
//                   </td>
//                 </tr>
//               ) : sortedAndFilteredVisits.map((visit) => (
//                 <tr key={visit.id} className={`hover:bg-slate-50 transition-colors ${visit.priority === 'emergjente' ? 'bg-red-50/20' : ''}`}>
//                   <td className="px-6 py-4">
//                     <div className="font-semibold text-slate-900">
//                       {new Date(visit.scheduled_start).toLocaleDateString('sq-AL')}
//                     </div>
//                     <div className="text-xs text-slate-500 mt-0.5 font-medium">
//                       {new Date(visit.scheduled_start).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
//                     </div>
//                   </td>
                  
//                   <td className="px-6 py-4">
//                     <div className="font-bold text-slate-800">
//                       {visit.patients?.reference_code}
//                     </div>
//                     <div className="text-xs flex items-center gap-1 text-slate-500 mt-0.5">
//                       <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
//                       {visit.patients?.zones?.name || 'Zonë e papërcaktuar'}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4">
//                     {visit.teams?.name ? (
//                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
//                         <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                         </svg>
//                         {visit.teams.name}
//                       </span>
//                     ) : (
//                       <span className="text-xs font-medium text-slate-400 italic">I pacaktuar</span>
//                     )}
//                   </td>

//                   <td className="px-6 py-4">
//                     <div className="font-medium text-slate-700">{visit.care_category || 'E përgjithshme'}</div>
//                     <div className="mt-1">
//                       {visit.is_patient_notified ? (
//                         <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
//                           ✓ I Njoftuar
//                         </span>
//                       ) : (
//                         <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
//                           ⏱ Nuk është njoftuar
//                         </span>
//                       )}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4">
//                     <div className="flex flex-col gap-1.5 items-start">
//                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
//                         visit.status === 'completed' ? 'bg-green-100 text-green-800' :
//                         visit.status === 'in_progress' ? 'bg-purple-100 text-purple-800 animate-pulse' :
//                         visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
//                         visit.status === 'cancelled' ? 'bg-slate-200 text-slate-600 line-through' :
//                         'bg-yellow-100 text-yellow-800'
//                       }`}>
//                         {ktheStatusinNeShqip(visit.status)}
//                       </span>
//                       {visit.priority === 'emergjente' && (
//                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 animate-pulse">
//                           ⚠️ EMERGJENTE
//                         </span>
//                       )}
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 text-right">
//                     <div className="flex items-center justify-end gap-3">
//                       <NdryshoViziteModal visit={visit} />
                      
//                       {visit.status !== 'cancelled' && (
//                         <button
//                           onClick={() => setVisitToCancel(visit.id)}
//                           className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline transition-colors"
//                         >
//                           Anulo
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               ))}

//               {!loading && sortedAndFilteredVisits.length === 0 && (
//                 <tr>
//                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
//                     Nuk u gjet asnjë vizitë për këtë filtër.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {visitToCancel && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
//           <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-left">
//             <div className="p-6">
//               <div className="flex items-start gap-4">
//                 <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
//                   <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-bold text-slate-800">Anulo Vizitën</h3>
//                   <p className="text-sm text-slate-500 mt-2 leading-relaxed">
//                     A jeni të sigurt që dëshironi ta anuloni këtë vizitë? Kjo vizitë do të markohet si e anuluar në sistem dhe orari përkatës do të lirohet automatikisht për pacientë të tjerë.
//                   </p>
//                 </div>
//               </div>
//               <div className="flex justify-end gap-3 mt-8">
//                 <button 
//                   onClick={() => setVisitToCancel(null)} 
//                   disabled={isCancelling}
//                   className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
//                 >
//                   Kthehu
//                 </button>
//                 <button 
//                   onClick={confirmCancel} 
//                   disabled={isCancelling}
//                   className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
//                 >
//                   {isCancelling ? 'Po anulohet...' : 'Po, Anuloje'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import KrijoViziteModal from './KrijoViziteModal'
import NdryshoViziteModal from './NdryshoViziteModal'
import { anuloVizite } from './actions'
import { useSearchParams } from 'next/navigation'

export default function VizitatPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [patientsList, setPatientsList] = useState<any[]>([])
  const [teamsList, setTeamsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  const urlFilter = searchParams.get('filter')

  // === STATE PËR FILTRAT E RINJ ===
  const [searchQuery, setSearchQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'created_desc'>('date_asc')

  useEffect(() => {
    if (urlFilter) {
      setFilter(urlFilter)
    }
  }, [urlFilter])
  
  const [visitToCancel, setVisitToCancel] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const supabase = createClient()

  async function loadData() {
    const { data: pList } = await supabase.from('patients').select('id, reference_code, zones(name)')
    setPatientsList(pList || [])

    const { data: tList } = await supabase.from('teams').select('id, name, shift_type')
    setTeamsList(tList || [])

    const { data: vList } = await supabase
      .from('visits')
      .select(`
        *,
        patients (
          reference_code,
          zone_id,
          zones (name)
        ),
        teams (name)
      `)

    setVisits(vList || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('live-visits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function confirmCancel() {
    if (!visitToCancel) return
    setIsCancelling(true)
    
    const res = await anuloVizite(visitToCancel)
    if (res.success) {
      await loadData()
      setVisitToCancel(null) 
    } else {
      alert(res.error)
    }
    
    setIsCancelling(false)
  }

  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // === LOGJIKA E KËRKIMIT DHE EKIPIT ===
  const baseFilteredVisits = visits.filter(visit => {
    let matchesTeam = true
    if (teamFilter !== 'all') {
      matchesTeam = visit.assigned_team_id === teamFilter
    }

    let matchesSearch = true
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const patientCode = visit.patients?.reference_code?.toLowerCase() || ''
      const zoneName = visit.patients?.zones?.name?.toLowerCase() || ''
      const careCategory = visit.care_category?.toLowerCase() || ''
      const teamName = visit.teams?.name?.toLowerCase() || ''
      
      matchesSearch = 
        patientCode.includes(query) || 
        zoneName.includes(query) || 
        careCategory.includes(query) ||
        teamName.includes(query)
    }

    return matchesTeam && matchesSearch
  })

  // Numrat llogariten vetëm për vizitat që kalojnë Search-in dhe Ekipin
  const counts = {
    all: baseFilteredVisits.length,
    deadline: baseFilteredVisits.filter(v => v.status === 'scheduled' && new Date(v.scheduled_start) >= now && new Date(v.scheduled_start) <= in24Hours).length,
    emergjente: baseFilteredVisits.filter(v => v.priority === 'emergjente').length,
    scheduled: baseFilteredVisits.filter(v => v.status === 'scheduled').length,
    in_progress: baseFilteredVisits.filter(v => v.status === 'in_progress').length,
    completed: baseFilteredVisits.filter(v => v.status === 'completed').length,
    cancelled: baseFilteredVisits.filter(v => v.status === 'cancelled').length,
  }

  // Filtrimi final bazuar në butonat e statusit
  const filteredVisits = baseFilteredVisits.filter(visit => {
    if (filter === 'all') return true
    if (filter === 'emergjente') return visit.priority === 'emergjente'
    if (filter === 'scheduled') return visit.status === 'scheduled'
    if (filter === 'in_progress') return visit.status === 'in_progress'
    if (filter === 'completed') return visit.status === 'completed'
    if (filter === 'cancelled') return visit.status === 'cancelled'
    
    if (filter === 'deadline') {
      const vDate = new Date(visit.scheduled_start)
      return visit.status === 'scheduled' && vDate >= now && vDate <= in24Hours
    }

    return true
  })

  const sortedAndFilteredVisits = [...filteredVisits].sort((a, b) => {
    if (sortBy === 'date_asc') {
      return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    }
    if (sortBy === 'date_desc') {
      return new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
    }
    if (sortBy === 'created_desc') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return 0
  })

  const ktheStatusinNeShqip = (status: string) => {
    switch (status) {
      case 'scheduled': return 'E PLANIFIKUAR'
      case 'in_progress': return 'NË PROCES'
      case 'completed': return 'E PËRFUNDUAR'
      case 'cancelled': return 'E ANULUAR'
      default: return status.toUpperCase()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Planifikimi i Vizitave</h2>
          <p className="text-sm text-slate-500 mt-1">
            Menaxhimi logjistik i orareve, prioriteteve dhe stafit në terren.
          </p>
        </div>
        <KrijoViziteModal patients={patientsList} teams={teamsList} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* TOP BAR: SEARCH DHE DROPDOWNS */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Kërko pacientin, zonën..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm  text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-900 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="all">Të gjitha Ekipet</option>
                {teamsList.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-6 bg-slate-300 hidden md:block"></div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="date_asc">Sipas Orarit (Më të afërtat)</option>
              <option value="date_desc">Sipas Orarit (Më të largëtat)</option>
              <option value="created_desc">Të shtuara së fundmi</option>
            </select>
          </div>
        </div>

        {/* BOTTOM BAR: BUTONAT E STATUSIT */}
        <div className="p-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Të gjitha ({counts.all})
          </button>

          <button
            onClick={() => setFilter('deadline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filter === 'deadline' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Afër Deadline ({counts.deadline})
          </button>

          <button
            onClick={() => setFilter('emergjente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'emergjente' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            Emergjente ({counts.emergjente})
          </button>

          <button
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'scheduled' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            E Planifikuar ({counts.scheduled})
          </button>

          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'in_progress' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            Në Proces ({counts.in_progress})
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'completed' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            E PËRFUNDUAR ({counts.completed})
          </button>

          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'cancelled' ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            E Anuluar ({counts.cancelled})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Data & Ora</th>
                <th className="px-6 py-4">Pacienti / Zona</th>
                <th className="px-6 py-4">Ekipi Operacional</th>
                <th className="px-6 py-4">Kategoria e Kujdesit</th>
                <th className="px-6 py-4">Statusi & Prioriteti</th>
                <th className="px-6 py-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 animate-pulse">
                    Po ngarkohen vizitat...
                  </td>
                </tr>
              ) : sortedAndFilteredVisits.map((visit) => (
                <tr key={visit.id} className={`hover:bg-slate-50 transition-colors ${visit.priority === 'emergjente' ? 'bg-red-50/20' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">
                      {new Date(visit.scheduled_start).toLocaleDateString('sq-AL')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                      {new Date(visit.scheduled_start).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">
                      {visit.patients?.reference_code}
                    </div>
                    <div className="text-xs flex items-center gap-1 text-slate-500 mt-0.5">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {visit.patients?.zones?.name || 'Zonë e papërcaktuar'}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {visit.teams?.name ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {visit.teams.name}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">I pacaktuar</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">{visit.care_category || 'E përgjithshme'}</div>
                    <div className="mt-1">
                      {visit.is_patient_notified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          ✓ I Njoftuar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ⏱ Nuk është njoftuar
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                        visit.status === 'in_progress' ? 'bg-purple-100 text-purple-800 animate-pulse' :
                        visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        visit.status === 'cancelled' ? 'bg-slate-200 text-slate-600 line-through' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ktheStatusinNeShqip(visit.status)}
                      </span>
                      {visit.priority === 'emergjente' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 animate-pulse">
                          ⚠️ EMERGJENTE
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <NdryshoViziteModal visit={visit} />
                      
                      {visit.status !== 'cancelled' && (
                        <button
                          onClick={() => setVisitToCancel(visit.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline transition-colors"
                        >
                          Anulo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && sortedAndFilteredVisits.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-slate-500 text-base font-medium">Nuk u gjet asnjë vizitë.</p>
                      <p className="text-slate-400 text-sm mt-1">Provoni të ndryshoni kriteret e kërkimit ose filtrat.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {visitToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Anulo Vizitën</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    A jeni të sigurt që dëshironi ta anuloni këtë vizitë? Kjo vizitë do të markohet si e anuluar në sistem dhe orari përkatës do të lirohet automatikisht për pacientë të tjerë.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setVisitToCancel(null)} 
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Kthehu
                </button>
                <button 
                  onClick={confirmCancel} 
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isCancelling ? 'Po anulohet...' : 'Po, Anuloje'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}