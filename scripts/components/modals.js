// scripts/components/modals.js
import { Utils } from '../core/utils.js';
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';

// Modal Manager
class ModalManager {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
    }

    setupGlobalEventListeners() {
        // Cerrar modales al hacer clic en el botón de cerrar o fuera del modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || 
                e.target.closest('.modal-close') ||
                (e.target.classList.contains('modal-overlay') && e.target === this.currentModal)) {
                this.hideCurrentModal();
                e.preventDefault();
                e.stopPropagation();
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
        if (!modal) {
            console.error(`Modal con ID ${modalId} no encontrado`);
            return false;
        }

        // Asegurar que el modal tenga la estructura correcta
        if (!modal.classList.contains('modal-overlay')) {
            modal.classList.add('modal-overlay');
            const modalContent = modal.innerHTML;
            modal.innerHTML = '';
            
            const container = document.createElement('div');
            container.className = 'modal-container';
            if (modalId === 'productModal' || modalId === 'statsModal') {
                container.classList.add('modal-xl');
            } else if (modalId === 'categoriesModal' || modalId === 'imageSearchModal') {
                container.classList.add('modal-lg');
            }
            container.innerHTML = modalContent;
            modal.appendChild(container);
        }
        
        modal.classList.remove('hidden');
        this.currentModal = modal;

        // Deshabilitar scroll del body pero permitir scroll en el modal
        document.body.style.overflow = 'hidden';

        // Enfocar el primer input si existe
        if (options.focusFirstInput !== false) {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) setTimeout(() => firstInput.focus(), 100);
        }

        return true;
    }

    hideCurrentModal() {
        if (this.currentModal) {
            this.currentModal.classList.add('hidden');
            this.currentModal = null;
            
            // Habilitar scroll del body
            document.body.style.overflow = 'auto';
        }
    }
}

