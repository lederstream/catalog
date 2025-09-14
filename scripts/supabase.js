// scripts/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Configuración
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc'

// Crear cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    autoRefreshToken: true
  }
})

// Hacer disponible globalmente
window.supabaseClient = supabase

console.log('✅ Supabase inicializado correctamente')

export { supabase }
