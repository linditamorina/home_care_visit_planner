'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function shtoStafTeRi(formData: FormData) {
  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string
  
  // 1. Kapim të dhënat e reja nga forma
  const profession = formData.get('profession') as string
  const team_id = formData.get('team_id') as string

  if (!fullName || !email || !role || !password) {
    return { error: 'Të gjitha fushat bazë janë të detyrueshme.' }
  }

  if (password.length < 6) {
    return { error: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.' }
  }

  // 2. Formatimi i duhur për Databazën (Nëse janë bosh, i bëjmë NULL)
  const dbTeamId = team_id && team_id.trim() !== '' ? team_id : null
  const dbProfession = profession && profession.trim() !== '' ? profession : null

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password: password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
        return { error: 'Ky email ekziston tashmë në sistem.' }
    }
    return { error: `Gabim në Auth: ${authError.message}` }
  }

  if (!authData.user) {
    return { error: 'Dështoi gjenerimi i llogarisë.' }
  }

  // 3. Ruajmë përdoruesin bashkë me profesionin dhe ekipin
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .insert([
      { 
        id: authData.user.id, 
        full_name: fullName.trim(), 
        email: email.trim().toLowerCase(), 
        role: role,
        profession: dbProfession,
        team_id: dbTeamId
      }
    ])

  if (dbError) {
    if (dbError.code === '23505') { 
       const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          full_name: fullName.trim(), 
          role: role,
          profession: dbProfession,
          team_id: dbTeamId
        })
        .eq('id', authData.user.id)
        
       if (updateError) return { error: `Gabim gjatë përditësimit: ${updateError.message}` }
    } else {
       return { error: `Gabim në regjistrimin e profilit: ${dbError.message}` }
    }
  }

  revalidatePath('/admin/stafi')
  revalidatePath('/dashboard/stafi')
  
  return { success: true }
}

export async function ndryshoStaf(formData: FormData) {
  const id = formData.get('id') as string
  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string
  
  // 1. Kapim të dhënat e reja
  const profession = formData.get('profession') as string
  const team_id = formData.get('team_id') as string

  if (!id || !fullName || !email || !role) {
    return { error: 'Të gjitha fushat bazë janë të detyrueshme.' }
  }

  // 2. Formatimi për DB
  const dbTeamId = team_id && team_id.trim() !== '' ? team_id : null
  const dbProfession = profession && profession.trim() !== '' ? profession : null

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authUpdateData: { email: string; password?: string } = {
    email: email.trim().toLowerCase(),
  }

  if (password && password.trim() !== '') {
    if (password.length < 6) {
      return { error: 'Fjalëkalimi i ri duhet të ketë të paktën 6 karaktere.' }
    }
    authUpdateData.password = password
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData)

  if (authError) {
    return { error: `Gabim në përditësimin e llogarisë: ${authError.message}` }
  }

  // 3. Përditësojmë edhe profesionin dhe ekipin në tabelën users
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({ 
      full_name: fullName.trim(), 
      email: email.trim().toLowerCase(), 
      role: role,
      profession: dbProfession,
      team_id: dbTeamId
    })
    .eq('id', id)

  if (dbError) {
    return { error: `Gabim në ruajtjen e profilit: ${dbError.message}` }
  }

  revalidatePath('/admin/stafi')
  revalidatePath('/dashboard/stafi')
  
  return { success: true }
}

// === FUNKSIONI I RI PËR KRIJIMIN E EKIPEVE ===
export async function shtoEkip(formData: FormData) {
  const name = formData.get('name') as string
  const shift_type = formData.get('shift_type') as string

  if (!name || !shift_type) {
    return { error: 'Të gjitha fushat e ekipit janë të detyrueshme.' }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Kontrollojmë mos ekziston një ekip me të njëjtin emër (case-insensitive)
  const { data: existingTeam } = await supabaseAdmin
    .from('teams')
    .select('id')
    .ilike('name', name.trim())
    .maybeSingle()

  if (existingTeam) {
    return { error: 'Një ekip me këtë emër ekziston tashmë në sistem.' }
  }

  const { error } = await supabaseAdmin
    .from('teams')
    .insert([{ name: name.trim(), shift_type }])

  if (error) {
    return { error: `Gabim në databazë: ${error.message}` }
  }

  revalidatePath('/admin/stafi')
  revalidatePath('/dashboard/vizitat')
  
  return { success: true }
}