// Product Modal
class ProductModal {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.currentProduct = null;
        this.handleProductSubmitBound = this.handleProductSubmit.bind(this);
        this.eventListeners = new Map();
    }

    setupEventListeners() {
        this.removeEventListeners();
        
        // Add plan
        this.addListener('#addPlanBtn', 'click', () => this.addPlanRow());
        
        // Search image
        this.addListener('#searchImageBtn', 'click', () => {
            this.modalManager.showModal('imageSearchModal');
        });

        // Image preview
        const photoUrlInput = document.getElementById('photo_url');
        if (photoUrlInput) {
            this.addListener(photoUrlInput, 'input', Utils.debounce((e) => {
                this.updateImagePreview(e.target.value);
            }, 500));
        }

        // Form submission
        const productForm = document.getElementById('productForm');
        if (productForm) {
            this.addListener(productForm, 'submit', this.handleProductSubmitBound);
        }

        // Cancel button
        this.addListener('#cancelProductBtn', 'click', () => {
            this.modalManager.hideCurrentModal();
        });
    }

    addListener(selector, event, handler) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.set(`${selector}-${event}`, { element, event, handler });
        }
    }

    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    async open(product = null) {
        this.currentProduct = product;
        
        if (!this.modalManager.showModal('productModal')) return;

        await this.initializeForm(product);
        this.setupEventListeners();
        this.setupPlanButtons();
    }

    async initializeForm(product) {
        const title = document.getElementById('productModalTitle');
        const submitText = document.getElementById('submitProductText');
        const form = document.getElementById('productForm');

        // Clear form
        if (form) form.reset();
        document.getElementById('productId').value = '';
        this.updateImagePreview('');

        // Configure for edit or create
        if (product) {
            title.textContent = 'Editar Producto';
            submitText.textContent = 'Actualizar Producto';
            
            // Fill form
            document.getElementById('productId').value = product.id;
            document.getElementById('name').value = product.name || '';
            document.getElementById('category').value = product.category_id || '';
            document.getElementById('description').value = product.description || '';
            document.getElementById('photo_url').value = product.photo_url || '';
            
            // Preview
            if (product.photo_url) {
                this.updateImagePreview(product.photo_url);
            }
            
            // Load plans
            this.loadProductPlans(product);
        } else {
            title.textContent = 'Agregar Nuevo Producto';
            submitText.textContent = 'Agregar Producto';
            
            // Clear plans
            const plansContainer = document.getElementById('plansContainer');
            if (plansContainer) {
                plansContainer.innerHTML = '';
                this.addPlanRow();
            }
        }
        
        // Load categories
        await this.loadCategories();
    }

    updateImagePreview(imageUrl) {
        const previewContainer = document.getElementById('imagePreview');
        if (!previewContainer) return;
        
        if (imageUrl && this.isValidUrl(imageUrl)) {
            previewContainer.innerHTML = `
                <div class="relative w-full h-full">
                    <img src="${imageUrl}" alt="Preview" 
                         class="w-full h-full object-cover rounded-lg"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+loading+image'">
                    <button type="button" class="modal-close absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600"
                            onclick="document.getElementById('photo_url').value = ''; this.parentElement.parentElement.innerHTML = this.getDefaultPreviewHTML();">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        } else {
            previewContainer.innerHTML = this.getDefaultPreviewHTML();
        }
    }

    getDefaultPreviewHTML() {
        return `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-image text-3xl mb-2"></i>
                <p>La imagen aparecerá aquí</p>
            </div>
        `;
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
                    <label class="block text-sm text-gray-700 mb-1">Nombre del Plan *</label>
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
                    <label class="block text-sm text-gray-700 mb-1">Precio (S/) *</label>
                    <input type="number" step="0.01" min="0" class="plan-price-soles w-full px-3 py-2 border rounded" 
                           value="${priceSoles}" placeholder="0.00" required>
                </div>
                <div>
                    <label class="block text-sm text-gray-700 mb-1">Precio ($)</label>
                    <input type="number" step="0.01" min="0" class="plan-price-dollars w-full px-3 py-2 border rounded" 
                           value="${priceDollars}" placeholder="0.00">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-700 mb-1">Características (separadas por comas)</label>
                <textarea class="plan-features w-full px-3 py-2 border rounded" rows="2" 
                          placeholder="Ej: HD, 4K, Subtítulos">${features}</textarea>
            </div>
        `;
        
        plansContainer.appendChild(planRow);
        
        // Add event listener to remove plan
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

    setupPlanButtons() {
        // Botón para agregar plan
        const addPlanBtn = document.getElementById('addPlanBtn');
        if (addPlanBtn) {
            addPlanBtn.addEventListener('click', () => this.addPlanRow());
        }

        // Botones para eliminar planes
        document.querySelectorAll('.remove-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planRow = e.target.closest('.plan-row');
                if (document.querySelectorAll('.plan-row').length > 1) {
                    planRow.remove();
                } else {
                    Utils.showNotification('Debe haber al menos un plan', 'warning');
                }
            });
        });
    }

    loadProductPlans(product) {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;
        
        plansContainer.innerHTML = '';
        
        try {
            let plans = [];
            if (typeof product.plans === 'string') {
                plans = JSON.parse(product.plans);
            } else if (Array.isArray(product.plans)) {
                plans = product.plans;
            }
                
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
            const { success, categories } = await categoryManager.loadCategories();
            
            if (!success) {
                throw new Error('Error loading categories');
            }
            
            // Save current selected option
            const currentValue = categorySelect.value;
            
            // Clear and fill select
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
            // Restore selected value if exists
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
            // Collect plan data
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
            
            // Validate form
            if (!this.validateForm(formData, plans)) {
                return;
            }
            
            // Prepare product data
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                category_id: formData.get('category'),
                photo_url: formData.get('photo_url'),
                plans: JSON.stringify(plans),
            };
            
            let result;
            if (productId) {
                // Update existing product
                result = await productManager.updateProduct(productId, productData);
                Utils.showNotification('Producto actualizado correctamente', 'success');
            } else {
                // Create new product
                result = await productManager.createProduct(productData);
                Utils.showNotification('Producto creado correctamente', 'success');
            }
            
            // Close modal
            this.modalManager.hideCurrentModal();
            
            // Reload data if in adminPage context
            if (window.adminPage && typeof window.adminPage.loadData === 'function') {
                window.adminPage.loadData(true);
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            Utils.showNotification('Error al guardar el producto: ' + error.message, 'error');
        }
    }

    validateForm(formData, plans) {
        // Validar nombre
        if (!formData.get('name') || formData.get('name').trim().length < 2) {
            Utils.showNotification('El nombre del producto debe tener al menos 2 caracteres', 'error');
            return false;
        }
        
        // Validar categoría
        if (!formData.get('category')) {
            Utils.showNotification('Debe seleccionar una categoría', 'error');
            return false;
        }
        
        // Validar descripción
        if (!formData.get('description') || formData.get('description').trim().length < 10) {
            Utils.showNotification('La descripción debe tener al menos 10 caracteres', 'error');
            return false;
        }
        
        // Validar URL de imagen
        if (!formData.get('photo_url') || !this.isValidUrl(formData.get('photo_url'))) {
            Utils.showNotification('Debe proporcionar una URL de imagen válida', 'error');
            return false;
        }
        
        // Validar planes
        if (plans.length === 0) {
            Utils.showNotification('Debe agregar al menos un plan', 'error');
            return false;
        }
        
        for (const plan of plans) {
            if (!plan.name || plan.name.trim().length === 0) {
                Utils.showNotification('Todos los planes deben tener un nombre', 'error');
                return false;
            }
            
            if (!plan.price_soles && !plan.price_dollars) {
                Utils.showNotification('Cada plan debe tener al menos un precio (S/ o $)', 'error');
                return false;
            }
        }
        
        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Categories Modal
class CategoriesModal {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.eventListeners = new Map();
    }

    setupEventListeners() {
        this.removeEventListeners();
        
        // Add category
        this.addListener('#addCategoryBtn', 'click', () => this.handleAddCategory());

        // Cerrar modal
        const closeButtons = document.querySelectorAll('#categoriesModal .modal-close, #categoriesModal .cancel-btn');
        closeButtons.forEach(btn => {
            this.addListener(btn, 'click', () => {
                this.modalManager.hideCurrentModal();
            });
        });

        // Configurar event listeners para botones de categorías
        this.setupCategoryEventListeners();
    }

    addListener(selector, event, handler) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) {
            element.addEventListener(event, handler);
            const key = `${selector}-${event}`;
            this.eventListeners.set(key, { element, event, handler });
        }
    }

    setupCategoryButtons() {
        // Botón para agregar categoría
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.handleAddCategory());
        }

        // Botones de editar y eliminar categorías
        document.querySelectorAll('.edit-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.editCategory(categoryId);
            });
        });

        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.confirmDeleteCategory(categoryId);
            });
        });
    }

    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    async open() {
        if (!this.modalManager.showModal('categoriesModal')) return;
        await this.renderCategoriesList();
        this.setupEventListeners();
        this.setupCategoryButtons();
    }

    async renderCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        // Cargar categorías actualizadas
        const { success, categories } = await categoryManager.loadCategories();
        
        if (!success || !categories || categories.length === 0) {
            categoriesList.innerHTML = '<p class="text-gray-500 text-center py-4">No hay categorías</p>';
            return;
        }
        
        categoriesList.innerHTML = categories.map(category => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-category-id="${category.id}">
                <div class="flex items-center">
                    <span class="w-4 h-4 rounded-full mr-3" style="background-color: ${category.color || '#3B82F6'}"></span>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-category-btn text-blue-600 hover:text-blue-800" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-category-btn text-red-600 hover:text-red-800" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners para los botones
        this.setupCategoryEventListeners();
    }

    setupCategoryEventListeners() {
        // Botones de eliminar
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const categoryId = e.currentTarget.dataset.id;
                await this.confirmDeleteCategory(categoryId);
            });
        });

        // Botones de editar
        document.querySelectorAll('.edit-category-btn').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const categoryId = e.currentTarget.dataset.id;
                await this.editCategory(categoryId);
            });
        });
    }

    async editCategory(categoryId) {
        const category = categoryManager.getCategoryById(categoryId);
        if (!category) return;

        const newName = prompt('Nuevo nombre de categoría:', category.name);
        if (!newName || newName.trim() === '') return;

        const newColor = prompt('Nuevo color (hexadecimal):', category.color || '#3B82F6');
        
        try {
            Utils.showLoading('Actualizando categoría...');
            const result = await categoryManager.updateCategory(categoryId, {
                name: newName.trim(),
                color: newColor || '#3B82F6'
            });

            if (result.success) {
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showSuccess('Categoría actualizada correctamente');
            } else {
                Utils.showError(result.error);
            }
        } catch (error) {
            console.error('Error editing category:', error);
            Utils.showError('Error al actualizar la categoría');
        } finally {
            Utils.hideLoading();
        }
    }

    async confirmDeleteCategory(categoryId) {
        const category = categoryManager.getCategoryById(categoryId);
        if (!category) return;
        
        const confirmed = await Utils.showConfirm(
            `Eliminar "${category.name}"`,
            `¿Estás seguro de que deseas eliminar esta categoría? Los productos en esta categoría no se eliminarán pero perderán su asociación de categoría.`,
            'warning'
        );
        
        if (confirmed) {
            Utils.showLoading('Eliminando categoría...');
            const result = await categoryManager.deleteCategory(categoryId);
            
            if (result.success) {
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showSuccess('Categoría eliminada correctamente');
            } else {
                Utils.showError(result.error);
            }
        }
    }

    async handleAddCategory() {
        const nameInput = document.getElementById('newCategoryName');
        const name = nameInput.value.trim();
        
        if (!name) {
            Utils.showNotification('Por favor ingrese un nombre de categoría', 'error');
            return;
        }
        
        if (name.length < 2) {
            Utils.showNotification('El nombre de la categoría debe tener al menos 2 caracteres', 'error');
            return;
        }
        
        try {
            Utils.showLoading('Creando categoría...');
            const result = await categoryManager.createCategory(name);
            
            if (result.success) {
                nameInput.value = '';
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showSuccess('Categoría creada correctamente');
            } else {
                Utils.showError(result.error);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            Utils.showError('Error al crear la categoría: ' + error.message);
        } finally {
            Utils.hideLoading();
        }
    }
}

