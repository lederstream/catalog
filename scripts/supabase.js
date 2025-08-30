// Configuración de Supabase
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI极简风格6MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';

// Inicializar Supabase
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
export let editingProductId = null;
export let allProducts = [];
export let categories = ['diseño', 'marketing', 'software', 'consultoria'];

// Función para verificar la conexión con Supabase
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('products').select('count').limit(1);
        
        if (error) {
            console.warn('Error conectando con Supabase:', error.message);
            return false;
        }
        
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

// Función para actualizar categorías locales
export const updateLocalCategories = (newCategories) => {
    if (Array.isArray(newCategories)) {
        categories = newCategories;
    }
};

// Función para obtener categorías
export const getCategories = () => {
    return [...categories];
};

// Función para agregar categoría
export const addCategory = (category) => {
    const normalizedCategory = category.trim().toLowerCase();
    
    if (!normalizedCategory || categories.includes(normalizedCategory)) {
        return false;
    }
    
    categories.push(normalizedCategory);
    return true;
};

// Función para eliminar categoría
export const removeCategory = (category) => {
    const index = categories.indexOf(category);
    
    if (index === -1) {
        return false;
    }
    
    categories.splice(index, 1);
    return true;
};