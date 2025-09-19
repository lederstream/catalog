// scripts/managers/category-manager.js
import { supabase } from '../supabase.js';
import { Utils } from '../core/utils.js';

class CategoryManager {
    constructor() {
        this.categories = [];
        this.isInitialized = false;
    }

    async loadCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            this.categories = data || [];
            this.isInitialized = true;
            return { success: true, categories: this.categories };
        } catch (error) {
            console.error('Error loading categories:', error.message);
            this.categories = [];
            return { success: false, error: error.message };
        }
    }

    async createCategory(name, color = '#3B82F6') {
        try {
            if (!name || name.trim().length < 2) {
                return { success: false, error: 'Category name must be at least 2 characters long' };
            }
            
            const { data, error } = await supabase
                .from('categories')
                .insert([{ name: name.trim(), color }])
                .select()
                .single();

            if (error) throw error;
            
            // Update local list
            this.categories.push(data);
            this.categories.sort((a, b) => a.name.localeCompare(b.name));
            
            return { success: true, category: data };
        } catch (error) {
            console.error('Error creating category:', error.message);
            return { success: false, error: error.message };
        }
    }

    async updateCategory(id, updates) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            // Update local list
            const index = this.categories.findIndex(cat => cat.id === id);
            if (index !== -1) {
                this.categories[index] = { ...this.categories[index], ...updates };
            }
            
            return { success: true, category: data };
        } catch (error) {
            console.error('Error updating category:', error.message);
            return { success: false, error: error.message };
        }
    }

    async deleteCategory(id) {
        try {
            // Verificar si hay productos usando esta categoría
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('category_id', id);
                
            if (productsError) throw productsError;
            
            // Si hay productos, actualizarlos para quitar la categoría
            if (products && products.length > 0) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ category_id: null })
                    .eq('category_id', id);
                    
                if (updateError) throw updateError;
            }
            
            // Luego eliminar la categoría
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from local list
            this.categories = this.categories.filter(cat => cat.id !== id);
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting category:', error.message);
            return { 
                success: false, 
                error: error.message || 'Error al eliminar la categoría' 
            };
        }
    }

    // Método para parsear mensajes de error de Supabase
    parseErrorMessage(error) {
        console.log('🔍 Error details:', error);
        
        if (error.code === '42501') {
            return 'No tienes permisos para realizar esta acción. Verifica las políticas RLS.';
        }
        if (error.code === '23505') {
            return 'Ya existe una categoría con ese nombre.';
        }
        if (error.code === '42P01') {
            return 'La tabla categories no existe. Verifica la base de datos.';
        }
        if (error.code === '42703') {
            return 'Error en la estructura de la base de datos.';
        }
        if (error.message.includes('JWT')) {
            return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        }
        
        return error.message || 'Error de base de datos';
    }

    getCategoryById(id) {
        return this.categories.find(category => category.id === id);
    }

    getCategoryColor(id) {
        const category = this.getCategoryById(id);
        return category ? category.color : '#3B82F6'; // Default color
    }

    getCategories() {
        return this.categories;
    }
    
    async initialize() {
        try {
            console.log('🔄 Inicializando CategoryManager...');
            const result = await this.loadCategories();
            console.log('✅ CategoryManager inicializado:', result.success);
            return result;
        } catch (error) {
            console.error('❌ Error initializing CategoryManager:', error);
            return { success: false, error: error.message };
        }
    }
    
}



// Global instance for use throughout the application
export const categoryManager = new CategoryManager();
