'use client'

import { useState } from 'react'
import { shtoZoneTeRe } from './actions'

export default function ShtoZoneModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await shtoZoneTeRe(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setIsOpen(false)
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
      >
        <span>+</span> Shto Zonë të Re
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>📍</span> Regjistro Zonë
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Emri i Zonës</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="psh. Zona Lindore"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                >
                  Anulo
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {loading ? 'Duke ruajtur...' : 'Ruaj Zonën'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}