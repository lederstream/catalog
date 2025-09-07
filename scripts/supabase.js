// scripts/supabase.js
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';

// Inicializar Supabase
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

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
export const addCategoryToSupabase = async (categoryData) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                name: categoryData.name,
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

// Función para actualizar categoría en Supabase
export const updateCategoryInSupabase = async (id, categoryData) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .update({
                name: categoryData.name,
                created_at_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        throw error;
    }
};

// Función para eliminar categoría en Supabase
export const deleteCategoryFromSupabase = async (id) => {
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        throw error;
    }
};

// Función para obtener productos desde Supabase
export const loadProductsFromSupabase = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error cargando productos:', error);
        return [];
    }
};

// Función para agregar producto en Supabase
export const addProductToSupabase = async (productData) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: productData.name,
                description: productData.description,
                category_id: productData.category_id,
                photo_url: productData.photo_url,
                plans: productData.plans,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error agregando producto:', error);
        throw error;
    }
};

// Función para actualizar producto en Supabase
export const updateProductInSupabase = async (id, productData) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: productData.name,
                description: productData.description,
                category_id: productData.category_id,
                photo_url: productData.photo_url,
                plans: productData.plans,
                created_at_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error actualizando producto:', error);
        throw error;
    }
};

// Función para eliminar producto en Supabase
export const deleteProductFromSupabase = async (id) => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error eliminando producto:', error);
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
