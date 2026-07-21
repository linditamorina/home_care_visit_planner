'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import KrijoViziteModal from './KrijoViziteModal'
import NdryshoViziteModal from './NdryshoViziteModal'
import { anuloVizite } from './actions'

export default function VizitatPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [patientsList, setPatientsList] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState<string>('all')
  
  const [visitToCancel, setVisitToCancel] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const supabase = createClient()

  async function loadData() {
    setLoading(true)

    const { data: pList } = await supabase.from('patients').select('id, reference_code')
    setPatientsList(pList || [])

    const { data: sList } = await supabase.from('users').select('id, full_name').eq('role', 'field_worker')
    setStaffList(sList || [])

    const { data: vList } = await supabase
      .from('visits')
      .select(`
        *,
        patients (reference_code, zone_id),
        users!assigned_staff_id (full_name)
      `)
      .order('scheduled_start', { ascending: true })

    setVisits(vList || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
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

  const counts = {
    all: visits.length,
    deadline: visits.filter(v => v.status === 'scheduled' && new Date(v.scheduled_start) >= now && new Date(v.scheduled_start) <= in24Hours).length,
    emergjente: visits.filter(v => v.priority === 'emergjente').length,
    scheduled: visits.filter(v => v.status === 'scheduled').length,
    in_progress: visits.filter(v => v.status === 'in_progress').length,
    completed: visits.filter(v => v.status === 'completed').length,
    cancelled: visits.filter(v => v.status === 'cancelled').length,
  }

  const filteredVisits = visits.filter(visit => {
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

  // Funksioni inxhinierik për lokalizimin e UI (Përkthimi i statusit)
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
        <KrijoViziteModal patients={patientsList} staff={staffList} />
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filtro:</span>
        
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
          E Përfunduar ({counts.completed})
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Data & Ora</th>
                <th className="px-6 py-4">Pacienti / Zona</th>
                <th className="px-6 py-4">Kategoria e Kujdesit</th>
                <th className="px-6 py-4">Statusi & Prioriteti</th>
                <th className="px-6 py-4 text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 animate-pulse">
                    Po ngarkohen vizitat...
                  </td>
                </tr>
              ) : filteredVisits.map((visit) => (
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
                      {visit.patients?.zone_id}
                    </div>
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
                      {/* Këtu thërrasim funksionin që printon statusin në Shqip */}
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

              {!loading && filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nuk u gjet asnjë vizitë për këtë filtër.
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