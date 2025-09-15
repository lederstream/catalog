// scripts/managers/category-manager.js
import { supabase } from '../supabase.js';
import { Utils } from '../core/utils.js';

export class CategoryManager {
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
            return { success: true, categories: this.categories };
        } catch (error) {
            console.error('Error loading categories:', error.message);
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
            
            Utils.showNotification('Category created successfully', 'success');
            return { success: true, category: data };
        } catch (error) {
            console.error('Error creating category:', error.message);
            Utils.showNotification('Error creating category: ' + error.message, 'error');
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
            
            Utils.showNotification('Category updated successfully', 'success');
            return { success: true, category: data };
        } catch (error) {
            console.error('Error updating category:', error.message);
            Utils.showNotification('Error updating category: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    async deleteCategory(id) {
        try {
            // Check if there are products associated with this category
            const { count, error: checkError } = await supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('category_id', id);
            
            if (checkError) throw checkError;
            
            if (count > 0) {
                return { 
                    success: false, 
                    error: 'Cannot delete category because it has associated products' 
                };
            }
            
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from local list
            this.categories = this.categories.filter(cat => cat.id !== id);
            
            Utils.showNotification('Category deleted successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error deleting category:', error.message);
            Utils.showNotification('Error deleting category: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
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
export const CategoryManager = new CategoryManager();
