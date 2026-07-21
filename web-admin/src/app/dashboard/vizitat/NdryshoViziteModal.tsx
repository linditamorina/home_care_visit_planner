'use client'

import { useState } from 'react'
import { ndryshoVizite } from './actions'

type NdryshoModalProps = {
  visit: any
}

export default function NdryshoViziteModal({ visit }: NdryshoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('visit_id', visit.id) // Bashkëngjisim ID-në në fshehtësi
    
    const result = await ndryshoVizite(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: 'Vizita u përditësua!' })
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
        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
      >
        Ndrysho
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Përditëso Vizitën</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statusi i Vizitës</label>
                <select name="status" defaultValue={visit.status} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 outline-none">
                  <option value="scheduled">E Planifikuar (Scheduled)</option>
                  <option value="completed">E Përfunduar (Completed)</option>
                  <option value="cancelled">E Anuluar (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioriteti</label>
                <select name="priority" defaultValue={visit.priority} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 outline-none">
                  <option value="normale">Normale</option>
                  <option value="emergjente">Emergjente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">A është njoftuar pacienti?</label>
                <select name="is_patient_notified" defaultValue={visit.is_patient_notified ? 'true' : 'false'} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 outline-none">
                  <option value="false">Jo, nuk është njoftuar</option>
                  <option value="true">Po, është njoftuar</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Anulo
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isLoading ? 'Po ruhet...' : 'Ruaj Ndryshimet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}