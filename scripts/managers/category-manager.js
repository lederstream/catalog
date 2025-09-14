// scripts/managers/category-manager.js
import { supabase } from '../supabase.js';
import { Utils } from '../core/utils.js';

export class CategoryManager {
    constructor() {
        this.categories = [];
    }

    async loadCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            this.categories = data || [];
            return { success: true, categories: this.categories };
        } catch (error) {
            console.error('Error al cargar categorías:', error.message);
            return { success: false, error: error.message };
        }
    }

    async createCategory(name, color = '#3B82F6') {
        try {
            if (!name || name.trim().length < 2) {
                return { success: false, error: 'El nombre de la categoría debe tener al menos 2 caracteres' };
            }
            
            const { data, error } = await supabase
                .from('categories')
                .insert([{ name: name.trim(), color }])
                .select()
                .single();
            
            if (error) throw error;
            
            Utils.showNotification('Categoría creada exitosamente', 'success');
            return { success: true, category: data };
        } catch (error) {
            console.error('Error al crear categoría:', error.message);
            Utils.showNotification('Error al crear categoría: ' + error.message, 'error');
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
            
            Utils.showNotification('Categoría actualizada exitosamente', 'success');
            return { success: true, category: data };
        } catch (error) {
            console.error('Error al actualizar categoría:', error.message);
            Utils.showNotification('Error al actualizar categoría: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    async deleteCategory(id) {
        try {
            // Verificar si hay productos asociados a esta categoría
            const { count, error: checkError } = await supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('category_id', id);
            
            if (checkError) throw checkError;
            
            if (count > 0) {
                return { 
                    success: false, 
                    error: 'No se puede eliminar la categoría porque tiene productos asociados' 
                };
            }
            
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            Utils.showNotification('Categoría eliminada exitosamente', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar categoría:', error.message);
            Utils.showNotification('Error al eliminar categoría: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    getCategoryById(id) {
        return this.categories.find(category => category.id === id);
    }

    getCategoryColor(id) {
        const category = this.getCategoryById(id);
        return category ? category.color : '#3B82F6'; // Color por defecto
    }
}

