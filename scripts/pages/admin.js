// scripts/pages/admin.js
import { Utils } from '../core/utils.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { getProductManager } from '../managers/product-manager.js';
import { AuthManagerFunctions } from '../core/auth.js';
import { setupAllEventListeners } from '../event-listeners.js';
import { initModals, openCategoriesModal, openStatsModal, showDeleteConfirm } from '../components/modals.js';

class AdminPage {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.categoryManager = null;
        this.productManager = null;
        this.state = {
            products: [],
            categories: [],
            currentFilter: { category: '', search: '', sort: 'newest' },
            stats: {
                totalProducts: 0,
                totalCategories: 0,
                recentProducts: 0
            }
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Verificar autenticación
            await this.checkAuthentication();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Cargar datos
            await this.loadData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Panel de administración inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando panel admin:', error);
            Utils.showError('Error al inicializar el panel de administración');
            // Redirigir al login si hay error de autenticación
            if (error.message.includes('autenticación') || error.message.includes('autenticado') || error.message.includes('Usuario no autenticado')) {
                setTimeout(() => window.location.href = 'login.html', 2000);
            }
        }
    }

    async checkAuthentication() {
        // Esperar a que el AuthManager esté completamente inicializado
        this.currentUser = await AuthManagerFunctions.getCurrentUser();
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }
        
        console.log('👤 Usuario autenticado:', this.currentUser.email);
    }

    async initializeComponents() {
        // Inicializar managers
        this.categoryManager = await getCategoryManager();
        this.productManager = await getProductManager();
        
        // Inicializar modales
        initModals();
    }

    async loadData() {
        try {
            Utils.showInfo('🔄 Cargando datos...');
            
            const [products, categories] = await Promise.all([
                this.productManager.loadProducts(),
                this.categoryManager.loadCategories()
            ]);
            
            this.state.products = products;
            this.state.categories = categories;
            
            // Calcular estadísticas
            this.calculateStats();
            
            // Renderizar datos
            this.renderCategoriesFilter();
            this.renderProductsList();
            this.renderStatsSummary();
            
            Utils.showSuccess('✅ Datos cargados correctamente');
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            Utils.showError('Error al cargar los datos');
            throw error;
        }
    }

    calculateStats() {
        this.state.stats = {
            totalProducts: this.state.products.length,
            totalCategories: this.state.categories.length,
            recentProducts: this.state.products.filter(product => {
                const createdDate = new Date(product.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return createdDate > weekAgo;
            }).length
        };
    }

    renderCategoriesFilter() {
        const filterCategory = document.getElementById('filterCategory');
        if (!filterCategory) return;
        
        filterCategory.innerHTML = '<option value="">Todas las categorías</option>';
        
        this.state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterCategory.appendChild(option);
        });
    }

    renderProductsList() {
        const productsList = document.getElementById('adminProductsList');
        const productsCount = document.getElementById('productsCount');
        
        if (!productsList || !productsCount) return;
        
        // Aplicar filtros
        const filteredProducts = this.filterProducts();
        
        // Actualizar contador
        productsCount.textContent = `${filteredProducts.length} productos`;
        
        if (filteredProducts.length === 0) {
            productsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-3"></i>
                    <p>No se encontraron productos</p>
                    <p class="text-sm mt-1">Intenta con otros filtros o agrega nuevos productos</p>
                </div>
            `;
            return;
        }
        
        // Renderizar productos
        productsList.innerHTML = filteredProducts.map(product => `
            <div class="product-card bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
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
                                    ${this.getCategoryName(product.category_id)}
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
            </div>
        `).join('');
        
        // Agregar event listeners a los botones
        this.addProductCardEventListeners();
    }

    renderProductPlans(plans) {
        if (!plans || plans.length === 0) {
            return '<span class="text-gray-500 text-xs">Sin planes definidos</span>';
        }
        
        // Asegurarse de que los planes estén en el formato correcto
        let parsedPlans;
        try {
            parsedPlans = typeof plans === 'string' ? JSON.parse(plans) : plans;
            if (!Array.isArray(parsedPlans)) {
                parsedPlans = [];
            }
        } catch (error) {
            console.warn('Error parsing plans:', error);
            parsedPlans = [];
        }
        
        if (parsedPlans.length === 0) {
            return '<span class="text-gray-500 text-xs">Sin planes definidos</span>';
        }
        
        return parsedPlans.map(plan => `
            <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                ${plan.name}: ${Utils.formatCurrency(plan.price_soles || 0)}
            </span>
        `).join('');
    }

    getCategoryName(categoryId) {
        const category = this.state.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sin categoría';
    }

    formatDate(dateString) {
        if (!dateString) return 'Fecha desconocida';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.warn('Error formatting date:', error);
            return 'Fecha inválida';
        }
    }

    addProductCardEventListeners() {
        // Event listeners para editar
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                this.editProduct(productId);
            });
        });
        
        // Event listeners para eliminar
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                const productName = btn.dataset.name;
                this.deleteProduct(productId, productName);
            });
        });
    }

    filterProducts() {
        let filtered = [...this.state.products];
        
        // Filtrar por búsqueda
        const searchInput = document.getElementById('searchProducts');
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Filtrar por categoría
        const categoryFilter = document.getElementById('filterCategory');
        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(product => 
                product.category_id == categoryFilter.value
            );
        }
        
        // Ordenar
        const sortSelect = document.getElementById('sortProducts');
        if (sortSelect) {
            const sortValue = sortSelect.value;
            
            filtered.sort((a, b) => {
                switch (sortValue) {
                    case 'newest':
                        return new Date(b.created_at) - new Date(a.created_at);
                    case 'oldest':
                        return new Date(a.created_at) - new Date(b.created_at);
                    case 'name_asc':
                        return a.name.localeCompare(b.name);
                    case 'name_desc':
                        return b.name.localeCompare(a.name);
                    default:
                        return 0;
                }
            });
        }
        
        return filtered;
    }

    renderStatsSummary() {
        const statsContainer = document.getElementById('statsSummary');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <i class="fas fa-box text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Total Productos</p>
                        <p class="text-2xl font-bold">${this.state.stats.totalProducts}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <i class="fas fa-tags text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Categorías</p>
                        <p class="text-2xl font-bold">${this.state.stats.totalCategories}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                        <i class="fas fa-star text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Nuevos (7 días)</p>
                        <p class="text-2xl font-bold">${this.state.stats.recentProducts}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                        <i class="fas fa-chart-line text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Estado</p>
                        <p class="text-2xl font-bold">Activo</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Filtros y búsqueda
        const searchInput = document.getElementById('searchProducts');
        const filterCategory = document.getElementById('filterCategory');
        const sortProducts = document.getElementById('sortProducts');
        
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce(() => this.renderProductsList(), 300)
            );
        }
        
        if (filterCategory) {
            filterCategory.addEventListener('change', 
                () => this.renderProductsList()
            );
        }
        
        if (sortProducts) {
            sortProducts.addEventListener('change', 
                () => this.renderProductsList()
            );
        }
        
        // Botones principales
        const addProductBtn = document.getElementById('addProductBtn');
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
        const viewStatsBtn = document.getElementById('viewStatsBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (addProductBtn) {
            addProductBtn.addEventListener('click', 
                () => this.addProduct()
            );
        }
        
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', 
                () => this.manageCategories()
            );
        }
        
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', 
                () => this.viewStats()
            );
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', 
                () => this.logout()
            );
        }
        
        // Configurar event listeners globales
        setupAllEventListeners();
    }

    async addProduct() {
        try {
            console.log('Agregar nuevo producto');
            // Abrir modal de producto para agregar nuevo
            this.openProductModal();
        } catch (error) {
            console.error('Error al agregar producto:', error);
            Utils.showError('Error al intentar agregar producto');
        }
    }

    async editProduct(productId) {
        try {
            console.log('Editar producto:', productId);
            // Abrir modal de producto para editar
            this.openProductModal(productId);
        } catch (error) {
            console.error('Error al editar producto:', error);
            Utils.showError('Error al intentar editar producto');
        }
    }

    openProductModal(productId = null) {
        // Implementar lógica para abrir el modal de producto
        // Esto sería parte de tu sistema de modales
        console.log('Abrir modal de producto para:', productId || 'nuevo producto');
        
        // Por ahora, mostramos un mensaje
        Utils.showInfo('Funcionalidad de edición/agregar producto en desarrollo');
    }

    async deleteProduct(productId, productName) {
        try {
            // Usar el modal de confirmación para eliminar
            showDeleteConfirm(productId, productName);
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            Utils.showError('Error al intentar eliminar producto');
        }
    }

    manageCategories() {
        try {
            console.log('Gestionar categorías');
            // Abrir modal de categorías
            openCategoriesModal();
        } catch (error) {
            console.error('Error al gestionar categorías:', error);
            Utils.showError('Error al intentar gestionar categorías');
        }
    }

    viewStats() {
        try {
            console.log('Ver estadísticas');
            // Abrir modal de estadísticas
            openStatsModal();
        } catch (error) {
            console.error('Error al ver estadísticas:', error);
            Utils.showError('Error al intentar ver estadísticas');
        }
    }

    async logout() {
        try {
            await AuthManagerFunctions.signOut();
            Utils.showSuccess('Sesión cerrada correctamente');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Utils.showError('Error al cerrar sesión');
        }
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const adminPage = new AdminPage();
        await adminPage.initialize();
    } catch (error) {
        console.error('Error inicializando AdminPage:', error);
        Utils.showError('Error al cargar el panel de administración');
        setTimeout(() => window.location.href = 'login.html', 2000);
    }
});

// Hacer funciones disponibles globalmente
window.AdminPage = AdminPage;

// Funciones globales para uso en modales
window.deleteProduct = async (productId) => {
    try {
        const productManager = await getProductManager();
        const success = await productManager.deleteProduct(productId);
        if (success && window.adminPage) {
            await window.adminPage.loadData();
        }
        return success;
    } catch (error) {
        console.error('Error eliminando producto:', error);
        Utils.showError('Error al eliminar producto');
        return false;
    }
};

window.addCategory = async (categoryData) => {
    try {
        const categoryManager = await getCategoryManager();
        const newCategory = await categoryManager.addCategory(categoryData);
        if (newCategory && window.adminPage) {
            await window.adminPage.loadData();
        }
        return newCategory;
    } catch (error) {
        console.error('Error agregando categoría:', error);
        Utils.showError('Error al agregar categoría');
        return false;
    }
};

window.renderCategoriesList = (container) => {
    if (!container || !window.adminPage) return;
    
    container.innerHTML = window.adminPage.state.categories.map(category => `
        <div class="flex items-center justify-between p-3 border-b border-gray-200">
            <div>
                <span class="font-medium">${category.name}</span>
                <p class="text-sm text-gray-500">${category.description || 'Sin descripción'}</p>
            </div>
            <div class="flex space-x-2">
                <button class="edit-category p-2 text-blue-600 hover:text-blue-800" data-id="${category.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-category p-2 text-red-600 hover:text-red-800" data-id="${category.id}" data-name="${category.name}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Agregar event listeners para los botones de categoría
    container.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', () => {
            const categoryId = btn.dataset.id;
            console.log('Editar categoría:', categoryId);
        });
    });
    
    container.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', () => {
            const categoryId = btn.dataset.id;
            const categoryName = btn.dataset.name;
            console.log('Eliminar categoría:', categoryId, categoryName);
        });
    });
};

window.loadStats = () => {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent || !window.adminPage) return;
    
    statsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h4 class="text-lg font-semibold mb-4">Resumen General</h4>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span>Total de Productos:</span>
                        <span class="font-bold">${window.adminPage.state.stats.totalProducts}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Total de Categorías:</span>
                        <span class="font-bold">${window.adminPage.state.stats.totalCategories}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Productos Recientes (7 días):</span>
                        <span class="font-bold">${window.adminPage.state.stats.recentProducts}</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow">
                <h4 class="text-lg font-semibold mb-4">Distribución por Categoría</h4>
                <div class="space-y-3">
                    ${window.adminPage.state.categories.map(category => {
                        const count = window.adminPage.state.products.filter(p => p.category_id === category.id).length;
                        return `
                            <div class="flex justify-between">
                                <span>${category.name}:</span>
                                <span class="font-bold">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
};

window.updateImagePreview = (imageUrl) => {
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = `<img src="${imageUrl}" class="w-full h-full object-cover" alt="Vista previa">`;
    }
};
