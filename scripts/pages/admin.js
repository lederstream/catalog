// scripts/pages/admin.js
import { Utils } from '../core/utils.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { getProductManager } from '../managers/product-manager.js';
import { AuthManagerFunctions } from '../core/auth.js';
import { setupAllEventListeners } from '../event-listeners.js';
import { initModals, openCategoriesModal, openStatsModal, showDeleteConfirm, openProductModal } from '../components/modals.js';

class AdminPage {
    constructor() {
        this.handleInfo = false;
        this.currentUser = null;
        this.categoryManager = null;
        this.productManager = null;
        this.subcheckAttempts = 0;
        this.maxAuthorCheckAttempts = 8;
        this.isLoading = false;
        this.initialized = false;
        
        this.state = {
            products: [],
            categories: [],
            filteredProducts: [],
            currentFilter: {
                category: 'all',
                search: '',
                sort: 'recent',
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

    bindMethods() {
        // Bind all methods to maintain proper 'this' context
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleAuthenticationChange = this.handleAuthenticationChange.bind(this);
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.showLoadingState(true);
            // Verificar autenticación con reintentos
            await this.checkAuthenticationWithRetry(0);
            // Inicializar componentes
            await this.initializeComponents();
            // Cargar datos
            await this.loadData();
            // Configurar event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            // Mostrar mensaje de bienvenida
            Utils.showSuccess(`Bienvenido ${this.currentUser.email}`, 3000);
        } catch (error) {
            console.error("Error inicializando panel admin", error);
            this.handleInitializationError(error);
        } finally {
            this.showLoadingState(false);
        }
    }

    async checkAuthenticationWithRetry(attempt) {
        const startTime = Date.now();
        const maxWaitTime = 10000; // 10 segundos máximo
        
        while (this.subcheckAttempts < this.maxAuthorCheckAttempts) {
            try {
                if (Date.now() - startTime > maxWaitTime) {
                    throw new Error("Timeout en verificación de autenticación");
                }
                
                await this.checkAuthentication();
                return;
            } catch (error) {
                this.subcheckAttempts++;
                
                if (this.subcheckAttempts >= this.maxAuthorCheckAttempts) {
                    throw new Error("No autenticado después de múltiples intentos");
                }
                
                // Backoff exponencial con jitter
                const baseDelay = Math.pow(2, this.subcheckAttempts) * 100;
                const jitter = Math.random() * 100;
                const delay = baseDelay + jitter;
                
                console.log(`Reintentando autenticación en ${Math.round(delay)}ms (intento ${this.subcheckAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async checkAuthentication() {
        try {
            const authState = await AuthManagerFunctions.getAuthState();
            console.log("Estado de autenticación", authState);
            
            if (authState === 'AUTHENTICATED') {
                this.currentUser = await AuthManagerFunctions.getCurrentUser();
                if (this.currentUser) {
                    console.log("Usuario autenticado", this.currentUser.email);
                    return;
                }
            }
            
            if (authState === 'INITIALIZING') {
                await new Promise(resolve => setTimeout(resolve, 800));
                return this.checkAuthentication();
            }
            
            // Verificar localStorage como fallback
            const lastAuth = localStorage.getItem("lastAuth");
            if (lastAuth) {
                console.log("Sesión previa encontrada en localStorage");
                await new Promise(resolve => setTimeout(resolve, 1200));
                
                const finalCheck = await AuthManagerFunctions.isAuthenticated();
                if (finalCheck) {
                    this.currentUser = await AuthManagerFunctions.getCurrentUser();
                    console.log("Sesión restaurada después de espera");
                    return;
                }
            }
            
            throw new Error("Usuario no autenticado");
        } catch (error) {
            console.error("Error en checkAuthentication", error);
            throw new Error("Usuario no autenticado");
        }
    }

    async initializeComponents() {
        try {
            // Inicializar managers en paralelo
            [this.categoryManager, this.productManager] = await Promise.all([
                getCategoryManager(),
                getProductManager()
            ]);
            
            // Inicializar modales
            initModals();
        } catch (error) {
            console.error("Error inicializando componentes:", error);
            throw new Error("Error al inicializar componentes del sistema");
        }
    }

    async loadData() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.showLoadingState(true, 'Cargando datos...');
        
        try {
            const [products, categories] = await Promise.allSettled([
                this.productManager.loadProducts(),
                this.categoryManager.loadCategories()
            ]);
            
            // Manejar resultados de las promesas
            if (products.status === 'fulfilled') {
                this.state.products = products.value;
            } else {
                console.error('Error cargando productos:', products.reason);
                throw new Error('Error al cargar productos');
            }
            
            if (categories.status === 'fulfilled') {
                this.state.categories = categories.value;
            } else {
                console.error('Error cargando categorias:', categories.reason);
                throw new Error('Error al cargar categorias');
            }
            
            // Procesar datos
            this.calculateStats();
            this.applyFilters();
            this.updatePagination();
            
            // Renderizar interfaz
            this.renderCategoriesFilter();
            this.renderProductsList();
            this.renderStatsSummary();
            this.renderPaginationControls();
            
            Utils.showSuccess("Datos cargados correctamente", 2000);
        } catch (error) {
            console.error("Error cargando datos", error);
            Utils.showError("Error al cargar los datos", "Intentar recargar la página.");
            throw error;
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);
        }
    }

    calculateStats() {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        this.state.stats = {
            totalProducts: this.state.products.length,
            totalCategories: this.state.categories.length,
            recentProducts: this.state.products.filter(product => {
                const createdDate = new Date(product.created_at);
                return createdDate > weekAgo;
            }).length,
            activeProducts: this.state.products.filter(product => product.status !== 'inactive').length
        };
    }

    applyFilters() {
        let filtered = [...this.state.products];
        
        // Filtrar por búsqueda
        if (this.state.currentFilter.search) {
            const searchTerm = this.state.currentFilter.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtrar por categoría
        if (this.state.currentFilter.category !== 'all') {
            filtered = filtered.filter(product => 
                product.category_id == this.state.currentFilter.category
            );
        }
        
        // Filtrar por estado
        if (this.state.currentFilter.status !== 'all') {
            filtered = filtered.filter(product => 
                product.status === this.state.currentFilter.status
            );
        }
        
        // Ordenar
        switch (this.state.currentFilter.sort) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'recent':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
        }
        
        this.state.filteredProducts = filtered;
    }

    updatePagination() {
        const totalItems = this.state.filteredProducts.length;
        this.state.pagination.totalPages = Math.ceil(totalItems / this.state.pagination.itemsPerPage);
        
        // Ajustar página actual si es necesario
        if (this.state.pagination.currentPage > this.state.pagination.totalPages) {
            this.state.pagination.currentPage = 1;
        }
    }

    showLoadingState(show, message = 'Cargando...') {
        const loadingElement = document.getElementById('loadingOverlay');
        if (!loadingElement) return;
        
        if (show) {
            loadingElement.classList.remove('hidden');
            if (message) {
                const messageElement = loadingElement.querySelector('.loading-message');
                if (messageElement) {
                    messageElement.textContent = message;
                }
            }
        } else {
            loadingElement.classList.add('hidden');
        }
    }

    setupEventListeners() {
        // Configurar event listeners básicos
        document.getElementById('logoutBtn').addEventListener('click', this.handleLogout);
        document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
        document.getElementById('manageCategoriesBtn').addEventListener('click', () => openCategoriesModal());
        document.getElementById('viewStatsBtn').addEventListener('click', () => openStatsModal(this.state.stats));
        
        // Filtros
        document.getElementById('searchProducts').addEventListener('input', this.handleSearch);
        document.getElementById('filterCategory').addEventListener('change', this.handleFilterChange);
        document.getElementById('sortProducts').addEventListener('change', this.handleSortChange);
        
        // Configurar listeners adicionales
        setupAllEventListeners(this);
    }

    handleInitializationError(error) {
        console.error("Error de inicialización:", error);
        Utils.showError("Error al inicializar el panel de administración");
        
        // Redirigir al login si no está autenticado
        if (error.message.includes("no autenticado")) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }

    renderCategoriesFilter() {
        const categoryFilter = document.getElementById('filterCategory');
        if (!categoryFilter) return;
        
        categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
        
        this.state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        // Establecer valor actual si existe
        if (this.state.currentFilter.category) {
            categoryFilter.value = this.state.currentFilter.category;
        }
    }

    renderProductsList() {
        const productsList = document.getElementById('adminProductsList');
        if (!productsList) return;
        
        const startIndex = (this.state.pagination.currentPage - 1) * this.state.pagination.itemsPerPage;
        const endIndex = startIndex + this.state.pagination.itemsPerPage;
        const paginatedProducts = this.state.filteredProducts.slice(startIndex, endIndex);
        
        if (paginatedProducts.length === 0) {
            productsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-search text-3xl mb-3"></i>
                    <p>No se encontraron productos</p>
                    <p class="text-sm mt-1">Intenta con otros filtros de búsqueda</p>
                </div>
            `;
            return;
        }
        
        productsList.innerHTML = paginatedProducts.map(product => `
            <div class="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start gap-4 flex-1">
                    <img src="${product.photo_url || 'https://via.placeholder.com/80?text=Sin+imagen'}" 
                         alt="${product.name}" 
                         class="w-16 h-16 object-cover rounded-lg"
                         onerror="this.src='https://via.placeholder.com/80?text=Error+imagen'">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">${product.name}</h4>
                        <p class="text-sm text-gray-600 mt-1">${product.description || 'Sin descripción'}</p>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${this.getCategoryName(product.category_id)}</span>
                            <span class="${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} text-xs px-2 py-1 rounded">${product.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="edit-product px-3 py-2 bg-blue-500 text-white rounded-lg text-sm" data-id="${product.id}">
                        <i class="fas fa-edit mr-1"></i> Editar
                    </button>
                    <button class="delete-product px-3 py-2 bg-red-500 text-white rounded-lg text-sm" data-id="${product.id}">
                        <i class="fas fa-trash mr-1"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
        
        // Añadir event listeners a los botones
        productsList.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                const product = this.state.products.find(p => p.id == productId);
                if (product) {
                    openProductModal(product);
                }
            });
        });
        
        productsList.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                const product = this.state.products.find(p => p.id == productId);
                if (product) {
                    showDeleteConfirm(product);
                }
            });
        });
    }

    getCategoryName(categoryId) {
        const category = this.state.categories.find(c => c.id == categoryId);
        return category ? category.name : 'Sin categoría';
    }

    renderStatsSummary() {
        const statsContainer = document.getElementById('statsSummary');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <i class="fas fa-box text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Total Productos</p>
                        <h3 class="text-2xl font-bold">${this.state.stats.totalProducts}</h3>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                        <i class="fas fa-tags text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Total Categorías</p>
                        <h3 class="text-2xl font-bold">${this.state.stats.totalCategories}</h3>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <i class="fas fa-clock text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Recientes (7 días)</p>
                        <h3 class="text-2xl font-bold">${this.state.stats.recentProducts}</h3>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                        <i class="fas fa-check-circle text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Productos Activos</p>
                        <h3 class="text-2xl font-bold">${this.state.stats.activeProducts}</h3>
                    </div>
                </div>
            </div>
        `;
    }

    renderPaginationControls() {
        const paginationContainer = document.getElementById('productsPagination');
        const productsCount = document.getElementById('productsCount');
        
        if (productsCount) {
            productsCount.textContent = `${this.state.filteredProducts.length} productos`;
        }
        
        if (!paginationContainer) return;
        
        if (this.state.pagination.totalPages <= 1) {
            paginationContainer.classList.add('hidden');
            return;
        }
        
        paginationContainer.classList.remove('hidden');
        
        let paginationHTML = '';
        const currentPage = this.state.pagination.currentPage;
        const totalPages = this.state.pagination.totalPages;
        
        // Botón anterior
        paginationHTML += `
            <button class="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                    ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.adminPage.handlePageChange(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Botones de página
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button class="px-3 py-1 rounded border ${currentPage === i ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}" 
                            onclick="window.adminPage.handlePageChange(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span class="px-2">...</span>`;
            }
        }
        
        // Botón siguiente
        paginationHTML += `
            <button class="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                    ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.adminPage.handlePageChange(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
    }

    // Handlers de eventos
    handlePageChange(page) {
        this.state.pagination.currentPage = page;
        this.renderProductsList();
        this.renderPaginationControls();
    }

    handleSearch(e) {
        this.state.currentFilter.search = e.target.value;
        this.state.pagination.currentPage = 1;
        this.applyFilters();
        this.updatePagination();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    handleFilterChange(e) {
        this.state.currentFilter.category = e.target.value;
        this.state.pagination.currentPage = 1;
        this.applyFilters();
        this.updatePagination();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    handleSortChange(e) {
        this.state.currentFilter.sort = e.target.value;
        this.applyFilters();
        this.renderProductsList();
    }

    handlePageSizeChange(e) {
        this.state.pagination.itemsPerPage = parseInt(e.target.value);
        this.state.pagination.currentPage = 1;
        this.updatePagination();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    handleRefresh() {
        this.loadData();
    }

    handleLogout() {
        AuthManagerFunctions.signOut().then(() => {
            window.location.href = 'login.html';
        });
    }

    handleAuthenticationChange(event, user) {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    }
}

// Crear e inicializar la instancia global
const adminPage = new AdminPage();
window.adminPage = adminPage;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    adminPage.initialize();
});

export { AdminPage };
