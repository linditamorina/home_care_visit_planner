'use client'

import { useState, useEffect } from 'react'
import { krijoVizite, merrOraretEZena } from './actions'

// Përditësuam tipin e pacientëve për të pranuar edhe zonën
type ModalProps = {
  patients?: { id: string, reference_code: string, zones?: { name: string } }[]
  teams?: { id: string, name: string, shift_type: string }[]
}

const ALL_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

export default function KrijoViziteModal({ patients = [], teams = [] }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  // State-et e reja për filtrimin e pacientëve
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')
  
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isFetchingSlots, setIsFetchingSlots] = useState(false)
  
  const [isNotified, setIsNotified] = useState(false)

  // 1. Ekstraktojmë të gjitha zonat unike nga lista e pacientëve (pa dublikata)
  const uniqueZones = Array.from(new Set(patients.map(p => p.zones?.name).filter(Boolean))) as string[]

  // 2. Filtrojmë pacientët bazuar në zonën e zgjedhur
  const filteredPatients = selectedZone 
    ? patients.filter(p => p.zones?.name === selectedZone)
    : patients

  const isSelectedDateWeekend = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const isWeekend = isSelectedDateWeekend(selectedDate)

  const availableTeams = teams.filter(team => {
    if (isWeekend) {
      return team.shift_type === 'weekend'
    } else {
      return team.shift_type === 'weekday'
    }
  })

  useEffect(() => {
    async function fetchSlots() {
      if (selectedTeam && selectedDate) {
        setIsFetchingSlots(true)
        const zena = await merrOraretEZena(selectedTeam, selectedDate)
        setBookedSlots(zena)
        setIsFetchingSlots(false)
        setSelectedTime('')
      } else {
        setBookedSlots([])
      }
    }
    fetchSlots()
  }, [selectedTeam, selectedDate])

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
        setSelectedTeam('')
        setSelectedTime('')
        setSelectedZone('')
        setSelectedPatient('')
        setIsNotified(false)
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
                <p className="text-xs text-slate-500 font-medium mt-0.5">Planifikimi i vizitës dhe logjistikës</p>
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

              {/* Rreshtimi i ri gjeometrik: 2 kolona për çdo rresht */}
              <div className="grid grid-cols-2 gap-5">
                
                {/* 1. Filtri i Zonës (E RE) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">1. Filtro sipas Zonës</label>
                  <select 
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value)
                      setSelectedPatient('') // Kur ndërrohet zona, fshihet pacienti i mëparshëm
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    <option value="" className="text-slate-500">-- Të gjitha Zonat --</option>
                    {uniqueZones.map((zone, index) => (
                      <option key={index} value={zone} className="text-slate-900">{zone}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Zgjedhja e Pacientit */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">2. Zgjidh Pacientin</label>
                  <select 
                    name="patient_id" 
                    required 
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    <option value="" className="text-slate-500">
                      {filteredPatients.length === 0 ? "Nuk ka pacientë në këtë zonë" : "-- Zgjidh Kodin e Referencës --"}
                    </option>
                    {filteredPatients.map(p => (
                      <option key={p.id} value={p.id} className="text-slate-900">
                        {p.reference_code} {p.zones?.name && !selectedZone ? `(${p.zones.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Data e Vizitës */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">3. Data e Vizitës</label>
                  <input 
                    type="date" 
                    name="visit_date" 
                    required 
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setSelectedTeam('')
                      setSelectedTime('')
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm" 
                  />
                </div>

                {/* 4. Ekipi në Terren */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">4. Ekipi Operacional</label>
                  <select 
                    name="assigned_team_id" 
                    required 
                    disabled={!selectedDate}
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none shadow-sm transition-colors ${
                      !selectedDate 
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  >
                    {!selectedDate ? (
                      <option value="" className="text-slate-500">-- Zgjidh Ekipin --</option>
                    ) : (
                      <>
                        <option value="" className="text-slate-500">-- Zgjidh Ekipin --</option>
                        {availableTeams.map(team => (
                          <option key={team.id} value={team.id} className="text-slate-900">
                            {team.name} {isWeekend ? '(Vikend)' : '(Javore)'}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 5. Oraret e Lira */}
                <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-800 mb-3">
                    5. Oraret e Lira {isFetchingSlots && <span className="text-blue-500 text-xs ml-2 animate-pulse">Po kontrollohet kalendari...</span>}
                  </label>
                  
                  {!selectedTeam || !selectedDate ? (
                    <p className="text-sm text-slate-500 text-center py-4 italic">Zgjidhni datën dhe ekipin për të parë oraret e disponueshme.</p>
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

                {/* 6. Kategoria */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria</label>
                  <select name="care_category" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Kujdes për të Moshuar" className="text-slate-900">Kujdes për të Moshuar</option>
                    <option value="Nëna dhe Fëmijë" className="text-slate-900">Nëna dhe Fëmijë</option>
                    <option value="Paliativ" className="text-slate-900">Paliativ</option>
                    <option value="Rehabilitim Fizik" className="text-slate-900">Rehabilitim Fizik</option>
                  </select>
                </div>

                {/* 7. Prioriteti */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioriteti</label>
                  <select name="priority" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="normale" className="text-slate-900">Normale</option>
                    <option value="emergjente" className="text-slate-900 text-red-600 font-semibold">Emergjente</option>
                  </select>
                </div>

                {/* 8. Butoni i Njoftimit (Toggle) */}
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 mt-2">A është njoftuar pacienti?</label>
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
                  <input type="hidden" name="is_patient_notified" value={isNotified ? 'true' : 'false'} />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Anulo
                </button>
                <button type="submit" disabled={isLoading || !selectedTime || !selectedPatient} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
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