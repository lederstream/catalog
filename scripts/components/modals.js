// scripts/components/modals.js
import { Utils } from '../core/utils.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { getProductManager } from '../managers/product-manager.js';
import { AuthManagerFunctions } from '../core/auth.js';
import { setupAllEventListeners } from '../event-listeners.js';
import { 
    initModals, 
    openCategoriesModal, 
    openStatsModal, 
    showDeleteConfirm,
    openProductModal 
} from '../components/modals.js';

class AdminPage {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.categoryManager = null;
        this.productManager = null;
        this.authCheckAttempts = 0;
        this.maxAuthCheckAttempts = 5;
        this.isLoading = false;
        
        this.state = {
            products: [],
            categories: [],
            filteredProducts: [],
            currentFilter: { 
                category: '', 
                search: '', 
                sort: 'newest',
                status: 'all'
            },
            stats: {
                totalProducts: 0,
                totalCategories: 0,
                recentProducts: 0,
                activeProducts: 0
            },
            pagination: {
                currentPage: 1,
                itemsPerPage: 10,
                totalPages: 1
            }
        };

        this.bindMethods();
    }

    // ... (resto de métodos optimizados)

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.showLoadingState(true);
            
            // Verificar autenticación con retries mejorados
            await this.checkAuthenticationWithRetry();
            
            // Inicializar componentes en paralelo
            await this.initializeComponents();
            
            // Cargar datos con manejo de errores
            await this.loadData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            // Mostrar mensaje de bienvenida
            Utils.showSuccess(`Bienvenido ${this.currentUser.email}`, 3000);
            
        } catch (error) {
            console.error('Error inicializando panel admin:', error);
            this.handleInitializationError(error);
        } finally {
            this.showLoadingState(false);
        }
    }

    // ... (resto de métodos optimizados)
}

