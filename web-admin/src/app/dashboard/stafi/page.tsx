'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import TeamCard from './TeamCard'

export default function MenaxhimiEkipeve() {
  const [teamsList, setTeamsList] = useState<any[]>([])
  const [visitsList, setVisitsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // 1. Funksioni për tërheqjen e të dhënave të rifreskuara
  // async function loadData() {
  //   // Tërheqim Ekipet
  //   const { data: teams } = await supabase
  //     .from('teams')
  //     .select(`
  //       id, 
  //       name, 
  //       shift_type,
  //       users (id, full_name, profession)
  //     `)
  //     .order('name', { ascending: true })

  //   // Tërheqim Vizitat e SOTME
  //   const startOfDay = new Date()
  //   startOfDay.setHours(0, 0, 0, 0)
  //   const endOfDay = new Date()
  //   endOfDay.setHours(23, 59, 59, 999)

  //   const { data: todayVisits } = await supabase
  //     .from('visits')
  //     .select('*, patients(reference_code, zones(name))')
  //     .gte('scheduled_start', startOfDay.toISOString())
  //     .lte('scheduled_start', endOfDay.toISOString())
  //     .order('scheduled_start', { ascending: true })

  //   setTeamsList(teams || [])
  //   setVisitsList(todayVisits || [])
  //   setLoading(false)
  // }

  async function loadData() {
    // Tërheqim Ekipet
    const { data: teams } = await supabase
      .from('teams')
      .select(`
        id, 
        name, 
        shift_type,
        users (id, full_name, profession)
      `)
      .order('name', { ascending: true })

    // TESTIM: Tërheqim TË GJITHA vizitat pa filtër datash, për të parë nëse shfaqen
    const { data: todayVisits } = await supabase
      .from('visits')
      .select('*, patients(reference_code, zones(name))')
      .order('scheduled_start', { ascending: true })

    console.log('Të gjitha vizitat e tërhequra:', todayVisits) // Shiko Console në F12

    setTeamsList(teams || [])
    setVisitsList(todayVisits || [])
    setLoading(false)
  }

  // 2. Lidhja Real-Time (Magjia e Live Tracking)
  useEffect(() => {
    loadData() // Ngarkimi fillestar

    const channel = supabase
      .channel('stafi-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        // Kurdo që ndodh një ndryshim në databazë (p.sh. vizita bëhet e përfunduar),
        // ky funksion rithirret dhe kartat përditësohen vetvetiu!
        loadData() 
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Funksion ndihmës për të mbledhur zonat unike për ekipin
  const getTeamZones = (teamVisits: any[]) => {
    const zones = new Set(teamVisits.map(v => v.patients?.zones?.name).filter(Boolean))
    return Array.from(zones)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex-none flex justify-between items-end border-b border-slate-200 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Paneli i Ekipeve
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-xs text-slate-500 font-medium">
              Monitorimi <span className="text-emerald-600 font-bold">Live</span> i operacioneve në terren
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded border border-slate-200 uppercase tracking-wider">
            {teamsList.filter(t => t.shift_type === 'weekday').length} Javore
          </span>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded border border-slate-200 uppercase tracking-wider">
            {teamsList.filter(t => t.shift_type === 'weekend').length} Vikend
          </span>
        </div>
      </div>

      {/* KONTEJNERI I KARTAVE */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm font-medium text-slate-400 animate-pulse">Po sinkronizohet me serverin...</span>
          </div>
        ) : teamsList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            Nuk ka ekipe të konfiguruara.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
            {teamsList.map((team) => {
              const teamVisits = visitsList.filter(v => v.assigned_team_id === team.id)
              const teamZones = getTeamZones(teamVisits)

              return (
                <TeamCard 
                  key={team.id} 
                  team={team} 
                  visits={teamVisits} 
                  zones={teamZones} 
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}