// Create global instances
const modalManager = new ModalManager();
const productModal = new ProductModal(modalManager);
const categoriesModal = new CategoriesModal(modalManager);

// Exportar las instancias
export { modalManager, productModal, categoriesModal };// scripts/components/modals.js
import { Utils } from '../core/utils.js';
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';

// Modal Manager
class ModalManager {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
    }

    setupGlobalEventListeners() {
        // Cerrar modales al hacer clic en el botón de cerrar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
                this.hideCurrentModal();
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Tecla Escape para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.hideCurrentModal();
            }
        });
    }

    showModal(modalId) {
        this.hideCurrentModal();
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal con ID ${modalId} no encontrado`);
            return false;
        }

        modal.classList.remove('hidden');
        this.currentModal = modal;

        // Deshabilitar scroll del body
        document.body.style.overflow = 'hidden';

        return true;
    }

    hideCurrentModal() {
        if (this.currentModal) {
            this.currentModal.classList.add('hidden');
            this.currentModal = null;
            document.body.style.overflow = 'auto';
        }
    }
}

// Product Modal corregido
class ProductModal {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.currentProduct = null;
    }

    async open(product = null) {
        this.currentProduct = product;
        
        if (!this.modalManager.showModal('productModal')) return;

        await this.initializeForm(product);
        this.setupEventListeners();
    }

    async initializeForm(product) {
        const title = document.getElementById('productModalTitle');
        const submitText = document.getElementById('submitProductText');

        // Limpiar formulario
        const form = document.getElementById('productForm');
        if (form) form.reset();
        document.getElementById('productId').value = '';
        this.updateImagePreview('');

        // Configurar para editar o crear
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

    setupEventListeners() {
        // Botón agregar plan
        const addPlanBtn = document.getElementById('addPlanBtn');
        if (addPlanBtn) {
            addPlanBtn.onclick = () => this.addPlanRow();
        }

        // Botón buscar imagen
        const searchImageBtn = document.getElementById('searchImageBtn');
        if (searchImageBtn) {
            searchImageBtn.onclick = () => {
                this.modalManager.showModal('imageSearchModal');
            };
        }

        // Preview de imagen
        const photoUrlInput = document.getElementById('photo_url');
        if (photoUrlInput) {
            photoUrlInput.oninput = Utils.debounce((e) => {
                this.updateImagePreview(e.target.value);
            }, 500);
        }

        // Form submission
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.onsubmit = (e) => this.handleProductSubmit(e);
        }
    }

    addPlanRow(planData = null) {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;
        
        const planName = planData?.name || '';
        const priceSoles = planData?.price_soles || '';
        const priceDollars = planData?.price_dollars || '';
        const features = planData?.features || '';
        
        const planRow = document.createElement('div');
        planRow.className = 'plan-row';
        planRow.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-sm text-gray-700 mb-1">Nombre del Plan *</label>
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
                    <label class="block text-sm text-gray-700 mb-1">Precio (S/) *</label>
                    <input type="number" step="0.01" min="0" class="plan-price-soles w-full px-3 py-2 border rounded" 
                           value="${priceSoles}" placeholder="0.00" required>
                </div>
                <div>
                    <label class="block text-sm text-gray-700 mb-1">Precio ($)</label>
                    <input type="number" step="0.01" min="0" class="plan-price-dollars w-full px-3 py-2 border rounded" 
                           value="${priceDollars}" placeholder="0.00">
                </div>
            </div>
            <div>
                <label class="block text-sm text-gray-700 mb-1">Características (separadas por comas)</label>
                <textarea class="plan-features w-full px-3 py-2 border rounded" rows="2" 
                          placeholder="Ej: HD, 4K, Subtítulos">${features}</textarea>
            </div>
        `;
        
        plansContainer.appendChild(planRow);
        
        // Event listener para eliminar plan
        const removeBtn = planRow.querySelector('.remove-plan');
        if (removeBtn) {
            removeBtn.onclick = () => {
                if (plansContainer.querySelectorAll('.plan-row').length > 1) {
                    planRow.remove();
                } else {
                    Utils.showNotification('Debe haber al menos un plan', 'warning');
                }
            };
        }
    }

    setupPlanButtons() {
        // Botón para agregar plan
        const addPlanBtn = document.getElementById('addPlanBtn');
        if (addPlanBtn) {
            addPlanBtn.addEventListener('click', () => this.addPlanRow());
        }

        // Botones para eliminar planes
        document.querySelectorAll('.remove-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planRow = e.target.closest('.plan-row');
                if (document.querySelectorAll('.plan-row').length > 1) {
                    planRow.remove();
                } else {
                    Utils.showNotification('Debe haber al menos un plan', 'warning');
                }
            });
        });
    }

    loadProductPlans(product) {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;
        
        plansContainer.innerHTML = '';
        
        try {
            let plans = [];
            if (typeof product.plans === 'string') {
                plans = JSON.parse(product.plans);
            } else if (Array.isArray(product.plans)) {
                plans = product.plans;
            }
                
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
            const { success, categories } = await categoryManager.loadCategories();
            
            if (!success) {
                throw new Error('Error loading categories');
            }
            
            // Save current selected option
            const currentValue = categorySelect.value;
            
            // Clear and fill select
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
            // Restore selected value if exists
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
            // Collect plan data
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
            
            // Validate form
            if (!this.validateForm(formData, plans)) {
                return;
            }
            
            // Prepare product data
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                category_id: formData.get('category'),
                photo_url: formData.get('photo_url'),
                plans: JSON.stringify(plans),
            };
            
            let result;
            if (productId) {
                // Update existing product
                result = await productManager.updateProduct(productId, productData);
                Utils.showNotification('Producto actualizado correctamente', 'success');
            } else {
                // Create new product
                result = await productManager.createProduct(productData);
                Utils.showNotification('Producto creado correctamente', 'success');
            }
            
            // Close modal
            this.modalManager.hideCurrentModal();
            
            // Reload data if in adminPage context
            if (window.adminPage && typeof window.adminPage.loadData === 'function') {
                window.adminPage.loadData(true);
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            Utils.showNotification('Error al guardar el producto: ' + error.message, 'error');
        }
    }

    validateForm(formData, plans) {
        // Validar nombre
        if (!formData.get('name') || formData.get('name').trim().length < 2) {
            Utils.showNotification('El nombre del producto debe tener al menos 2 caracteres', 'error');
            return false;
        }
        
        // Validar categoría
        if (!formData.get('category')) {
            Utils.showNotification('Debe seleccionar una categoría', 'error');
            return false;
        }
        
        // Validar descripción
        if (!formData.get('description') || formData.get('description').trim().length < 10) {
            Utils.showNotification('La descripción debe tener al menos 10 caracteres', 'error');
            return false;
        }
        
        // Validar URL de imagen
        if (!formData.get('photo_url') || !this.isValidUrl(formData.get('photo_url'))) {
            Utils.showNotification('Debe proporcionar una URL de imagen válida', 'error');
            return false;
        }
        
        // Validar planes
        if (plans.length === 0) {
            Utils.showNotification('Debe agregar al menos un plan', 'error');
            return false;
        }
        
        for (const plan of plans) {
            if (!plan.name || plan.name.trim().length === 0) {
                Utils.showNotification('Todos los planes deben tener un nombre', 'error');
                return false;
            }
            
            if (!plan.price_soles && !plan.price_dollars) {
                Utils.showNotification('Cada plan debe tener al menos un precio (S/ o $)', 'error');
                return false;
            }
        }
        
        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Categories Modal
class CategoriesModal {
    constructor(modalManager) {
        this.modalManager = modalManager;
    }

    async open() {
        if (!this.modalManager.showModal('categoriesModal')) return;
        await this.renderCategoriesList();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botón agregar categoría
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.onclick = () => this.handleAddCategory();
        }

        // Botones de editar y eliminar
        this.setupCategoryButtons();
    }

    setupCategoryButtons() {
        // Botones editar
        document.querySelectorAll('.edit-category-btn').forEach(btn => {
            btn.onclick = (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.editCategory(categoryId);
            };
        });

        // Botones eliminar
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.onclick = (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.confirmDeleteCategory(categoryId);
            };
        });
    }
    
    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    async open() {
        if (!this.modalManager.showModal('categoriesModal')) return;
        await this.renderCategoriesList();
        this.setupEventListeners();
        this.setupCategoryButtons();
    }

    async renderCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        // Cargar categorías actualizadas
        const { success, categories } = await categoryManager.loadCategories();
        
        if (!success || !categories || categories.length === 0) {
            categoriesList.innerHTML = '<p class="text-gray-500 text-center py-4">No hay categorías</p>';
            return;
        }
        
        categoriesList.innerHTML = categories.map(category => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-category-id="${category.id}">
                <div class="flex items-center">
                    <span class="w-4 h-4 rounded-full mr-3" style="background-color: ${category.color || '#3B82F6'}"></span>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-category-btn text-blue-600 hover:text-blue-800" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-category-btn text-red-600 hover:text-red-800" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners para los botones
        this.setupCategoryEventListeners();
    }

    setupCategoryEventListeners() {
        // Botones de eliminar
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const categoryId = e.currentTarget.dataset.id;
                await this.confirmDeleteCategory(categoryId);
            });
        });

        // Botones de editar
        document.querySelectorAll('.edit-category-btn').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const categoryId = e.currentTarget.dataset.id;
                await this.editCategory(categoryId);
            });
        });
    }

    async editCategory(categoryId) {
        const category = categoryManager.getCategoryById(categoryId);
        if (!category) return;

        const newName = prompt('Nuevo nombre de categoría:', category.name);
        if (!newName || newName.trim() === '') return;

        const newColor = prompt('Nuevo color (hexadecimal):', category.color || '#3B82F6');
        
        try {
            Utils.showLoading('Actualizando categoría...');
            const result = await categoryManager.updateCategory(categoryId, {
                name: newName.trim(),
                color: newColor || '#3B82F6'
            });

            if (result.success) {
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showSuccess('Categoría actualizada correctamente');
            } else {
                Utils.showError(result.error);
            }
        } catch (error) {
            console.error('Error editing category:', error);
            Utils.showError('Error al actualizar la categoría');
        } finally {
            Utils.hideLoading();
        }
    }

    async confirmDeleteCategory(categoryId) {
        const category = categoryManager.getCategoryById(categoryId);
        if (!category) return;
        
        const confirmed = await Utils.showConfirm(
            `Eliminar "${category.name}"`,
            `¿Estás seguro de que deseas eliminar esta categoría? Los productos en esta categoría no se eliminarán pero perderán su asociación de categoría.`,
            'warning'
        );
        
        if (confirmed) {
            Utils.showLoading('Eliminando categoría...');
            const result = await categoryManager.deleteCategory(categoryId);
            
            if (result.success) {
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showSuccess('Categoría eliminada correctamente');
            } else {
                Utils.showError(result.error);
            }
        }
    }

    async handleAddCategory() {
        const nameInput = document.getElementById('newCategoryName');
        const name = nameInput.value.trim();
        
        if (!name) {
            Utils.showNotification('Por favor ingrese un nombre de categoría', 'error');
            return;
        }
        
        if (name.length < 2) {
            Utils.showNotification('El nombre de la categoría debe tener al menos 2 caracteres', 'error');
            return;
        }
        
        try {
            Utils.showLoading('Creando categoría...');
            const result = await categoryManager.createCategory(name);
            
            if (result.success) {
                nameInput.value = '';
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showSuccess('Categoría creada correctamente');
            } else {
                Utils.showError(result.error);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            Utils.showError('Error al crear la categoría: ' + error.message);
        } finally {
            Utils.hideLoading();
        }
    }
}

// Create global instances
const modalManager = new ModalManager();
const productModal = new ProductModal(modalManager);
const categoriesModal = new CategoriesModal(modalManager);

// Exportar las instancias
export { modalManager, productModal, categoriesModal };
