'use client'

import { useState, useEffect } from 'react'
import { shtoStafTeRi } from './actions'
import { createClient } from '@/utils/supabase/client'

export default function ShtoStafModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State për të mbajtur ekipet dhe rolin e zgjedhur për logjikë dinamike
  const [teams, setTeams] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState('field_worker')

  // Marrim listën e ekipeve nga DB vetëm kur hapet modali
  useEffect(() => {
    if (isOpen) {
      const fetchTeams = async () => {
        const supabase = createClient()
        const { data } = await supabase.from('teams').select('id, name').order('name')
        if (data) setTeams(data)
      }
      fetchTeams()
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Nëse është admin, sigurohemi që të mos dërgojmë vlerë për ekipin dhe profesionin
    if (selectedRole === 'admin') {
      formData.set('profession', '')
      formData.set('team_id', '')
    }

    const result = await shtoStafTeRi(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setIsOpen(false)
      setLoading(false)
      // Resetimi i formës është opsional, por thelbësor për një User Experience të pastër
      setSelectedRole('field_worker') 
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
      >
        <span>+</span> Shto Staf të Ri
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-left">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Regjistro Punonjës</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg">
                  {error}
                </div>
              )}

              {/* Rreshti 1: Emri dhe E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Emri i Plotë</label>
                  <input 
                    type="text" 
                    name="full_name" 
                    required 
                    placeholder="psh. Filan Fisteku"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-mail Adresa</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    placeholder="emri@visitrack.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Rreshti 2: Roli dhe Profesioni */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Roli në Sistem</label>
                  <select 
                    name="role" 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value="field_worker">Punëtor në Terren</option>
                    <option value="supervisor">Mbikëqyrës / Koordinator</option>
                    <option value="admin">Administrator (IT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Profesioni Mjekësor</label>
                  <select 
                    name="profession" 
                    disabled={selectedRole === 'admin'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <option value="">Pa profesion specifik</option>
                    <option value="Mjek">Mjek i Përgjithshëm</option>
                    <option value="Infermier">Infermier</option>
                    <option value="Laborant">Laborant</option>
                  </select>
                </div>
              </div>

              {/* Rreshti 3: Zgjedhja e Ekipit */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asenjimi në Ekip</label>
                <select 
                  name="team_id" 
                  disabled={selectedRole === 'admin'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
                >
                  <option value="">-- I pacaktuar --</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                {selectedRole === 'admin' && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">Administratorët nuk u caktohen ekipeve.</p>
                )}
              </div>

              {/* Rreshti 4: Fjalëkalimi */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fjalëkalimi i Aksesit</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  minLength={6}
                  placeholder="Minimum 6 karaktere"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition-all"
                >
                  Anulo
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg transition-all shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {loading ? 'Duke ruajtur...' : 'Ruaj Përdoruesin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}