// Inicialización mejorada
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Mostrar loader inmediatamente
        const loader = document.getElementById('loadingIndicator');
        const content = document.getElementById('adminContent');
        
        if (loader) loader.classList.remove('hidden');
        if (content) {
            content.style.opacity = '0.5';
            content.style.pointerEvents = 'none';
        }
        
        // Crear instancia y hacer global
        const adminPage = new AdminPage();
        window.adminPage = adminPage;
        
        // Inicializar con timeout para evitar bloqueo
        setTimeout(async () => {
            try {
                await adminPage.initialize();
            } catch (error) {
                console.error('Error en inicialización:', error);
            }
        }, 100);
        
    } catch (error) {
        console.error('Error crítico inicializando AdminPage:', error);
        Utils.showError('Error crítico al cargar el panel');
        
        // Mostrar interfaz de error
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-50">
                    <div class="text-center">
                        <h1 class="text-2xl font-bold text-gray-900 mb-4">Error de aplicación</h1>
                        <p class="text-gray-600 mb-4">Por favor recarga la página o contacta al soporte.</p>
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                onclick="window.location.reload()">
                            Recargar Página
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

// Exportar para módulos
export { AdminPage };
javascript
// scripts/components/modals.js - Versión optimizada y funcional
import { Utils } from '../core/utils.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { getProductManager } from '../managers/product-manager.js';

class ModalSystem {
    constructor() {
        this.currentModal = null;
        this.modalStack = [];
        this.isInitialized = false;
        this.categoryManager = null;
        this.productManager = null;
    }
    
    static getInstance() {
        if (!ModalSystem.instance) {
            ModalSystem.instance = new ModalSystem();
        }
        return ModalSystem.instance;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        this.setupGlobalEventListeners();
        
        // Inicializar managers
        [this.categoryManager, this.productManager] = await Promise.all([
            getCategoryManager(),
            getProductManager()
        ]);
        
        this.isInitialized = true;
    }
    
    // ... (métodos de configuración de modales)

    // Modal de producto mejorado y funcional
    async openProductModal(product = null) {
        const isEdit = !!product;
        const modalId = 'productModal';
        
        // Cargar categorías
        const categories = await this.categoryManager.loadCategories();
        
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
                                        ${categories.map(category => `
                                            <option value="${category.id}" ${product && product.category_id == category.id ? 'selected' : ''}>
                                                ${Utils.escapeHtml(category.name)}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
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
                                ${this.renderPlans(product ? product.plans : null)}
                            </div>
                            <button type="button" onclick="modalSystem.addPlan()"
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
                    <button type="button" onclick="modalSystem.handleProductSubmit(${product ? product.id : null})"
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
            type: 'product'
        });
    }
    
    renderPlans(plansData) {
        let plans = [];
        if (plansData) {
            plans = Array.isArray(plansData) ? plansData : 
                   typeof plansData === 'string' ? JSON.parse(plansData) : [];
        }
        
        if (plans.length === 0) {
            plans = [{ name: '', price_soles: '', price_dollars: '' }];
        }
        
        return plans.map((plan, index) => `
            <div class="plan-item bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium">Plan ${index + 1}</h5>
                    ${plans.length > 1 ? `
                        <button type="button" onclick="modalSystem.removePlan(${index})"
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
    
    addPlan() {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;
        
        const planCount = plansContainer.querySelectorAll('.plan-item').length;
        const newPlanHtml = `
            <div class="plan-item bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium">Plan ${planCount + 1}</h5>
                    <button type="button" onclick="modalSystem.removePlan(${planCount})"
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" name="plans[${planCount}][name]" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio (S/.)</label>
                        <input type="number" name="plans[${planCount}][price_soles]" 
                               step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                        <input type="number" name="plans[${planCount}][price_dollars]" 
                               step="0.01" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>
        `;
        
        plansContainer.insertAdjacentHTML('beforeend', newPlanHtml);
    }
    
    removePlan(index) {
        const planItem = document.querySelectorAll('.plan-item')[index];
        if (planItem) {
            planItem.remove();
            
            // Renumerar los planes restantes
            const remainingPlans = document.querySelectorAll('.plan-item');
            remainingPlans.forEach((plan, newIndex) => {
                const title = plan.querySelector('h5');
                if (title) title.textContent = `Plan ${newIndex + 1}`;
                
                // Actualizar los nombres de los inputs
                const inputs = plan.querySelectorAll('input');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) {
                        input.setAttribute('name', name.replace(/\[\d+\]/, `[${newIndex}]`));
                    }
                });
                
                // Actualizar el evento onclick del botón de eliminar
                const deleteBtn = plan.querySelector('button');
                if (deleteBtn) {
                    deleteBtn.setAttribute('onclick', `modalSystem.removePlan(${newIndex})`);
                }
            });
        }
    }
    
    async handleProductSubmit(productId = null) {
        const form = document.getElementById('productForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            category_id: formData.get('category_id'),
            photo_url: formData.get('photo_url') || 'https://via.placeholder.com/300x200?text=Sin+imagen'
        };
        
        // Procesar planes
        const plans = [];
        const planInputs = form.querySelectorAll('input[name^="plans["]');
        const planCount = planInputs.length / 3; // 3 campos por plan
        
        for (let i = 0; i < planCount; i++) {
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
            if (productId) {
                // Editar producto existente
                await this.productManager.updateProduct(productId, productData);
                Utils.showSuccess('Producto actualizado correctamente');
            } else {
                // Crear nuevo producto
                await this.productManager.addProduct(productData);
                Utils.showSuccess('Producto creado correctamente');
            }
            
            this.closeCurrentModal();
            
            // Recargar datos en el admin page si existe
            if (window.adminPage && typeof window.adminPage.loadData === 'function') {
                await window.adminPage.loadData();
            }
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            Utils.showError('Error al guardar el producto: ' + error.message);
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
window.openProductModal = (product = null) => modalSystem.openProductModal(product);
window.showDeleteConfirm = (productId, productName) => modalSystem.showDeleteConfirm(productId, productName);
window.openCategoriesModal = () => modalSystem.openCategoriesModal();
window.openStatsModal = () => modalSystem.openStatsModal();
window.closeCurrentModal = () => modalSystem.closeCurrentModal();
window.closeAllModals = () => modalSystem.closeAllModals();
window.initModals = () => modalSystem.init();

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        modalSystem.init();
    });

} else {
    setTimeout(initModals, 0);
}

export { ModalSystem, initModals, openProductModal, showDeleteConfirm, openCategoriesModal, openStatsModal, closeCurrentModal, closeAllModals };
