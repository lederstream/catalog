// scripts/core/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuración de Supabase
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';

// Crear cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funciones básicas de Supabase
export const supabaseClient = {
    // Categorías
    async getCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    },

    async addCategory(categoryData) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    name: categoryData.name,
                    description: categoryData.description,
                    icon: categoryData.icon || 'fas fa-tag',
                    color: categoryData.color || 'blue',
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    },

    async updateCategory(id, categoryData) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update({
                    name: categoryData.name,
                    description: categoryData.description,
                    icon: categoryData.icon,
                    color: categoryData.color,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    async deleteCategory(id) {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    // Productos
    async getProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(*)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    },

    async addProduct(productData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: productData.name,
                    description: productData.description,
                    category_id: productData.category_id,
                    photo_url: productData.photo_url,
                    plans: productData.plans || [],
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    },

    async updateProduct(id, productData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({
                    name: productData.name,
                    description: productData.description,
                    category_id: productData.category_id,
                    photo_url: productData.photo_url,
                    plans: productData.plans,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    async deleteProduct(id) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
};

// Verificar conexión
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('products').select('count').limit(1);
        return !error;
    } catch (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
};

// Inicializar Supabase
export const initSupabase = async () => {
    try {
        const isConnected = await checkSupabaseConnection();
        if (isConnected) {
            console.log('✅ Supabase conectado correctamente');
            return true;
        } else {
            console.error('❌ Error conectando con Supabase');
            return false;
        }
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        return false;
    }
};

// Inicializar automáticamente
initSupabase();
