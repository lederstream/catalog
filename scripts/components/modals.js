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
        document.body.style.overflow = 'hidden';

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

        if (product) {
            title.textContent = 'Editar Producto';
            submitText.textContent = 'Actualizar Producto';
            
            document.getElementById('productId').value = product.id;
            document.getElementById('name').value = product.name || '';
            document.getElementById('category').value = product.category_id || '';
            document.getElementById('description').value = product.description || '';
            document.getElementById('photo_url').value = product.photo_url || '';
            
            if (product.photo_url) {
                this.updateImagePreview(product.photo_url);
            }
            
            this.loadProductPlans(product);
        } else {
            title.textContent = 'Agregar Nuevo Producto';
            submitText.textContent = 'Agregar Producto';
            
            const plansContainer = document.getElementById('plansContainer');
            if (plansContainer) {
                plansContainer.innerHTML = '';
                this.addPlanRow();
            }
        }
        
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
                            onclick="document.getElementById('photo_url').value = ''; this.closest('#imagePreview').innerHTML = this.getDefaultPreviewHTML();"
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
        const addPlanBtn = document.getElementById('addPlanBtn');
        if (addPlanBtn) {
            addPlanBtn.addEventListener('click', () => this.addPlanRow());
        }

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
            
            const currentValue = categorySelect.value;
            
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
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
        
        const productId = document.getElementById('productId').value;
        
        try {
            // Obtener valores directamente de los inputs
            const name = document.getElementById('name').value;
            const category = document.getElementById('category').value;
            const description = document.getElementById('description').value;
            const photo_url = document.getElementById('photo_url').value;
            
            // Collect plan data - CORREGIDO
            const plans = [];
            document.querySelectorAll('.plan-row').forEach(row => {
                const name = row.querySelector('.plan-name').value;
                const price_soles = parseFloat(row.querySelector('.plan-price-soles').value) || 0;
                const price_dollars = parseFloat(row.querySelector('.plan-price-dollars').value) || 0;
                const features = row.querySelector('.plan-features').value;
                
                if (name) {
                    // CORRECCIÓN: Asegurar que al menos un precio tenga valor
                    const hasValidPrice = price_soles > 0 || price_dollars > 0;
                    
                    if (hasValidPrice) {
                        plans.push({
                            name,
                            price_soles: price_soles > 0 ? price_soles : null,
                            price_dollars: price_dollars > 0 ? price_dollars : null,
                            features: features ? features.split(',').map(f => f.trim()) : []
                        });
                    } else {
                        Utils.showNotification(`El plan "${name}" debe tener al menos un precio válido`, 'error');
                        throw new Error('Plan sin precio válido');
                    }
                }
            });
            
            // Validar usando los valores directos
            if (!this.validateForm(name, category, description, photo_url, plans)) {
                return;
            }
            
            // Prepare product data
            const productData = {
                name: name,
                description: description,
                category_id: category,
                photo_url: photo_url,
                plans: JSON.stringify(plans),
            };
            
            console.log('Enviando datos del producto:', productData);
            
            let result;
            if (productId) {
                result = await productManager.updateProduct(productId, productData);
                Utils.showNotification('Producto actualizado correctamente', 'success');
            } else {
                result = await productManager.createProduct(productData);
                Utils.showNotification('Producto creado correctamente', 'success');
            }
            
            this.modalManager.hideCurrentModal();
            
            if (window.adminPage && typeof window.adminPage.loadData === 'function') {
                window.adminPage.loadData(true);
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            if (!error.message.includes('Plan sin precio válido')) {
                Utils.showNotification('Error al guardar el producto: ' + error.message, 'error');
            }
        }
    }
