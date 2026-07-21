'use client'

import { useState, useEffect } from 'react'
import { krijoVizite, merrOraretEZena } from './actions'

type ModalProps = {
  patients: { id: string, reference_code: string }[]
  staff: { id: string, full_name: string }[]
}

const ALL_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

export default function KrijoViziteModal({ patients, staff }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const [selectedStaff, setSelectedStaff] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isFetchingSlots, setIsFetchingSlots] = useState(false)
  
  // State-i i ri për butonin Toggle (Njoftimi i Pacientit)
  const [isNotified, setIsNotified] = useState(false)

  useEffect(() => {
    async function fetchSlots() {
      if (selectedStaff && selectedDate) {
        setIsFetchingSlots(true)
        const zena = await merrOraretEZena(selectedStaff, selectedDate)
        setBookedSlots(zena)
        setIsFetchingSlots(false)
        setSelectedTime('')
      } else {
        setBookedSlots([])
      }
    }
    fetchSlots()
  }, [selectedStaff, selectedDate])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTime) {
      setMessage({ type: 'error', text: 'Ju lutem zgjidhni një orar të lirë nga lista.' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.append('visit_time', selectedTime)

    const result = await krijoVizite(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: 'Vizita u planifikua me sukses!' })
      setTimeout(() => {
        setIsOpen(false)
        setMessage(null)
        setSelectedDate('')
        setSelectedStaff('')
        setSelectedTime('')
        setIsNotified(false) // Rikthejmë toggle-in në gjendjen fillestare
      }, 1500)
    }
    setIsLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Krijo Vizitë të Re
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sistemi i Planifikimit</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Kohëzgjatja menaxhohet automatikisht (60min për vizitën e parë)</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">1. Pacienti</label>
                  <select name="patient_id" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm">
                    <option value="" className="text-slate-500">-- Zgjidh Kodin e Referencës --</option>
                    {patients.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.reference_code}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">2. Stafi në Terren</label>
                  <select 
                    name="assigned_staff_id" 
                    required 
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    <option value="" className="text-slate-500">-- Zgjidh Punonjësin --</option>
                    {staff.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.full_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">3. Data e Vizitës</label>
                  <input 
                    type="date" 
                    name="visit_date" 
                    required 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm" 
                  />
                </div>

                <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    4. Oraret e Lira {isFetchingSlots && <span className="text-blue-500 text-xs ml-2 animate-pulse">Po kontrollohet kalendari...</span>}
                  </label>
                  
                  {!selectedStaff || !selectedDate ? (
                    <p className="text-sm text-slate-500 text-center py-4 italic">Zgjidhni stafin dhe datën për të parë oraret e disponueshme.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {ALL_SLOTS.map(slot => {
                        const isBooked = bookedSlots.includes(slot)
                        const isSelected = selectedTime === slot

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 rounded-lg text-sm font-medium transition-all ${
                              isBooked 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed line-through' 
                                : isSelected 
                                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-1' 
                                  : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria</label>
                  <select name="care_category" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Kujdes për të Moshuar" className="text-slate-900">Kujdes për të Moshuar</option>
                    <option value="Nëna dhe Fëmijë" className="text-slate-900">Nëna dhe Fëmijë</option>
                    <option value="Paliativ" className="text-slate-900">Paliativ</option>
                    <option value="Rehabilitim Fizik" className="text-slate-900">Rehabilitim Fizik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioriteti</label>
                  <select name="priority" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="normale" className="text-slate-900">Normale</option>
                    <option value="emergjente" className="text-slate-900 text-red-600 font-semibold">Emergjente</option>
                  </select>
                </div>

                {/* Butoni i Njoftimit (Toggle) */}
                <div className="col-span-2 pt-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">A është njoftuar pacienti?</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setIsNotified(!isNotified)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                        isNotified ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isNotified ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm font-medium text-slate-700">
                      {isNotified ? 'Po, pacienti ka konfirmuar vizitën' : 'Jo, pacienti nuk është kontaktuar ende'}
                    </span>
                  </div>
                  {/* Kjo fushë e fshehur kalon të dhënën në Form Data kur shtypet Ruaj */}
                  <input type="hidden" name="is_patient_notified" value={isNotified ? 'true' : 'false'} />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Anulo
                </button>
                <button type="submit" disabled={isLoading || !selectedTime} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                  {isLoading ? 'Po planifikohet...' : 'Ruaj Vizitën'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}