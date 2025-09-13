// scripts/components/modals.js
import { Utils } from '../core/utils.js';

class ModalSystem {
    constructor() {
        this.currentModal = null;
        this.modalStack = [];
        this.modalHistory = [];
        this.isInitialized = false;
    }
    
    static getInstance() {
        if (!ModalSystem.instance) {
            ModalSystem.instance = new ModalSystem();
        }
        return ModalSystem.instance;
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🔲 Inicializando sistema de modales...');
        this.setupGlobalEventListeners();
        this.isInitialized = true;
    }
    
    setupGlobalEventListeners() {
        // Cerrar modal al hacer clic fuera del contenido
        document.addEventListener('click', (e) => {
            if (this.currentModal && e.target === this.currentModal) {
                this.closeCurrentModal();
            }
        });
        
        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeCurrentModal();
            }
        });
        
        // Prevenir scroll del body cuando hay modales abiertos
        this.setupBodyScrollControl();
    }
    
    setupBodyScrollControl() {
        const originalStyle = {
            overflow: document.body.style.overflow,
            paddingRight: document.body.style.paddingRight
        };
        
        let scrollbarWidth = 0;
        
        const lockScroll = () => {
            if (this.modalStack.length > 0) {
                scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
                document.body.style.overflow = 'hidden';
                if (scrollbarWidth > 0) {
                    document.body.style.paddingRight = `${scrollbarWidth}px`;
                }
            } else {
                document.body.style.overflow = originalStyle.overflow;
                document.body.style.paddingRight = originalStyle.paddingRight;
            }
        };
        
        this.originalLockScroll = lockScroll;
    }
    
    createModal(options = {}) {
        const {
            id = `modal-${Date.now()}`,
            title = 'Modal',
            content = '',
            size = 'md',
            type = 'default',
            onShow = () => {},
            onClose = () => {},
            onConfirm = () => {},
            onCancel = () => {},
            closeOnOutsideClick = true,
            closeOnEsc = true,
            showCloseButton = true,
            backdrop = true,
            animation = true
        } = options;
        
        // Eliminar modal existente si hay uno del mismo tipo
        if (type !== 'default') {
            const existingModal = this.modalStack.find(modal => modal.dataset.type === type);
            if (existingModal) {
                this.closeModal(existingModal.id);
            }
        }
        
        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-full mx-4',
            '90vw': 'max-w-[90vw]'
        };
        
        const modalHTML = `
            <div id="${id}" class="modal fixed inset-0 z-50 flex items-center justify-center p-4"
                 data-type="${type}" 
                 style="display: none;">
                ${backdrop ? `<div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>` : ''}
                
                <div class="modal-content bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
                    ${showCloseButton ? `
                        <div class="modal-header flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 class="text-xl font-semibold text-gray-900">${title}</h3>
                            <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="modal-header p-6 border-b border-gray-200">
                            <h3 class="text-xl font-semibold text-gray-900 text-center">${title}</h3>
                        </div>
                    `}
                    
                    <div class="modal-body p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement);
        
        const modal = modalElement.querySelector(`#${id}`);
        this.currentModal = modal;
        this.modalStack.push(modal);
        this.modalHistory.push({ id, type, timestamp: Date.now() });
        
        // Configurar eventos
        this.setupModalEvents(modal, {
            closeOnOutsideClick,
            closeOnEsc,
            onClose,
            onConfirm,
            onCancel
        });
        
        // Mostrar con animación
        if (animation) {
            setTimeout(() => {
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.querySelector('.modal-backdrop').style.opacity = '1';
                    modal.querySelector('.modal-content').style.transform = 'scale(1)';
                    modal.querySelector('.modal-content').style.opacity = '1';
                }, 10);
            }, 10);
        } else {
            modal.style.display = 'flex';
        }
        
        // Control de scroll
        this.originalLockScroll();
        
        // Ejecutar callback
        onShow(modal);
        
        return modal;
    }
    
    setupModalEvents(modal, options) {
        const closeBtn = modal.querySelector('.modal-close');
        const backdrop = modal.querySelector('.modal-backdrop');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal.id));
        }
        
        if (options.closeOnOutsideClick && backdrop) {
            backdrop.addEventListener('click', () => this.closeModal(modal.id));
        }
        
        if (options.closeOnEsc) {
            const escHandler = (e) => {
                if (e.key === 'Escape' && this.currentModal === modal) {
                    this.closeModal(modal.id);
                }
            };
            modal.dataset.escHandler = escHandler;
            document.addEventListener('keydown', escHandler);
        }
    }
    
    async closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Animación de salida
        const backdrop = modal.querySelector('.modal-backdrop');
        const content = modal.querySelector('.modal-content');
        
        if (backdrop) backdrop.style.opacity = '0';
        if (content) {
            content.style.transform = 'scale(0.95)';
            content.style.opacity = '0';
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Limpiar eventos
        const escHandler = modal.dataset.escHandler;
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
        }
        
        // Eliminar modal
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        
        // Actualizar estado
        this.modalStack = this.modalStack.filter(m => m.id !== modalId);
        if (this.modalStack.length > 0) {
            this.currentModal = this.modalStack[this.modalStack.length - 1];
        } else {
            this.currentModal = null;
        }
        
        // Control de scroll
        this.originalLockScroll();
    }
    
    closeCurrentModal() {
        if (this.currentModal) {
            this.closeModal(this.currentModal.id);
        }
    }
    
    closeAllModals() {
        this.modalStack.forEach(modal => {
            this.closeModal(modal.id);
        });
    }
    
    // Modal de producto mejorado
    openProductModal(product = null) {
        const isEdit = !!product;
        const modalId = 'productModal';
        
        const modalContent = `
            <div class="space-y-6">
                <form id="productForm" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Columna izquierda -->
                    <div class="space-y-6">
                        <!-- Información básica -->
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-4">Información Básica</h4>
                            
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                                    <input type="text" name="name" required 
                                           value="${product ? Utils.escapeHtml(product.name) : ''}"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                    <textarea name="description" rows="3"
                                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">${product ? Utils.escapeHtml(product.description) : ''}</textarea>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                                    <select name="category_id" required
                                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                        <option value="">Seleccionar categoría</option>
                                        <!-- Las categorías se llenarán con JavaScript -->
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Estado -->
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-4">Estado</h4>
                            <div class="flex items-center gap-3">
                                <label class="inline-flex items-center">
                                    <input type="radio" name="status" value="active" 
                                           ${!product || product.status === 'active' ? 'checked' : ''}
                                           class="text-blue-600 focus:ring-blue-500">
                                    <span class="ml-2">Activo</span>
                                </label>
                                <label class="inline-flex items-center">
                                    <input type="radio" name="status" value="inactive"
                                           ${product && product.status === 'inactive' ? 'checked' : ''}
                                           class="text-blue-600 focus:ring-blue-500">
                                    <span class="ml-2">Inactivo</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Columna derecha -->
                    <div class="space-y-6">
                        <!-- Imagen -->
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-4">Imagen del Producto</h4>
                            
                            <div class="space-y-4">
                                <div id="imagePreview" class="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                    ${product && product.photo_url ? `
                                        <img src="${product.photo_url}" class="w-full h-full object-cover">
                                    ` : `
                                        <div class="text-gray-400">
                                            <i class="fas fa-image text-3xl mb-2"></i>
                                            <p>Sin imagen</p>
                                        </div>
                                    `}
                                </div>
                                
                                <div class="flex gap-2">
                                    <button type="button" onclick="openImageSearchModal()"
                                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        <i class="fas fa-search mr-2"></i> Buscar Imagen
                                    </button>
                                    <button type="button" 
                                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                                        <i class="fas fa-upload mr-2"></i> Subir
                                    </button>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">URL de la imagen</label>
                                    <input type="url" name="photo_url" 
                                           value="${product ? Utils.escapeHtml(product.photo_url) : ''}"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                           placeholder="https://ejemplo.com/imagen.jpg">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Planes -->
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h4 class="font-semibold text-gray-800 mb-4">Planes de Precio</h4>
                            <div id="plansContainer" class="space-y-3">
                                <!-- Los planes se generarán con JavaScript -->
                            </div>
                            <button type="button" onclick="addPlan()"
                                    class="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-plus mr-2"></i> Agregar Plan
                            </button>
                        </div>
                    </div>
                </form>
                
                <!-- Actions -->
                <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button type="button" onclick="closeCurrentModal()"
                            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="productForm"
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        ${isEdit ? 'Actualizar' : 'Crear'} Producto
                    </button>
                </div>
            </div>
        `;
        
        this.createModal({
            id: modalId,
            title: isEdit ? 'Editar Producto' : 'Nuevo Producto',
            content: modalContent,
            size: 'xl',
            type: 'product',
            onShow: (modal) => {
                this.initializeProductForm(modal, product);
            }
        });
    }
    
    initializeProductForm(modal, product) {
        // Llenar categorías
        const categorySelect = modal.querySelector('select[name="category_id"]');
        if (window.adminPage && categorySelect) {
            window.adminPage.state.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                option.selected = product && product.category_id == category.id;
                categorySelect.appendChild(option);
            });
        }
        
        // Inicializar planes
        this.initializePlans(modal, product);
        
        // Configurar formulario
        const form = modal.querySelector('#productForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProductSubmit(form, product);
        });
    }
    
    initializePlans(modal, product) {
        const plansContainer = modal.querySelector('#plansContainer');
        if (!plansContainer) return;
        
        let plans = [];
        if (product && product.plans) {
            plans = Array.isArray(product.plans) ? product.plans : 
                   typeof product.plans === 'string' ? JSON.parse(product.plans) : [];
        }
        
        if (plans.length === 0) {
            plans = [{ name: '', price_soles: '', price_dollars: '' }];
        }
        
        plansContainer.innerHTML = plans.map((plan, index) => `
            <div class="plan-item bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium">Plan ${index + 1}</h5>
                    ${plans.length > 1 ? `
                        <button type="button" onclick="removePlan(${index})"
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="plans[${index}][name]" 
                               value="${Utils.escapeHtml(plan.name)}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio (S/.)</label>
                        <input type="number" name="plans[${index}][price_soles]" 
                               value="${plan.price_soles || ''}" step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                        <input type="number" name="plans[${index}][price_dollars]" 
                               value="${plan.price_dollars || ''}" step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async handleProductSubmit(form, product) {
        const formData = new FormData(form);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            category_id: formData.get('category_id'),
            status: formData.get('status'),
            photo_url: formData.get('photo_url')
        };
        
        // Procesar planes
        const plans = [];
        for (let i = 0; i < formData.getAll('plans[0][name]').length; i++) {
            const plan = {
                name: formData.get(`plans[${i}][name]`),
                price_soles: parseFloat(formData.get(`plans[${i}][price_soles]`)) || 0,
                price_dollars: parseFloat(formData.get(`plans[${i}][price_dollars]`)) || 0
            };
            
            if (plan.name.trim()) {
                plans.push(plan);
            }
        }
        
        productData.plans = plans;
        
        try {
            if (product) {
                // Editar producto existente
                if (typeof window.productManager?.updateProduct === 'function') {
                    await window.productManager.updateProduct(product.id, productData);
                }
            } else {
                // Crear nuevo producto
                if (typeof window.productManager?.addProduct === 'function') {
                    await window.productManager.addProduct(productData);
                }
            }
            
            this.closeCurrentModal();
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            Utils.showError('Error al guardar el producto');
        }
    }
}

// Inicializar y exportar
const modalSystem = ModalSystem.getInstance();

export function initModals() {
    modalSystem.init();
    return modalSystem;
}

export function openProductModal(product = null) {
    return modalSystem.openProductModal(product);
}

export function showDeleteConfirm(productId, productName) {
    return modalSystem.showDeleteConfirm(productId, productName);
}

export function openCategoriesModal() {
    return modalSystem.openCategoriesModal();
}

export function openImageSearchModal() {
    return modalSystem.openImageSearchModal();
}

export function openStatsModal() {
    return modalSystem.openStatsModal();
}

export function closeCurrentModal() {
    return modalSystem.closeCurrentModal();
}

export function closeAllModals() {
    return modalSystem.closeAllModals();
}

// Hacer funciones disponibles globalmente
window.openProductModal = openProductModal;
window.showDeleteConfirm = showDeleteConfirm;
window.openCategoriesModal = openCategoriesModal;
window.openImageSearchModal = openImageSearchModal;
window.openStatsModal = openStatsModal;
window.closeCurrentModal = closeCurrentModal;
window.closeAllModals = closeAllModals;
window.initModals = initModals;

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initModals();
    });
} else {
    setTimeout(initModals, 0);
}

export { ModalSystem };
