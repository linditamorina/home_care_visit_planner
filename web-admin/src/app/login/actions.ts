'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function loginAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Të gjitha fushat janë të detyrueshme.' }
  }

  // 1. Autentifikimi fillestar
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: 'Kredencialet janë të gabuara. Ju lutem provoni përsëri.' }
  }

  // 2. Autorizimi (Marrja e Rolit)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (userError || !userData) {
    await supabase.auth.signOut()
    return { error: 'Llogaria juaj nuk është e konfiguruar saktë në sistem.' }
  }

  const role = userData.role
  let redirectUrl = ''

  // 3. Rrugëzimi i zgjuar (Smart Routing)
  if (role === 'admin') {
    redirectUrl = '/admin'
  } else if (role === 'supervisor') {
    redirectUrl = '/dashboard'
  } else if (role === 'field_worker') {
    // Bllokojmë aksesin në web për punonjësit e terrenit
    await supabase.auth.signOut()
    return { error: 'Akses i Mohuar: Ky portal është vetëm për menaxhmentin. Ju lutem përdorni aplikacionin Mobile VisiTrack.' }
  } else {
    await supabase.auth.signOut()
    return { error: 'Rol i panjohur në sistem.' }
  }

  revalidatePath('/', 'layout')
  
  return { success: true, redirectUrl }
}