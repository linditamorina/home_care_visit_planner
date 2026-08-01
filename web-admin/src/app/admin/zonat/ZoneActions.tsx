'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Zone = {
  id: string
  name: string
}

export default function ZoneActions({ zone }: { zone: Zone }) {
  // Përdorim dy state të ndryshme: një për ndryshimin dhe një për fshirjen
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [name, setName] = useState(zone.name)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Funksioni për të përditësuar zonën
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase
      .from('zones')
      .update({ name })
      .eq('id', zone.id)

    setIsLoading(false)

    if (error) {
      alert('Gabim gjatë përditësimit të zonës!')
    } else {
      setIsEditOpen(false)
      router.refresh()
    }
  }

  // Funksioni për të fshirë zonën (pa window.confirm)
  const handleDelete = async () => {
    setIsLoading(true)
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', zone.id)

    setIsLoading(false)

    if (error) {
      alert('Gabim gjatë fshirjes së zonës!')
    } else {
      setIsDeleteOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <button 
          onClick={() => setIsEditOpen(true)}
          className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-3 py-1.5 bg-blue-50 rounded-lg transition-colors"
        >
          Ndrysho
        </button>
        <button 
          onClick={() => setIsDeleteOpen(true)}
          className="text-red-600 hover:text-red-800 font-semibold text-xs px-3 py-1.5 bg-red-50 rounded-lg transition-colors"
        >
          Fshij
        </button>
      </div>

      {/* Modali i Ndryshimit */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Ndrysho Zonën</h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Emri i Zonës
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isLoading ? 'Duke u ruajtur...' : 'Ruaj Ndryshimet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modali i Fshirjes (Dizajn Profesional) */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              {/* Ikona paralajmëruese (Warning Icon) */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Fshini zonën "{zone.name}"?
              </h3>
              <p className="text-sm text-slate-500 px-4">
                Ky veprim nuk mund të kthehet mbrapsht. Jeni të sigurt që dëshironi ta fshini përgjithmonë këtë zonë nga sistemi?
              </p>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Anulo
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
              >
                {isLoading ? 'Duke u fshirë...' : 'Po, Fshij Zonën'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}