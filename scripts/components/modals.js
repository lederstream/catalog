// scripts/components/modals.js
import { Utils } from '../core/utils.js';
import { ProductManager } from '../managers/product-manager.js';
import { CategoryManager } from '../managers/category-manager.js';

export class ModalManager {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupImageSearch();
    }

    setupEventListeners() {
        // Cerrar modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || 
                e.target.classList.contains('cancel-delete') || 
                e.target.id === 'cancelProductBtn') {
                this.hideCurrentModal();
            }
            
            if (e.target.classList.contains('modal-container')) {
                this.hideCurrentModal();
            }
        });

        // Tecla Escape para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.hideCurrentModal();
            }
        });
    }

    showModal(modalId, options = {}) {
        this.hideCurrentModal();
        
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        this.currentModal = modal;

        // Animación de entrada
        setTimeout(() => {
            modal.classList.add('opacity-100', 'scale-100');
        }, 10);

        // Focus en el primer input si existe
        if (options.focusFirstInput !== false) {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }

        return true;
    }

    hideCurrentModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('opacity-100', 'scale-100');
            setTimeout(() => {
                this.currentModal.classList.add('hidden');
                this.currentModal.classList.remove('flex');
            }, 300);
            this.currentModal = null;
        }
    }

    setupImageSearch() {
        const searchBtn = document.getElementById('performSearch');
        const searchInput = document.getElementById('imageSearchQuery');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => this.performImageSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performImageSearch();
            });
        }
    }

    async performImageSearch() {
        const query = document.getElementById('imageSearchQuery').value.trim();
        const resultsContainer = document.getElementById('imageSearchResults');
        
        if (!query) {
            Utils.showNotification('Por favor ingresa un término de búsqueda', 'error');
            return;
        }
        
        try {
            resultsContainer.innerHTML = this.getLoadingTemplate('Buscando imágenes...');
            
            // Simular búsqueda (reemplazar con API real)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            resultsContainer.innerHTML = this.getImageSearchInfoTemplate();
            
        } catch (error) {
            console.error('Error buscando imágenes:', error);
            resultsContainer.innerHTML = this.getErrorTemplate('Error al buscar imágenes');
        }
    }

    getLoadingTemplate(message) {
        return `
            <div class="col-span-full text-center py-8">
                <div class="loading-spinner inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="mt-2 text-gray-600">${message}</p>
            </div>
        `;
    }

    getImageSearchInfoTemplate() {
        return `
            <div class="col-span-full text-center py-8">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-image text-2xl text-blue-500"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Sistema de búsqueda de imágenes</h3>
                <p class="text-gray-600 mb-4">Ingresa la URL completa de la imagen manualmente</p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p class="text-sm text-blue-800 font-medium mb-1">Formato recomendado:</p>
                    <code class="text-xs bg-white p-2 rounded border block">https://ejemplo.com/ruta/imagen.jpg</code>
                    <p class="text-xs text-blue-600 mt-2">Asegúrate de que la URL sea accesible públicamente</p>
                </div>
            </div>
        `;
    }

    getErrorTemplate(message) {
        return `
            <div class="col-span-full text-center py-8">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                </div>
                <p class="text-gray-600">${message}</p>
                <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Reintentar
                </button>
            </div>
        `;
    }
}

export class ProductModal {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Añadir plan
        const addPlanBtn = document.getElementById('addPlanBtn');
        if (addPlanBtn) {
            addPlanBtn.addEventListener('click', () => this.addPlanRow());
        }

        // Buscar imagen
        const searchImageBtn = document.getElementById('searchImageBtn');
        if (searchImageBtn) {
            searchImageBtn.addEventListener('click', () => {
                this.modalManager.showModal('imageSearchModal');
            });
        }

        // Vista previa de imagen
        const photoUrlInput = document.getElementById('photo_url');
        if (photoUrlInput) {
            photoUrlInput.addEventListener('input', Utils.debounce((e) => {
                this.updateImagePreview(e.target.value);
            }, 500));
        }

