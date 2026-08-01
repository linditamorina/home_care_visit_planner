'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ndryshoVizite } from './actions'

type NdryshoModalProps = {
  visit: any
}

export default function NdryshoViziteModal({ visit }: NdryshoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('visit_id', visit.id) 
    
    const result = await ndryshoVizite(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: 'Të dhënat u regjistruan me sukses në sistem.' })
      
      // KJO ËSHTË ZGJIDHJA E CACHE-IT: Detyrojmë Next.js të rifreskojë të dhënat kudo!
      router.refresh()
      
      setTimeout(() => {
        setIsOpen(false)
        setMessage(null)
      }, 1000)
    }
    setIsLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-slate-700 hover:text-blue-700 font-bold text-xs bg-slate-100 hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-md transition-colors shadow-sm"
      >
        Ndrysho Statusin
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden text-left">
            
            {/* Header Zyrtar */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Përditësimi i Dosjes</h3>
                <p className="text-xs text-slate-500 mt-0.5">Subjekti: <span className="font-bold text-slate-700">{visit.patients?.reference_code || 'I panjohur'}</span></p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
              {message && (
                <div className={`p-3 rounded-md text-sm font-semibold border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {message.text}
                </div>
              )}

              {/* Fusha e Statusit e Pastruar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gjendja e Operacionit</label>
                <select name="status" defaultValue={visit.status} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all">
                  <option value="scheduled">E Planifikuar (Në Pritje)</option>
                  <option value="in_progress">Në Proces (Në Terren)</option>
                  <option value="completed">E Përfunduar</option>
                  <option value="cancelled">E Anuluar</option>
                </select>
              </div>

              {/* Fusha e Prioritetit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Niveli i Prioritetit</label>
                <select name="priority" defaultValue={visit.priority} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all">
                  <option value="normale">Normale</option>
                  <option value="emergjente">Emergjente</option>
                </select>
              </div>

              {/* Fusha e Njoftimit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Statusi i Kontaktit me Subjektin</label>
                <select name="is_patient_notified" defaultValue={visit.is_patient_notified ? 'true' : 'false'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all">
                  <option value="false">Jo, nuk është kontaktuar</option>
                  <option value="true">Po, është konfirmuar</option>
                </select>
              </div>

              {/* Veprimet */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                  Anulo
                </button>
                <button type="submit" disabled={isLoading} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-slate-800 rounded-md hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm">
                  {isLoading ? 'Po Procesohet...' : 'Regjistro Ndryshimet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}