'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function NdryshoPacientModal({ patient }: { patient: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Shtetet mbushen automatikisht me të dhënat ekzistuese të pacientit
  const [ageGroup, setAgeGroup] = useState(patient.age_group || '18-30')
  const [zoneId, setZoneId] = useState(patient.zone_id || 'Zona Qendër')
  const [address, setAddress] = useState(patient.address || '')
  const [phone, setPhone] = useState(patient.phone_number || '')
  const [email, setEmail] = useState(patient.email || '')
  const [allergies, setAllergies] = useState(patient.allergies || '')
  const [conditions, setConditions] = useState(patient.medical_conditions || '')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          age_group: ageGroup,
          zone_id: zoneId,
          address: address.trim(),
          phone_number: phone.trim(),
          email: email.trim() || null,
          allergies: allergies.trim() || null,
          medical_conditions: conditions.trim() || null
        })
        .eq('id', patient.id) // Përditësojmë vetëm këtë pacient!

      if (updateError) throw updateError

      setIsOpen(false)
      router.refresh() // Kjo komandë bën që Next.js të rifreskojë menjëherë faqen në sfond
    } catch (err: any) {
      setError(err.message || 'Ndodhi një gabim gjatë përditësimit të pacientit.')
    } finally {
      setLoading(false)
    }
  }

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-semibold text-slate-950 bg-white placeholder:text-slate-400 placeholder:font-normal transition-all"

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        Ndrysho të Dhënat
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Përditëso Profilin Mjekësor</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Të Dhënat Baze</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zona / Regjioni *</label>
                    <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={inputClassName} required>
                      <option value="Zona Qendër">Zona Qendër</option>
                      <option value="Zona Veriore">Zona Veriore</option>
                      <option value="Zona Jugore">Zona Jugore</option>
                      <option value="Zona Lindore">Zona Lindore</option>
                      <option value="Zona Perëndimore">Zona Perëndimore</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresa e Saktë *</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rr. Shembulli, Nr. 12" className={inputClassName} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Numri i Telefonit *</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+383 4X XXX XXX" className={inputClassName} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Opsionale)</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pacienti@email.com" className={inputClassName} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Të Dhënat Mjekësore</h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grupmosha *</label>
                    <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={inputClassName} required>
                      <option value="0-18">0-18 vjeç</option>
                      <option value="18-30">18-30 vjeç</option>
                      <option value="31-50">31-50 vjeç</option>
                      <option value="51-70">51-70 vjeç</option>
                      <option value="70+">Mbi 70 vjeç</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alergjitë e Njohura <span className="text-slate-400 font-normal">(Opsionale)</span></label>
                    <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Specifiko nëse ka..." rows={2} className={inputClassName.replace("py-2", "py-3")} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sëmundjet e Njohura <span className="text-slate-400 font-normal">(Opsionale)</span></label>
                    <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Sëmundje kronike, ndërhyrje të mëparshme..." rows={3} className={inputClassName.replace("py-2", "py-3")} />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm rounded-lg transition-colors"
                  disabled={loading}
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center min-w-[140px] ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Po ruhet...' : 'Ruaj Ndryshimet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}