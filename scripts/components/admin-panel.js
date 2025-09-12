// scripts/components/admin-panel.js
import { renderCategoriesList, openCategoryModal } from '../managers/category-manager.js';
import { showConfirmationModal } from '../components/modals.js';
import { Utils } from '../core/utils.js';
import { getProductManager } from '../managers/product-manager.js';

export class AdminPanel {
    constructor() {
        this.isInitialized = false;
        this.eventListeners = new Map();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('🔄 Inicializando panel de administración...');
            
            await this.setupEventListeners();
            await this.setupProductModal();
            await this.loadAdminProducts();
            await this.setupProductFilters();
            await this.loadStatsSummary();
            
            this.isInitialized = true;
            console.log('✅ Panel de administración inicializado');
            
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            Utils.showError('Error al inicializar el panel de administración');
        }
    }
    
    async setupEventListeners() {
        this.removeEventListeners(); // Limpiar listeners previos
        
        // Botones principales
        this.addEventListener('addProductBtn', 'click', () => this.openProductModal());
        this.addEventListener('manageCategoriesBtn', 'click', openCategoryModal);
        this.addEventListener('viewStatsBtn', 'click', () => this.openStatsModal());
        this.addEventListener('logoutBtn', 'click', () => this.handleLogout());
        
        // Event listeners para modales
        this.setupModalEventListeners();
    }
    
    addEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            const wrappedHandler = handler.bind(this);
            element.addEventListener(event, wrappedHandler);
            
            // Guardar referencia para poder removerlo luego
            if (!this.eventListeners.has(elementId)) {
                this.eventListeners.set(elementId, new Map());
            }
            this.eventListeners.get(elementId).set(event, wrappedHandler);
        }
    }
    
    removeEventListeners() {
        for (const [elementId, events] of this.eventListeners) {
            const element = document.getElementById(elementId);
            if (element) {
                for (const [event, handler] of events) {
                    element.removeEventListener(event, handler);
                }
            }
        }
        this.eventListeners.clear();
    }
    
    setupModalEventListeners() {
        // Cerrar modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                this.closeModal(e.target.closest('.modal-container') || e.target.closest('[id$="Modal"]'));
            }
        });
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-container:not(.hidden), [id$="Modal"]:not(.hidden)');
                if (openModal) this.closeModal(openModal);
            }
        });
    }
    
    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Enfocar el primer campo si es un formulario
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    openProductModal(product = null) {
        if (product) {
            this.prepareEditForm(product);
            document.getElementById('productModalTitle').textContent = 'Editar Producto';
            document.getElementById('submitProductText').textContent = 'Actualizar Producto';
        } else {
            this.resetForm();
            document.getElementById('productModalTitle').textContent = 'Agregar Nuevo Producto';
            document.getElementById('submitProductText').textContent = 'Agregar Producto';
        }
        this.openModal('productModal');
    }
    
    async loadAdminProducts() {
        try {
            const manager = await getProductManager();
            await manager.loadProducts();
            const adminProductsList = document.getElementById('adminProductsList');
            
            if (adminProductsList) {
                const products = manager.getProducts();
                this.updateProductsCount(products.length);
                
                if (products.length > 0) {
                    this.renderAdminProductsList(products, adminProductsList);
                } else {
                    adminProductsList.innerHTML = this.getEmptyProductsHTML();
                }
            }
        } catch (error) {
            console.error('Error loading admin products:', error);
            Utils.showError('❌ Error al cargar productos');
        }
    }
    
    renderAdminProductsList(products, container) {
        if (!products || products.length === 0) {
            container.innerHTML = this.getEmptyProductsHTML();
            return;
        }
        
        container.innerHTML = products.map((product, index) => `
            <div class="product-card bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                 data-product-id="${product.id}"
                 style="animation-delay: ${index * 50}ms">
                ${this.renderProductCardContent(product)}
            </div>
        `).join('');
        
        this.addProductCardEventListeners(container);
    }
    
    renderProductCardContent(product) {
        return `
            <div class="flex flex-col md:flex-row">
                <div class="md:w-1/4 h-48 md:h-auto bg-gray-100 overflow-hidden">
                    <img src="${product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                </div>
                
                <div class="flex-1 p-4 md:p-6">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800 mb-1">${Utils.truncateText(product.name, 60)}</h3>
                            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                ${this.getCategoryName(product)}
                            </span>
                        </div>
                        <div class="text-sm text-gray-500">
                            ID: ${product.id}
                        </div>
                    </div>
                    
                    <p class="text-gray-600 mb-4 line-clamp-2">
                        ${Utils.truncateText(product.description || 'Sin descripción', 120)}
                    </p>
                    
                    <div class="mb-4">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">Planes disponibles:</h4>
                        <div class="flex flex-wrap gap-2">
                            ${this.renderProductPlans(product.plans)}
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-500">
                            Creado: ${this.formatDate(product.created_at)}
                        </span>
                        <div class="flex space-x-2">
                            <button class="edit-product px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center" 
                                    data-id="${product.id}">
                                <i class="fas fa-edit mr-1"></i> Editar
                            </button>
                            <button class="delete-product px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center" 
                                    data-id="${product.id}" data-name="${product.name}">
                                <i class="fas fa-trash mr-1"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ... (otros métodos se mantienen similares pero con mejor organización)
    
    async handleProductSubmit(e) {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const formData = this.getFormData();
        
        const validationErrors = this.validateProductForm(formData);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => Utils.showError(`❌ ${error}`));
            this.highlightErrorFields(validationErrors);
            return;
        }
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            this.setButtonLoading(submitBtn, 'Procesando...');
            
            const manager = await getProductManager();
            const result = productId ? 
                await manager.updateProduct(productId, formData) : 
                await manager.addProduct(formData);
            
            if (result) {
                await this.handleSuccess(submitBtn, originalText, productId);
                this.closeModal(document.getElementById('productModal'));
                await this.loadAdminProducts();
            }
        } catch (error) {
            this.handleError(error, e.target);
        }
    }
    
    setButtonLoading(button, text) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.disabled = true;
        button.classList.add('opacity-75');
    }
    
    resetButton(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
        button.classList.remove('opacity-75');
    }
    
    async handleSuccess(button, originalText, productId) {
        button.innerHTML = '<i class="fas fa-check"></i> ¡Éxito!';
        button.classList.remove('bg-blue-600');
        button.classList.add('bg-green-600');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Utils.showSuccess(productId ? '✅ Producto actualizado' : '✅ Producto agregado');
        this.resetForm();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        this.resetButton(button, originalText);
    }
    
    handleError(error, form) {
        console.error('Error al procesar el producto:', error);
        Utils.showError(`❌ Error: ${error.message}`);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const productId = document.getElementById('productId').value;
        this.resetButton(submitBtn, productId ? 'Actualizar Producto' : 'Agregar Producto');
    }
    
    cleanup() {
        this.removeEventListeners();
    }
}

// Inicialización global
let adminPanelInstance = null;

export function initAdminPanel() {
    if (!adminPanelInstance) {
        adminPanelInstance = new AdminPanel();
    }
    return adminPanelInstance.init();
}

// Hacer funciones disponibles globalmente
window.initAdminPanel = initAdminPanel;
