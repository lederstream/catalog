// scripts/supabase.js - VERSIÓN CORREGIDA
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';

// Inicializar Supabase
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});

// Variables globales
export let editingProductId = null;
export let allProducts = [];

// Función para verificar la conexión con Supabase
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('products').select('count').limit(1).single();
        
        if (error) {
            console.warn('Error conectando con Supabase:', error.message);
            return false;
        }
        
        console.log('✅ Conexión con Supabase verificada');
        return true;
    } catch (error) {
        console.error('Error verificando conexión:', error);
        return false;
    }
};

// Función para resetear el estado de edición
export const resetEditingState = () => {
    editingProductId = null;
};

// Función para actualizar productos locales
export const updateLocalProducts = (products) => {
    allProducts = products || [];
};

// Función para obtener categorías desde Supabase
export const loadCategoriesFromSupabase = async () => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error cargando categorías:', error);
        return [];
    }
};

// Función para agregar categoría en Supabase
export const addCategoryToSupabase = async (name) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ 
                name: name.trim(),
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error agregando categoría:', error);
        throw error;
    }
};

// Verificar conexión al cargar
checkSupabaseConnection().then(isConnected => {
    if (isConnected) {
        console.log('✅ Supabase inicializado correctamente');
    } else {
        console.warn('⚠️ Supabase no está disponible, usando modo offline');
    }
});
