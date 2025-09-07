// scripts/categories.js
import { 
    loadCategoriesFromSupabase, 
    addCategoryToSupabase, 
    updateCategoryInSupabase, 
    deleteCategoryFromSupabase 
} from './supabase.js';
import { Utils } from './utils.js';

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
            const data = await loadCategoriesFromSupabase();
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
            const result = await addCategoryToSupabase(categoryData);
            
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
            const result = await updateCategoryInSupabase(id, categoryData);
            
            if (result) {
                const index = this.categories.findIndex(c => c.id === id);
                if (index !== -1) {
                    this.categories[index] = result;
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
            await deleteCategoryFromSupabase(id);
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
            // Abrir modal de edición
            this.openCategoryModal(category);
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
    
    openCategoryModal(category = null) {
        const isEdit = category !== null;
        const modalId = 'categoryModal';
        
        // Crear modal
        const modalHTML = `
            <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-lg max-w-md w-full">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">${isEdit ? 'Editar' : 'Agregar'} Categoría</h3>
                        
                        <form id="categoryForm" class="space-y-4">
                            <input type="hidden" id="categoryId" value="${isEdit ? category.id : ''}">
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" id="categoryName" value="${isEdit ? category.name : ''}" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors close-modal">
                                    Cancelar
                                </button>
                                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    ${isEdit ? 'Actualizar' : 'Agregar'} Categoría
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si hay uno
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar modal al documento
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Mostrar modal con animación
        const modal = modalContainer.querySelector(`#${modalId}`);
        Utils.fadeIn(modal);
        
        // Configurar formulario
        const form = modal.querySelector('#categoryForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const categoryData = {
                name: document.getElementById('categoryName').value,
                description: document.getElementById('categoryDescription').value,
                icon: document.getElementById('categoryIcon').value,
                color: document.getElementById('categoryColor').value
            };
            
            const categoryId = document.getElementById('categoryId').value;
            
            try {
                if (categoryId) {
                    // Editar categoría existente
                    await this.updateCategory(categoryId, categoryData);
                } else {
                    // Agregar nueva categoría
                    await this.addCategory(categoryData);
                }
                
                // Cerrar modal
                this.closeCategoryModal(modalId);
                
                // Recargar lista de categorías
                const categoriesList = document.getElementById('categoriesList');
                if (categoriesList) {
                    this.renderCategoriesList(categoriesList);
                }
                
                // Recargar selector de categorías en formulario de productos
                if (typeof window.loadCategoriesIntoSelect === 'function') {
                    window.loadCategoriesIntoSelect();
                }
                
            } catch (error) {
                console.error('Error al guardar categoría:', error);
            }
        });
        
        // Agregar event listeners para cerrar el modal
        const closeModal = () => this.closeCategoryModal(modalId);
        
        modalContainer.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
        
        // Cerrar con tecla Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        
        document.addEventListener('keydown', handleEscape);
    }
    
    closeCategoryModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            Utils.fadeOut(modal).then(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
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

// Función para abrir modal de categoría
export function openCategoryModal(category = null) {
    if (categoryManagerInstance) {
        categoryManagerInstance.openCategoryModal(category);
    }
}

// Hacer disponible globalmente
window.CategoryManager = CategoryManager;
window.categoryManager = getCategoryManager;
window.openCategoryModal = openCategoryModal;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    window.categoryManager = await getCategoryManager();
});
