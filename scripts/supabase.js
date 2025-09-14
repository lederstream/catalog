// scripts/supabase.js
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://fwmpcglrwgfougbgxvnt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc'

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cargar Supabase desde CDN
let supabase;

// Función para inicializar Supabase
export async function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase;
        return supabase;
    }
    
    // Esperar a que se cargue la biblioteca desde el CDN
    await new Promise((resolve) => {
        const checkSupabase = () => {
            if (window.supabase) {
                resolve();
            } else {
                setTimeout(checkSupabase, 100);
            }
        };
        checkSupabase();
    });
    
    supabase = window.supabase;
    return supabase;
}

// Obtener el cliente de Supabase
export async function getSupabase() {
    if (!supabase) {
        await initSupabase();
    }
    return supabase;
}
