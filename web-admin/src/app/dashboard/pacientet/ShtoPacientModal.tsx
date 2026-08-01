'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ShtoPacientModal({ onPatientAdded }: { onPatientAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Shtetet për të dhënat e pacientit
  const [ageGroup, setAgeGroup] = useState('18-30')
  const [zoneId, setZoneId] = useState('') // Tani do të mbajë UUID-në e zonës
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [allergies, setAllergies] = useState('')
  const [conditions, setConditions] = useState('')

  // Shteti i ri për të mbajtur Zonat nga Databaza
  const [zonesList, setZonesList] = useState<any[]>([])

  const supabase = createClient()

  // Tërheqim zonat dinamikisht sapo hapet modali
  useEffect(() => {
    if (isOpen) {
      async function fetchZones() {
        const { data } = await supabase
          .from('zones')
          .select('id, name')
          .order('name', { ascending: true }) // Renditje alfabetike për lehtësi gjetjeje
        
        if (data) {
          setZonesList(data)
          // Zgjedh automatikisht zonën e parë nëse ekziston (Marrim ID-në, jo emrin)
          if (data.length > 0 && !zoneId) {
            setZoneId(data[0].id)
          }
        }
      }
      fetchZones()
    }
  }, [isOpen]) // Ekzekutohet vetëm kur modali hapet

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!zoneId) {
      setError('Ju lutem zgjidhni një zonë. Nëse nuk ka zona, kontaktoni Administratorin.')
      setLoading(false)
      return
    }

    try {
      // Gjenerojmë një kod të sigurt e të rastësishëm (p.sh. PAT-X7K9)
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
      const referenceCode = `PAT-${randomCode}`

      // Dërgojmë të dhënat në databazë
      const { error: insertError } = await supabase
        .from('patients')
        .insert([
          {
            reference_code: referenceCode,
            age_group: ageGroup,
            zone_id: zoneId, // Kjo tani është një UUID e vlefshme
            address: address.trim(),
            phone_number: phone.trim(),
            email: email.trim() || null,
            allergies: allergies.trim() || null,
            medical_conditions: conditions.trim() || null
          }
        ])

      if (insertError) throw insertError

      // Sukses: Mbyllim modalin, pastrojmë formën dhe rifreskojmë listën
      setIsOpen(false)
      resetForm()
      onPatientAdded()
    } catch (err: any) {
      setError(err.message || 'Ndodhi një gabim gjatë regjistrimit të pacientit.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setAgeGroup('18-30')
    setZoneId(zonesList.length > 0 ? zonesList[0].id : '') // Kthehemi te ID-ja e zonës së parë
    setAddress('')
    setPhone('')
    setEmail('')
    setAllergies('')
    setConditions('')
    setError(null)
  }

  // Klasa e përbashkët për inputet që të kenë vizualitet të shkëlqyer
  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-semibold text-slate-950 bg-white placeholder:text-slate-400 placeholder:font-normal transition-all"

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        Regjistro Pacient të Ri
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Skeda e Re e Pacientit</h3>
              <button 
                onClick={() => { setIsOpen(false); resetForm(); }}
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
                {/* Seksioni i Kontaktit dhe Logjistikës */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Të Dhënat Baze</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zona / Regjioni *</label>
                    <select 
                      value={zoneId} 
                      onChange={(e) => setZoneId(e.target.value)}
                      className={inputClassName}
                      required
                      disabled={zonesList.length === 0}
                    >
                      {zonesList.length === 0 ? (
                        <option value="" disabled>Po ngarkohen zonat...</option>
                      ) : (
                        zonesList.map((zone) => (
                          <option key={zone.id} value={zone.id}> {/* Tani value është zone.id */}
                            {zone.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresa e Saktë *</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rr. Shembulli, Nr. 12"
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Numri i Telefonit *</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+383 4X XXX XXX"
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Opsionale)</span></label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pacienti@email.com"
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* Seksioni Mjekësor */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Të Dhënat Mjekësore</h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grupmosha *</label>
                    <select 
                      value={ageGroup} 
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className={inputClassName}
                      required
                    >
                      <option value="0-18">0-18 vjeç</option>
                      <option value="18-30">18-30 vjeç</option>
                      <option value="31-50">31-50 vjeç</option>
                      <option value="51-70">51-70 vjeç</option>
                      <option value="70+">Mbi 70 vjeç</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alergjitë e Njohura <span className="text-slate-400 font-normal">(Opsionale)</span></label>
                    <textarea 
                      value={allergies} 
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Specifiko nëse ka..."
                      rows={2}
                      className={inputClassName.replace("py-2", "py-3")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kushte të Tjera Mjekësore <span className="text-slate-400 font-normal">(Opsionale)</span></label>
                    <textarea 
                      value={conditions} 
                      onChange={(e) => setConditions(e.target.value)}
                      placeholder="Sëmundje kronike, ndërhyrje të mëparshme..."
                      rows={3}
                      className={inputClassName.replace("py-2", "py-3")}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); resetForm(); }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm rounded-lg transition-colors"
                  disabled={loading}
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={loading || zonesList.length === 0}
                  className={`px-6 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center min-w-[140px] ${
                    loading || zonesList.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Po ruhet...
                    </span>
                  ) : (
                    'Ruaj Pacientin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}