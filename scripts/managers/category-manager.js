// scripts/managers/category-manager.js
import { supabase } from '../core/supabase.js';
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
        Utils.showInfo('📂 Cargando categorías...');
        
        try {
            const data = await supabase.query('categories', {
                select: '*',
                order: { field: 'name', ascending: true }
            });
            
            this.categories = data || [];
            Utils.showSuccess(`✅ ${this.categories.length} categorías cargadas`);
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
            const result = await supabase.insert('categories', {
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon || 'fas fa-tag',
                color: categoryData.color || 'blue',
                created_at: new Date().toISOString()
            });
            
            if (result && result.length > 0) {
                const newCategory = result[0];
                this.categories.push(newCategory);
                Utils.showSuccess('✅ Categoría agregada correctamente');
                return newCategory;
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
            const result = await supabase.update('categories', id, {
                ...categoryData,
                updated_at: new Date().toISOString()
            });
            
            if (result && result.length > 0) {
                const updatedCategory = result[0];
                const index = this.categories.findIndex(c => c.id === id);
                if (index !== -1) {
                    this.categories[index] = updatedCategory;
                }
                Utils.showSuccess('✅ Categoría actualizada correctamente');
                return updatedCategory;
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
            await supabase.delete('categories', id);
            this.categories = this.categories.filter(c => c.id !== id);
            Utils.showSuccess('✅ Categoría eliminada correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            Utils.showError('Error al eliminar categoría');
            throw error;
        }
    }
    
    renderCategoriesList(container) {
        if (!container) {
            console.error('Contenedor de categorías no encontrado');
            return;
        }
        
        if (this.categories.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        container.innerHTML = this.categories.map(category => `
            <div class="category-item bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center ${this.getColorClass(category.color)}">
                            <i class="${category.icon || 'fas fa-tag'} text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${category.name}</h4>
                            ${category.description ? `<p class="text-sm text-gray-500 mt-1">${category.description}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-category p-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 transform hover:scale-110" 
                                data-id="${category.id}" title="Editar categoría">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-category p-2 text-red-600 hover:text-red-800 transition-colors duration-200 transform hover:scale-110" 
                                data-id="${category.id}" title="Eliminar categoría">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.attachCategoryEventListeners(container);
    }
    
    getEmptyStateHTML() {
        return `
            <div class="text-center py-8 animate-pulse">
                <i class="fas fa-tags text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No hay categorías</p>
                <p class="text-sm text-gray-400 mt-2">Agrega tu primera categoría</p>
            </div>
        `;
    }
    
    getColorClass(color) {
        const colorMap = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            red: 'bg-red-500',
            yellow: 'bg-yellow-500',
            purple: 'bg-purple-500',
            pink: 'bg-pink-500',
            indigo: 'bg-indigo-500'
        };
        return colorMap[color] || 'bg-blue-500';
    }
    
    attachCategoryEventListeners(container) {
        container.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.handleEditCategory(id);
            });
        });
        
        container.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.handleDeleteCategory(id);
            });
        });
    }
    
    handleEditCategory(id) {
        const category = this.getCategoryById(id);
        if (category) {
            Utils.showInfo(`✏️ Editando: ${category.name}`);
            // Aquí implementarías la lógica de edición
        }
    }
    
    async handleDeleteCategory(id) {
        const category = this.getCategoryById(id);
        if (!category) return;
        
        const confirmed = confirm(`¿Eliminar categoría "${category.name}"?`);
        if (!confirmed) return;
        
        try {
            await this.deleteCategory(id);
            
            // Recargar lista si hay un contenedor visible
            const visibleContainer = document.querySelector('#categoriesList:not([style*="display: none"])');
            if (visibleContainer) {
                this.renderCategoriesList(visibleContainer);
            }
        } catch (error) {
            // Error ya manejado en deleteCategory
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
export async function loadCategories() {
    const manager = await getCategoryManager();
    return manager.loadCategories();
}

export function getCategories() {
    return categoryManagerInstance ? categoryManagerInstance.getCategories() : [];
}

export function getCategoryById(id) {
    return categoryManagerInstance ? categoryManagerInstance.getCategoryById(id) : null;
}

export async function addCategory(categoryData) {
    const manager = await getCategoryManager();
    return manager.addCategory(categoryData);
}

export async function updateCategory(id, categoryData) {
    const manager = await getCategoryManager();
    return manager.updateCategory(id, categoryData);
}

export async function deleteCategory(id) {
    const manager = await getCategoryManager();
    return manager.deleteCategory(id);
}

export function renderCategoriesList(container) {
    if (categoryManagerInstance) {
        categoryManagerInstance.renderCategoriesList(container);
    }
}

// Hacer disponible globalmente
window.CategoryManager = CategoryManager;
window.categoryManager = getCategoryManager();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    window.categoryManager = await getCategoryManager();
});
