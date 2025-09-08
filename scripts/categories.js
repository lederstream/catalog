// scripts/categories.js - VERSIÓN MEJORADA
import { 
    loadCategoriesFromSupabase, 
    addCategoryToSupabase, 
    updateCategoryInSupabase, 
    deleteCategoryFromSupabase 
} from './supabase.js';
import { Utils } from './utils.js';
import { showConfirmationModal } from './modals.js';

class CategoryManager {
    constructor() {
        this.categories = [];
        this.isLoading = false;
        this.currentlyEditing = null;
        this.loadPromise = null; // Para evitar cargas duplicadas
    }
    
    static async init() {
        const instance = new CategoryManager();
        await instance.loadCategories();
        return instance;
    }
    
    async loadCategories() {
        // Si ya está cargando, retornar la promesa existente
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        if (this.isLoading) return this.categories;
        
        this.isLoading = true;
        
        try {
            this.loadPromise = loadCategoriesFromSupabase();
            const data = await this.loadPromise;
            this.categories = data || [];
            return this.categories;
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            Utils.showError('Error al cargar categorías');
            return [];
        } finally {
            this.isLoading = false;
            this.loadPromise = null; // Resetear la promesa
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
            <div class="category-item bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300" data-category-id="${category.id}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500">
                            <i class="fas fa-tag text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${category.name}</h4>
                            <p class="text-sm text-gray-500 mt-1">ID: ${category.id}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-category p-2 text-blue-600 hover:text-blue-800 transition-colors duration-200" 
                                data-id="${category.id}" title="Editar categoría">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-category p-2 text-red-600 hover:text-red-800 transition-colors duration-200" 
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
            <div class="text-center py-8">
                <i class="fas fa-tags text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No hay categorías</p>
                <p class="text-sm text-gray-400 mt-2">Agrega tu primera categoría</p>
            </div>
        `;
    }
    
    attachCategoryEventListeners(container) {
        // Botones de editar
        container.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.startEditCategory(id);
            });
        });
        
        // Botones de eliminar
        container.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.handleDeleteCategory(id);
            });
        });
    }
    
    async startEditCategory(id) {
        try {
            const category = this.getCategoryById(id);
            
            if (category) {
                this.currentlyEditing = id;
                
                const modal = document.getElementById('categoriesModal');
                if (!modal) return;
                
                // Llenar formulario con datos de la categoría
                const categoryIdInput = modal.querySelector('#categoryId');
                const categoryNameInput = modal.querySelector('#categoryName');
                const submitText = modal.querySelector('#categorySubmitText');
                const cancelBtn = modal.querySelector('#cancelCategoryEdit');
                
                if (categoryIdInput) categoryIdInput.value = id;
                if (categoryNameInput) categoryNameInput.value = category.name || '';
                if (submitText) submitText.textContent = 'Actualizar Categoría';
                if (cancelBtn) cancelBtn.classList.remove('hidden');
                
                // Scroll al formulario
                const form = modal.querySelector('#categoryForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } catch (error) {
            console.error('Error starting category edit:', error);
            Utils.showError('Error al preparar la edición');
        }
    }
    
    async handleDeleteCategory(id) {
        const category = this.getCategoryById(id);
        if (!category) return;
        
        showConfirmationModal({
            title: 'Eliminar Categoría',
            message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await this.deleteCategory(id);
                    Utils.showSuccess('✅ Categoría eliminada correctamente');
                    
                    // Recargar lista en todos los contenedores visibles
                    document.querySelectorAll('#categoriesListContainer, #categoriesList').forEach(container => {
                        if (container.offsetParent !== null) {
                            this.renderCategoriesList(container);
                        }
                    });
                } catch (error) {
                    console.error('Error al eliminar categoría:', error);
                    Utils.showError('Error al eliminar categoría');
                }
            }
        });
    }
    
    // Modal mejorado para gestión de categorías - VERSIÓN CORREGIDA
    openCategoryModal(category = null) {
        const isEdit = category !== null;
        const modalId = 'categoriesModal';
        
        // Eliminar modal existente si hay uno
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        // Crear modal nuevo
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Gestión de Categorías</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
                    <div class="mb-6 bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-medium text-blue-800 mb-2">${isEdit ? 'Editar' : 'Agregar'} Categoría</h4>
                        <form id="categoryForm" class="space-y-3">
                            <input type="hidden" id="categoryId" value="">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input type="text" id="categoryName" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div class="flex justify-end space-x-2">
                                <button type="button" id="cancelCategoryEdit" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 hidden">
                                    Cancelar
                                </button>
                                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <span id="categorySubmitText">${isEdit ? 'Actualizar' : 'Agregar'} Categoría</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-800 mb-3">Categorías Existentes</h4>
                        <div id="categoriesListContainer" class="space-y-2 max-h-64 overflow-y-auto">
                            <!-- Las categorías se cargarán aquí -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar event listeners inmediatamente
        this.setupModalEvents(modal);
        
        // Si estamos editando, llenar el formulario
        if (isEdit) {
            this.startEditCategory(category.id);
        } else {
            this.cancelEdit();
        }
        
        // Cargar categorías después de que el modal esté en el DOM
        setTimeout(() => {
            const listContainer = modal.querySelector('#categoriesListContainer');
            if (listContainer) {
                this.renderCategoriesList(listContainer);
            }
        }, 100);
        
        Utils.fadeIn(modal);
    }
    
    // Método para configurar eventos del modal - CORREGIDO
    setupModalEvents(modal) {
        // Cerrar modal
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Configurar formulario
        const form = modal.querySelector('#categoryForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategorySubmit(e);
            });
        }
        
        // Configurar botón de cancelar
        const cancelBtn = modal.querySelector('#cancelCategoryEdit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelEdit();
            });
        }
        
        // Prevenir que el clic dentro del modal lo cierre
        const modalContent = modal.querySelector('.bg-white');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const modal = document.getElementById('categoriesModal');
        if (!modal) return;
        
        const nameInput = modal.querySelector('#categoryName');
        const categoryIdInput = modal.querySelector('#categoryId');
        
        if (!nameInput) return;
        
        const formData = {
            name: nameInput.value.trim()
        };
        
        const categoryId = categoryIdInput ? categoryIdInput.value : '';
        
        if (!formData.name) {
            Utils.showError('El nombre de la categoría es requerido');
            return;
        }
        
        try {
            let result;
            const submitBtn = modal.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Mostrar estado de carga
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            submitBtn.disabled = true;
            
            if (categoryId) {
                // Actualizar categoría existente
                result = await this.updateCategory(categoryId, formData);
            } else {
                // Crear nueva categoría
                result = await this.addCategory(formData);
            }

            if (result) {
                Utils.showSuccess(categoryId ? '✅ Categoría actualizada correctamente' : '✅ Categoría agregada correctamente');
                
                // Recargar lista
                const listContainer = modal.querySelector('#categoriesListContainer');
                if (listContainer) {
                    this.renderCategoriesList(listContainer);
                }
                
                // Recargar selector de categorías en formularios de productos
                if (typeof window.loadCategoriesIntoSelect === 'function') {
                    window.loadCategoriesIntoSelect();
                }
                
                // Resetear formulario
                this.cancelEdit();
                
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error saving category:', error);
            Utils.showError('Error al guardar la categoría: ' + (error.message || 'Error desconocido'));
            
            // Restaurar botón en caso de error
            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = categoryId ? 'Actualizar Categoría' : 'Agregar Categoría';
                submitBtn.disabled = false;
            }
        }
    }
    
    cancelEdit() {
        const modal = document.getElementById('categoriesModal');
        if (modal) {
            const form = modal.querySelector('#categoryForm');
            if (form) {
                form.reset();
            }
            
            const categoryIdInput = modal.querySelector('#categoryId');
            if (categoryIdInput) {
                categoryIdInput.value = '';
            }
            
            const submitText = modal.querySelector('#categorySubmitText');
            if (submitText) {
                submitText.textContent = 'Agregar Categoría';
            }
            
            const cancelBtn = modal.querySelector('#cancelCategoryEdit');
            if (cancelBtn) {
                cancelBtn.classList.add('hidden');
            }
        }
        
        this.currentlyEditing = null;
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
    } else {
        // Si el manager no está inicializado, inicializarlo primero
        getCategoryManager().then(manager => {
            manager.openCategoryModal(category);
        });
    }
}

export async function loadCategoriesIntoSelect() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) {
        console.log('ℹ️ Selector de categoría no encontrado en esta página');
        return;
    }

    try {
        // Obtener categorías
        let categories = [];
        
        // Esperar a que el categoryManager esté disponible
        if (!window.categoryManager && typeof getCategoryManager === 'function') {
            window.categoryManager = await getCategoryManager();
        }
        
        if (window.categoryManager && typeof window.categoryManager.getCategories === 'function') {
            categories = window.categoryManager.getCategories();
        } else if (typeof window.getCategories === 'function') {
            categories = window.getCategories();
        } else if (typeof window.loadCategories === 'function') {
            categories = await window.loadCategories();
        }

        // Guardar la selección actual si existe
        const currentValue = categorySelect.value;
        const productId = document.getElementById('productId')?.value;
        
        // Limpiar y poblar el selector
        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
            
            console.log(`✅ ${categories.length} categorías cargadas en el selector`);
        } else {
            console.log('ℹ️ No se encontraron categorías para cargar en el selector');
            categorySelect.innerHTML = '<option value="">No hay categorías disponibles</option>';
        }
        
        // Restaurar la selección anterior para edición
        if (productId && currentValue) {
            // Esperar a que el DOM se actualice
            setTimeout(() => {
                if (categorySelect.querySelector(`option[value="${currentValue}"]`)) {
                    categorySelect.value = currentValue;
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('❌ Error loading categories into select:', error);
        // Mantener el selector aunque falle la carga
        categorySelect.innerHTML = '<option value="">Error cargando categorías</option>';
    }
}

// Hacer disponible globalmente
window.CategoryManager = CategoryManager;
window.categoryManager = getCategoryManager;
window.openCategoryModal = openCategoryModal;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.categoryManager = await getCategoryManager();
        console.log('✅ CategoryManager inicializado correctamente');
    } catch (error) {
        console.error('Error inicializando category manager:', error);
    }
});
