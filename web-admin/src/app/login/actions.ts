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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Kredencialet janë të gabuara. Ju lutem provoni përsëri.' }
  }

  // Përditësojmë cache-in për të njohur sesionin e ri
  revalidatePath('/', 'layout')
  
  return { success: true }
}