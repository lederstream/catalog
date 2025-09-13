// scripts/managers/category-manager.js
import { supabaseClient } from '../supabase.js';
import { Utils } from '../core/utils.js';

class CategoryManager {
    constructor() {
        this.categories = [];
        this.isLoading = false;
    }
    
    static async init() {
        const instance = new CategoryManager();
        await instance.loadCategories();
        return instance;
    }
    
    async loadCategories() {
        if (this.isLoading) return this.categories;
        
        this.isLoading = true;
        
        try {
            const data = await supabaseClient.getCategories();
            this.categories = data || [];
            return this.categories;
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            Utils.showError('Error al cargar categorías');
            return [];
        } finally {
            this.isLoading = false;
        }
    }
    
    getCategories() {
        return this.categories;
    }
    
    getCategoryById(id) {
        return this.categories.find(category => category.id == id);
    }
    
    async addCategory(categoryData) {
        try {
            const result = await supabaseClient.addCategory(categoryData);
            
            if (result) {
                this.categories.push(result);
                Utils.showSuccess('✅ Categoría agregada correctamente');
                return result;
            }
            
            return null;
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            Utils.showError('Error al agregar categoría');
            throw error;
        }
    }
    
    async updateCategory(id, categoryData) {
        try {
            const result = await supabaseClient.updateCategory(id, categoryData);
            
            if (result) {
                const index = this.categories.findIndex(c => c.id === id);
                if (index !== -1) this.categories[index] = result;
                Utils.showSuccess('✅ Categoría actualizada correctamente');
                return result;
            }
            
            return null;
        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            Utils.showError('Error al actualizar categoría');
            throw error;
        }
    }
    
    async deleteCategory(id) {
        try {
            await supabaseClient.deleteCategory(id);
            this.categories = this.categories.filter(c => c.id !== id);
            Utils.showSuccess('✅ Categoría eliminada correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            Utils.showError('Error al eliminar categoría');
            throw error;
        }
    }
}

// Singleton instance
let categoryManagerInstance = null;

export async function getCategoryManager() {
    if (!categoryManagerInstance) {
        categoryManagerInstance = await CategoryManager.init();
    }
    return categoryManagerInstance;
}

// Funciones de compatibilidad
export const categoryManager = {
    async loadCategories() {
        const manager = await getCategoryManager();
        return manager.loadCategories();
    },

    getCategories() {
        return categoryManagerInstance ? categoryManagerInstance.getCategories() : [];
    },

    getCategoryById(id) {
        return categoryManagerInstance ? categoryManagerInstance.getCategoryById(id) : null;
    },

    async addCategory(categoryData) {
        const manager = await getCategoryManager();
        return manager.addCategory(categoryData);
    },

    async updateCategory(id, categoryData) {
        const manager = await getCategoryManager();
        return manager.updateCategory(id, categoryData);
    },

    async deleteCategory(id) {
        const manager = await getCategoryManager();
        return manager.deleteCategory(id);
    }
};

// Hacer disponible globalmente
window.categoryManager = categoryManager;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await getCategoryManager();
    } catch (error) {
        console.error('Error inicializando CategoryManager:', error);
    }
});