        // Envío del formulario
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
        }

        // Añadir categoría
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.handleAddCategory());
        }
    }

    async open(product = null) {
        this.currentProduct = product;
        
        if (!this.modalManager.showModal('productModal')) return;

        await this.initializeForm(product);
    }

    async initializeForm(product) {
        const title = document.getElementById('productModalTitle');
        const submitText = document.getElementById('submitProductText');
        const form = document.getElementById('productForm');

        // Limpiar formulario
        form.reset();
        document.getElementById('productId').value = '';
        this.updateImagePreview('');

        // Configurar para edición o creación
        if (product) {
            title.textContent = 'Editar Producto';
            submitText.textContent = 'Actualizar Producto';
            
            // Llenar formulario
            document.getElementById('productId').value = product.id;
            document.getElementById('name').value = product.name || '';
            document.getElementById('category').value = product.category_id || '';
            document.getElementById('description').value = product.description || '';
            document.getElementById('photo_url').value = product.photo_url || '';
            
            // Vista previa
            if (product.photo_url) {
                this.updateImagePreview(product.photo_url);
            }
            
            // Cargar planes
            this.loadProductPlans(product);
        } else {
            title.textContent = 'Agregar Nuevo Producto';
            submitText.textContent = 'Agregar Producto';
            
            // Limpiar planes
            const plansContainer = document.getElementById('plansContainer');
            if (plansContainer) {
                plansContainer.innerHTML = '';
                this.addPlanRow();
            }
        }
        
        // Cargar categorías
        await this.loadCategories();
    }

    updateImagePreview(imageUrl) {
        const previewContainer = document.getElementById('imagePreview');
        if (!previewContainer) return;
        
        if (imageUrl) {
            previewContainer.innerHTML = `
                <div class="relative w-full h-full">
                    <img src="${imageUrl}" alt="Vista previa" 
                         class="w-full h-full object-cover rounded-lg"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+cargando+imagen'">
                    <button class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600"
                            onclick="document.getElementById('photo_url').value = ''; this.closest('#imagePreview').innerHTML = '<p class=\\'text-gray-500 text-center py-8\\>La imagen aparecerá aquí</p>';">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        } else {
            previewContainer.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fas fa-image text-3xl mb-2"></i>
                    <p>La imagen aparecerá aquí</p>
                </div>
            `;
        }
    }

    addPlanRow(planData = null, index = 0) {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;
        
        const planId = planData?.id || `plan-${Date.now()}-${index}`;
        const planName = planData?.name || '';
        const priceSoles = planData?.price_soles || '';
        const priceDollars = planData?.price_dollars || '';
        const features = planData?.features || '';
        
        const planRow = document.createElement('div');
        planRow.className = 'plan-row border border-gray-200 rounded-lg p-3 bg-gray-50';
        planRow.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-sm text-gray-700 mb-1">Nombre del Plan</label>
                    <input type="text" class="plan-name w-full px-3 py-2 border rounded" 
                           value="${planName}" placeholder="Ej: Plan Básico" required>
                </div>
                <div class="flex items-end">
                    <button type="button" class="remove-plan text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-trash mr-1"></i> Eliminar
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-sm text-gray-700 mb-1">Precio (S/)</label>
                    <input type="number" step="0.01" min="0" class="plan-price-soles w-full px-3 py-2 border rounded" 
                           value="${priceSoles}" placeholder="0.00">
                </div>
                <div>
                    <label class="block text-sm text-gray-700 mb-1">Precio ($)</label>
                    <input type="number" step="0.01" min="0" class="plan-price-dollars w-full px-3 py-2 border rounded" 
                           value="${priceDollars}" placeholder="0.00">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-700 mb-1">Características (separadas por coma)</label>
                <textarea class="plan-features w-full px-3 py-2 border rounded" rows="2" 
                          placeholder="Ej: HD, 4K, Subtítulos">${features}</textarea>
            </div>
        `;
        
        plansContainer.appendChild(planRow);
        
        // Añadir event listener para eliminar plan
        const removeBtn = planRow.querySelector('.remove-plan');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (plansContainer.querySelectorAll('.plan-row').length > 1) {
                    planRow.remove();
                } else {
                    Utils.showNotification('Debe haber al menos un plan', 'warning');
                }
            });
        }
    }

    loadProductPlans(product) {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;
        
        plansContainer.innerHTML = '';
        
        try {
            const plans = typeof product.plans === 'string' ? 
                JSON.parse(product.plans) : 
                (product.plans || []);
                
            if (plans.length === 0) {
                this.addPlanRow();
            } else {
                plans.forEach((plan, index) => {
                    this.addPlanRow(plan, index);
                });
            }
        } catch (error) {
            console.error('Error parsing plans:', error);
            this.addPlanRow();
        }
    }

    async loadCategories() {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;
        
        try {
            const { success, categories } = await CategoryManager.loadCategories();
            
            if (!success) {
                throw new Error('Error loading categories');
            }
            
            // Guardar opción actual seleccionada
            const currentValue = categorySelect.value;
            
            // Limpiar y llenar select
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
            // Restaurar valor seleccionado si existe
            if (currentValue) {
                categorySelect.value = currentValue;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            Utils.showNotification('Error al cargar categorías', 'error');
        }
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const productId = document.getElementById('productId').value;
        
        try {
            // Recopilar datos de los planes
            const plans = [];
            document.querySelectorAll('.plan-row').forEach(row => {
                const name = row.querySelector('.plan-name').value;
                const price_soles = parseFloat(row.querySelector('.plan-price-soles').value) || 0;
                const price_dollars = parseFloat(row.querySelector('.plan-price-dollars').value) || 0;
                const features = row.querySelector('.plan-features').value;
                
                if (name) {
                    plans.push({
                        name,
                        price_soles: price_soles > 0 ? price_soles : null,
                        price_dollars: price_dollars > 0 ? price_dollars : null,
                        features: features ? features.split(',').map(f => f.trim()) : []
                    });
                }
            });
            
            // Preparar datos del producto
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                category_id: formData.get('category'),
                photo_url: formData.get('photo_url'),
                plans: JSON.stringify(plans),
                status: 'active'
            };
            
            let result;
            if (productId) {
                // Actualizar producto existente
                result = await ProductManager.updateProduct(productId, productData);
                Utils.showNotification('Producto actualizado correctamente', 'success');
            } else {
                // Crear nuevo producto
                result = await ProductManager.addProduct(productData);
                Utils.showNotification('Producto creado correctamente', 'success');
            }
            
            // Cerrar modal
            this.modalManager.hideCurrentModal();
            
            // Recargar datos si estamos en el contexto de adminPage
            if (window.adminPage && typeof window.adminPage.loadData === 'function') {
                window.adminPage.loadData();
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            Utils.showNotification('Error al guardar el producto', 'error');
        }
    }

    async handleAddCategory() {
        const nameInput = document.getElementById('newCategoryName');
        const name = nameInput.value.trim();
        
        if (!name) {
            Utils.showNotification('Por favor ingresa un nombre para la categoría', 'error');
            return;
        }
        
        try {
            const result = await CategoryManager.createCategory(name);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            Utils.showNotification('Categoría añadida correctamente', 'success');
            nameInput.value = '';
            
            // Recargar listas de categorías
            this.loadCategories();
            
        } catch (error) {
            console.error('Error adding category:', error);
            Utils.showNotification('Error al añadir categoría: ' + error.message, 'error');
        }
    }
}

// Crear instancias globales
export const modalManager = new ModalManager();
export const productModal = new ProductModal(modalManager);
