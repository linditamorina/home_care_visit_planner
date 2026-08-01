'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function shtoZoneTeRe(formData: FormData) {
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'Emri i zonës është i detyrueshëm.' }
  }

  const supabase = await createClient()

  // Shtojmë zonën e re në tabelën 'zones'
  const { error } = await supabase
    .from('zones')
    .insert([
      { name: name.trim() }
    ])

  if (error) {
    // Nëse ke vendosur rregull UNIQUE në databazë për emrin
    if (error.code === '23505') {
      return { error: 'Kjo zonë ekziston tashmë në sistem.' }
    }
    return { error: `Gabim gjatë ruajtjes: ${error.message}` }
  }

  // Rifreskojmë panelin e adminit dhe panelin e mbikëqyrësit që ta shohin zonën menjëherë
  revalidatePath('/admin/zonat')
  revalidatePath('/dashboard/pacientet') // Për kur mbikëqyrësi shton pacientë të rinj
  
  return { success: true }
}