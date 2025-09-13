// scripts/managers/category-manager.js
import { supabaseClient } from '../supabase.js';
import { Utils } from '../core/utils.js';

class CategoryManager {
    constructor() {
        this.categories = [];
        this.isLoading = false;
        this.listeners = new Set();
    }
    
    static async init() {
        const instance = new CategoryManager();
        await instance.loadCategories();
        return instance;
    }
    
    async loadCategories() {
        if (this.isLoading) return this.categories;
        
        this.isLoading = true;
        this.notifyListeners('loadingStart');
        
        try {
            const data = await supabaseClient.getCategories();
            this.categories = data || [];
            this.notifyListeners('categoriesLoaded', this.categories);
            return this.categories;
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            Utils.showError('Error al cargar categorías');
            this.notifyListeners('loadError', error);
            return [];
        } finally {
            this.isLoading = false;
            this.notifyListeners('loadingEnd');
        }
    }
    
    getCategories() {
        return this.categories;
    }
    
    getCategoryById(id) {
        return this.categories.find(category => category.id == id);
    }
    
    getCategoryByName(name) {
        return this.categories.find(category => 
            category.name.toLowerCase() === name.toLowerCase()
        );
    }
    
    async addCategory(categoryData) {
        try {
            const result = await supabaseClient.addCategory(categoryData);
            
            if (result) {
                this.categories.push(result);
                this.notifyListeners('categoryAdded', result);
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
                if (index !== -1) {
                    this.categories[index] = result;
                    this.notifyListeners('categoryUpdated', result);
                }
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
            this.notifyListeners('categoryDeleted', id);
            Utils.showSuccess('✅ Categoría eliminada correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            Utils.showError('Error al eliminar categoría');
            throw error;
        }
    }
    
    // Sistema de eventos
    addListener(event, callback) {
        this.listeners.add({ event, callback });
    }
    
    removeListener(event, callback) {
        for (const listener of this.listeners) {
            if (listener.event === event && listener.callback === callback) {
                this.listeners.delete(listener);
                break;
            }
        }
    }
    
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            if (listener.event === event) {
                try {
                    listener.callback(data);
                } catch (error) {
                    console.error(`Error en listener para evento ${event}:`, error);
                }
            }
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

// Exportar la clase también
export { CategoryManager };

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
    
    getCategoryByName(name) {
        return categoryManagerInstance ? categoryManagerInstance.getCategoryByName(name) : null;
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
    },
    
    addListener(event, callback) {
        if (categoryManagerInstance) {
            categoryManagerInstance.addListener(event, callback);
        }
    },
    
    removeListener(event, callback) {
        if (categoryManagerInstance) {
            categoryManagerInstance.removeListener(event, callback);
        }
    }
};

// Hacer disponible globalmente
window.categoryManager = categoryManager;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await getCategoryManager();
        console.log('✅ CategoryManager inicializado');
    } catch (error) {
        console.error('Error inicializando CategoryManager:', error);
    }
});
