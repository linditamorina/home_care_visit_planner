'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { zonedTimeToUtc, localDateKey, localTimeKey } from '@/utils/timezone'

// 1. Funksioni për të marrë oraret e zëna për një datë (Përshtatur për Ekip)
export async function merrOraretEZena(team_id: string, date: string) {
  const supabase = await createClient()

  // Marrim një dritare 48-orëshe rreth datës (në UTC) dhe më pas filtrojmë saktësisht
  // sipas datës kalendarike në zonën kohore të biznesit (shih utils/timezone.ts) — kështu
  // shmangim varësinë nga zona kohore e vetë procesit të serverit.
  const windowStart = zonedTimeToUtc(date, '00:00')
  windowStart.setUTCDate(windowStart.getUTCDate() - 1)
  const windowEnd = zonedTimeToUtc(date, '00:00')
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 2)

  const { data, error } = await supabase
    .from('visits')
    .select('scheduled_start')
    .eq('assigned_team_id', team_id)
    .neq('status', 'cancelled')
    .neq('care_category', 'Laborator') // <--- ZGJIDHJA 1: Injoro vizitat e laborantit nga butonat gri
    .gte('scheduled_start', windowStart.toISOString())
    .lte('scheduled_start', windowEnd.toISOString())

  if (error || !data) return []

  return data
    .filter(visit => localDateKey(visit.scheduled_start) === date)
    .map(visit => localTimeKey(visit.scheduled_start))
}

// 2. Verifikimi nëse është vizita e parë
export async function eshteVizitaEPare(patient_id: string) {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patient_id)
    .neq('status', 'cancelled')

  if (error) return false
  return count === 0
}

// 3. Funksioni Kryesor i Krijimit të Vizitës (Përshtatur për Ekip)
export async function krijoVizite(formData: FormData) {
  const supabase = await createClient()

  const patient_id = formData.get('patient_id') as string
  const assigned_team_id = formData.get('assigned_team_id') as string 
  const visit_date = formData.get('visit_date') as string 
  const visit_time = formData.get('visit_time') as string 
  const priority = formData.get('priority') as string
  const care_category = formData.get('care_category') as string
  const is_patient_notified = formData.get('is_patient_notified') === 'true'

  if (!patient_id || !assigned_team_id || !visit_date || !visit_time) {
    return { error: 'Të gjitha fushat kryesore janë të detyrueshme.' }
  }

  const startDateTime = zonedTimeToUtc(visit_date, visit_time)
  const isFirst = await eshteVizitaEPare(patient_id)
  const durationMinutes = isFirst ? 60 : 45
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000)

  const scheduled_start = startDateTime.toISOString()
  const scheduled_end = endDateTime.toISOString()

  // Kontrolli i konfliktit në databazë
  const { data: conflicts } = await supabase
    .from('visits')
    .select('id')
    .eq('assigned_team_id', assigned_team_id)
    .neq('status', 'cancelled')
    .neq('care_category', 'Laborator') // <--- ZGJIDHJA 2: Injoro laborantin në llogaritjen e mbivendosjes (overlap)
    .lt('scheduled_start', scheduled_end)
    .gt('scheduled_end', scheduled_start)

  if (conflicts && conflicts.length > 0) {
    return { error: '⚠️ Konflikt Orari: Ky ekip sapo u caktua në një vizitë tjetër.' }
  }

  const { error: insertError } = await supabase
    .from('visits')
    .insert([{
      patient_id,
      assigned_team_id, 
      scheduled_start,
      scheduled_end,
      priority,
      care_category,
      status: 'scheduled',
      is_patient_notified
    }])

  if (insertError) {
    return { error: 'Ndodhi një gabim gjatë ruajtjes në databazë.' }
  }

  revalidatePath('/dashboard/vizitat')
  return { success: true }
}

// 4. Funksioni i Ndryshimit/Përditësimit
export async function ndryshoVizite(formData: FormData) {
  const supabase = await createClient()

  const visit_id = formData.get('visit_id') as string
  const status = formData.get('status') as string
  const priority = formData.get('priority') as string
  const is_patient_notified = formData.get('is_patient_notified') === 'true'

  if (!visit_id) return { error: 'Mungon ID e vizitës.' }

  const { error } = await supabase
    .from('visits')
    .update({ status, priority, is_patient_notified })
    .eq('id', visit_id)

  if (error) return { error: 'Ndodhi një gabim gjatë përditësimit të vizitës.' }

  revalidatePath('/dashboard/vizitat')
  revalidatePath('/dashboard/stafi')
  return { success: true }
}

// 5. Funksioni i ri për Anulim të Shpejtë (Cancel Action)
export async function anuloVizite(visit_id: string) {
  const supabase = await createClient()

  if (!visit_id) return { error: 'Mungon ID e vizitës.' }

  const { error } = await supabase
    .from('visits')
    .update({ status: 'cancelled' })
    .eq('id', visit_id)

  if (error) return { error: 'Ndodhi një gabim gjatë anulimit të vizitës.' }

  revalidatePath('/dashboard/vizitat')
  return { success: true }
}