validateForm(name, category, description, photoUrl, plans) {
    // Validar nombre
    if (!name || name.trim().length < 2) {
        Utils.showNotification('El nombre del producto debe tener al menos 2 caracteres', 'error');
        return false;
    }
    
    // Validar categoría
    if (!category) {
        Utils.showNotification('Debe seleccionar una categoría', 'error');
        return false;
    }
    
    // Validar descripción
    if (!description || description.trim().length < 10) {
        Utils.showNotification('La descripción debe tener al menos 10 caracteres', 'error');
        return false;
    }
    
    // Validar URL de imagen
    if (!photoUrl || !this.isValidUrl(photoUrl)) {
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
        
        const hasValidPrice = (plan.price_soles !== null && plan.price_soles !== undefined && plan.price_soles !== '') ||
                             (plan.price_dollars !== null && plan.price_dollars !== undefined && plan.price_dollars !== '');
        
        if (!hasValidPrice) {
            Utils.showNotification(`El plan "${plan.name}" debe tener al menos un precio válido`, 'error');
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
        this.handleCategoryClick = this.handleCategoryClick.bind(this);
    }

    setupEventListeners() {
        this.removeEventListeners();
        
        // Botón agregar categoría
        this.addListener('#addCategoryBtn', 'click', () => this.handleAddCategory());

        // Botones cerrar
        const closeButtons = document.querySelectorAll('#categoriesModal .modal-close, #categoriesModal .cancel-btn');
        closeButtons.forEach(btn => {
            this.addListener(btn, 'click', () => {
                this.modalManager.hideCurrentModal();
            });
        });

        // Configurar eventos para categorías existentes
        this.setupCategoryEventListeners();
    }

    addListener(selector, event, handler) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) {
            element.addEventListener(event, handler);
            const key = `${selector}-${event}-${Date.now()}`;
            this.eventListeners.set(key, { element, event, handler });
        }
    }

    removeEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    async open() {
        try {
            // Asegurarse de que el categoryManager esté inicializado
            if (!categoryManager.isInitialized) {
                await categoryManager.initialize();
            }
            
            if (!this.modalManager.showModal('categoriesModal')) return;
            
            await this.renderCategoriesList();
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error opening categories modal:', error);
            Utils.showNotification('Error al abrir el modal de categorías', 'error');
        }
    }

    async renderCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        try {
            // Cargar categorías si no están cargadas
            if (categoryManager.categories.length === 0) {
                await categoryManager.loadCategories();
            }
            
            const categories = categoryManager.getCategories();
            
            if (!categories || categories.length === 0) {
                categoriesList.innerHTML = '<p class="text-gray-500 text-center py-4">No hay categorías</p>';
                return;
            }
            
            categoriesList.innerHTML = categories.map(category => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2" data-category-id="${category.id}">
                    <div class="flex items-center">
                        <span class="w-4 h-4 rounded-full mr-3" style="background-color: ${category.color || '#3B82F6'}"></span>
                        <span class="category-name font-medium">${category.name}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-category-btn text-blue-600 hover:text-blue-800 p-1" data-id="${category.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-category-btn text-red-600 hover:text-red-800 p-1" data-id="${category.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error rendering categories list:', error);
            categoriesList.innerHTML = '<p class="text-red-500 text-center py-4">Error al cargar categorías</p>';
        }
    }

    setupCategoryEventListeners() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;

        // Usar delegación de eventos para manejar los botones dinámicos
        categoriesList.addEventListener('click', this.handleCategoryClick);
        
        // Guardar referencia para poder removerlo después
        this.eventListeners.set('categories-list-click', {
            element: categoriesList,
            event: 'click',
            handler: this.handleCategoryClick
        });
    }

    handleCategoryClick(e) {
        const editBtn = e.target.closest('.edit-category-btn');
        const deleteBtn = e.target.closest('.delete-category-btn');
        
        if (editBtn) {
            const categoryId = editBtn.dataset.id;
            this.editCategory(categoryId);
        }
        
        if (deleteBtn) {
            const categoryId = deleteBtn.dataset.id;
            this.confirmDeleteCategory(categoryId);
        }
    }

    async editCategory(categoryId) {
        try {
            const category = categoryManager.getCategoryById(categoryId);
            if (!category) {
                Utils.showNotification('Categoría no encontrada', 'error');
                return;
            }

            // Crear modal de edición en lugar de usar prompt
            this.createEditModal(category);
            
        } catch (error) {
            console.error('Error editing category:', error);
            Utils.showNotification('Error al actualizar la categoría', 'error');
        }
    }

    createEditModal(category) {
        // Eliminar modal existente si hay uno
        if (this.editModal) {
            this.editModal.remove();
        }

        // Crear modal de edición
        this.editModal = document.createElement('div');
        this.editModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.editModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-96">
                <h3 class="text-lg font-semibold mb-4">Editar Categoría</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-700 mb-1">Nombre</label>
                        <input type="text" id="editCategoryName" value="${category.name}" 
                            class="w-full px-3 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-700 mb-1">Color</label>
                        <input type="color" id="editCategoryColor" value="${category.color || '#3B82F6'}" 
                            class="w-full h-10 p-1 border rounded-lg">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="cancel-edit px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
                    <button class="save-edit px-4 py-2 bg-blue-500 text-white rounded-lg">Guardar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.editModal);
        
        // Manejar eventos
        this.editModal.querySelector('.cancel-edit').addEventListener('click', () => {
            this.editModal.remove();
            this.editModal = null;
        });
        
        this.editModal.querySelector('.save-edit').addEventListener('click', async () => {
            await this.saveCategoryChanges(category.id);
        });
    }

    async saveCategoryChanges(categoryId) {
        const newName = this.editModal.querySelector('#editCategoryName').value.trim();
        const newColor = this.editModal.querySelector('#editCategoryColor').value;
        
        if (!newName) {
            Utils.showNotification('El nombre no puede estar vacío', 'error');
            return;
        }
        
        Utils.showLoading('Actualizando categoría...');
        const result = await categoryManager.updateCategory(categoryId, {
            name: newName,
            color: newColor
        });
        
        this.editModal.remove();
        this.editModal = null;
        
        if (result.success) {
            await this.renderCategoriesList();
            if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                window.adminPage.renderCategoryFilters();
            }
            Utils.showNotification('Categoría actualizada correctamente', 'success');
        } else {
            Utils.showNotification(result.error || 'Error al actualizar categoría', 'error');
        }
        Utils.hideLoading();
    }

    async confirmDeleteCategory(categoryId) {
        try {
            const category = categoryManager.getCategoryById(categoryId);
            if (!category) {
                Utils.showNotification('Categoría no encontrada', 'error');
                return;
            }
            
            const confirmed = await Utils.showConfirm(
                'Eliminar categoría',
                `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Los productos en esta categoría perderán su asociación.`,
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
                    Utils.showNotification('Categoría eliminada correctamente', 'success');
                } else {
                    Utils.showNotification(result.error || 'Error al eliminar categoría', 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            Utils.showNotification('Error al eliminar la categoría', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    async handleAddCategory() {
        const nameInput = document.getElementById('newCategoryName');
        const colorInput = document.getElementById('newCategoryColor'); // NUEVO: input de color
        const name = nameInput.value.trim();
        const color = colorInput ? colorInput.value : '#3B82F6'; // NUEVO: obtener color
        
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
            const result = await categoryManager.createCategory(name, color); // Pasar color
            
            if (result.success) {
                nameInput.value = '';
                if (colorInput) colorInput.value = '#3B82F6'; // Resetear color
                await this.renderCategoriesList();
                // Actualizar filtros en la página principal
                if (window.adminPage && typeof window.adminPage.renderCategoryFilters === 'function') {
                    window.adminPage.renderCategoryFilters();
                }
                Utils.showNotification('Categoría creada correctamente', 'success');
            } else {
                Utils.showNotification(result.error || 'Error al crear categoría', 'error');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            Utils.showNotification('Error al crear la categoría: ' + error.message, 'error');
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
