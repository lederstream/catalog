// scripts/pages/admin.js
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
        this.maxAuthCheckAttempts = 8;
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

    bindMethods() {
        // Bind all methods to maintain proper 'this' context
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
    }

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
            console.error('❌ Error inicializando panel admin:', error);
            this.handleInitializationError(error);
        } finally {
            this.showLoadingState(false);
        }
    }

    async checkAuthenticationWithRetry() {
        const startTime = Date.now();
        const maxWaitTime = 10000; // 10 segundos máximo

        while (this.authCheckAttempts < this.maxAuthCheckAttempts) {
            try {
                if (Date.now() - startTime > maxWaitTime) {
                    throw new Error('Timeout en verificación de autenticación');
                }

                await this.checkAuthentication();
                return;
                
            } catch (error) {
                this.authCheckAttempts++;
                
                if (this.authCheckAttempts >= this.maxAuthCheckAttempts) {
                    throw new Error('No autenticado después de múltiples intentos');
                }
                
                // Backoff exponencial con jitter
                const baseDelay = Math.pow(2, this.authCheckAttempts) * 100;
                const jitter = Math.random() * 100;
                const delay = baseDelay + jitter;
                
                console.log(`⏳ Reintentando autenticación en ${Math.round(delay)}ms (intento ${this.authCheckAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async checkAuthentication() {
        try {
            const authState = await AuthManagerFunctions.getAuthState();
            console.log('🔍 Estado de autenticación:', authState);
            
            if (authState === 'AUTHENTICATED') {
                this.currentUser = await AuthManagerFunctions.getCurrentUser();
                if (this.currentUser) {
                    console.log('👤 Usuario autenticado:', this.currentUser.email);
                    return;
                }
            }
            
            if (authState === 'INITIALIZING') {
                await new Promise(resolve => setTimeout(resolve, 800));
                return this.checkAuthentication();
            }
            
            // Verificar localStorage como fallback
            const lastAuthEmail = localStorage.getItem('lastAuthEmail');
            if (lastAuthEmail) {
                console.log('🔍 Sesión previa encontrada en localStorage');
                await new Promise(resolve => setTimeout(resolve, 1200));
                
                const finalCheck = await AuthManagerFunctions.isAuthenticated();
                if (finalCheck) {
                    this.currentUser = await AuthManagerFunctions.getCurrentUser();
                    console.log('✅ Sesión restaurada después de espera');
                    return;
                }
            }
            
            throw new Error('Usuario no autenticado');
            
        } catch (error) {
            console.error('❌ Error en checkAuthentication:', error);
            throw new Error('Usuario no autenticado');
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
            console.error('❌ Error inicializando componentes:', error);
            throw new Error('Error al inicializar componentes del sistema');
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
                console.error('Error cargando categorías:', categories.reason);
                throw new Error('Error al cargar categorías');
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
            
            Utils.showSuccess('✅ Datos cargados correctamente', 2000);

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            Utils.showError('Error al cargar los datos. Intenta recargar la página.');
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
            activeProducts: this.state.products.filter(product => 
                product.status !== 'inactive'
            ).length
        };
    }

    applyFilters() {
        let filtered = [...this.state.products];

        // Filtrar por búsqueda
        if (this.state.currentFilter.search) {
            const searchTerm = this.state.currentFilter.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.category_name && product.category_name.toLowerCase().includes(searchTerm))
            );
        }

        // Filtrar por categoría
        if (this.state.currentFilter.category) {
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
        filtered.sort((a, b) => {
            switch (this.state.currentFilter.sort) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'price_asc':
                    return (a.min_price || 0) - (b.min_price || 0);
                case 'price_desc':
                    return (b.min_price || 0) - (a.min_price || 0);
                default:
                    return 0;
            }
        });

        this.state.filteredProducts = filtered;
    }

    updatePagination() {
        const totalItems = this.state.filteredProducts.length;
        const itemsPerPage = this.state.pagination.itemsPerPage;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        this.state.pagination = {
            ...this.state.pagination,
            totalPages,
            currentPage: Math.min(this.state.pagination.currentPage, totalPages || 1)
        };
    }

    getCurrentPageProducts() {
        const { currentPage, itemsPerPage } = this.state.pagination;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return this.state.filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }

    renderCategoriesFilter() {
        const filterCategory = document.getElementById('filterCategory');
        const filterStatus = document.getElementById('filterStatus');
        
        if (!filterCategory || !filterStatus) return;
        
        // Renderizar categorías
        filterCategory.innerHTML = `
            <option value="">Todas las categorías</option>
            ${this.state.categories.map(category => `
                <option value="${category.id}" ${this.state.currentFilter.category == category.id ? 'selected' : ''}>
                    ${category.name}
                </option>
            `).join('')}
        `;
        
        // Renderizar estados
        filterStatus.innerHTML = `
            <option value="all" ${this.state.currentFilter.status === 'all' ? 'selected' : ''}>Todos los estados</option>
            <option value="active" ${this.state.currentFilter.status === 'active' ? 'selected' : ''}>Activos</option>
            <option value="inactive" ${this.state.currentFilter.status === 'inactive' ? 'selected' : ''}>Inactivos</option>
        `;
    }

    renderProductsList() {
        const productsList = document.getElementById('adminProductsList');
        const productsCount = document.getElementById('productsCount');
        const emptyState = document.getElementById('emptyState');
        
        if (!productsList || !productsCount || !emptyState) return;
        
        const currentProducts = this.getCurrentPageProducts();
        const totalProducts = this.state.filteredProducts.length;
        
        // Actualizar contador
        productsCount.textContent = `${totalProducts} producto${totalProducts !== 1 ? 's' : ''}`;
        
        // Mostrar/ocultar estado vacío
        if (totalProducts === 0) {
            productsList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            
            const searchTerm = this.state.currentFilter.search;
            const categoryFilter = this.state.currentFilter.category;
            
            let message = 'No hay productos disponibles';
            let submessage = 'Agrega nuevos productos para comenzar';
            
            if (searchTerm || categoryFilter) {
                message = 'No se encontraron productos';
                submessage = 'Intenta con otros filtros de búsqueda';
            }
            
            emptyState.innerHTML = `
                <div class="text-center py-12">
                    <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-search text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">${message}</h3>
                    <p class="text-gray-500">${submessage}</p>
                    ${searchTerm || categoryFilter ? `
                        <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                onclick="window.adminPage.clearFilters()">
                            Limpiar filtros
                        </button>
                    ` : ''}
                </div>
            `;
            
            return;
        }
        
        productsList.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        // Renderizar productos
        productsList.innerHTML = currentProducts.map(product => this.renderProductCard(product)).join('');
        
        // Agregar event listeners
        this.addProductCardEventListeners();
    }

    renderProductCard(product) {
        const statusClass = product.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800';
        const statusText = product.status === 'inactive' ? 'Inactivo' : 'Activo';
        
        return `
            <div class="product-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group">
                <div class="flex flex-col lg:flex-row">
                    <!-- Imagen -->
                    <div class="lg:w-1/4 h-48 lg:h-auto bg-gray-100 overflow-hidden relative">
                        <img src="${getSafeImageUrl(product.photo_url)}"
                             alt="${product.name}" 
                             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                             loading="lazy"
                             onerror="window.handleImageError(this)">
                        <span class="absolute top-3 left-3 ${statusClass} text-xs font-medium px-2 py-1 rounded-full">
                            ${statusText}
                        </span>
                    </div>
                    
                    <!-- Contenido -->
                    <div class="flex-1 p-4 lg:p-6">
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                            <div class="flex-1">
                                <h3 class="text-xl font-semibold text-gray-900 mb-1 line-clamp-2">${Utils.escapeHtml(product.name)}</h3>
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                        ${this.getCategoryName(product.category_id)}
                                    </span>
                                    <span class="text-sm text-gray-500">
                                        ID: ${product.id}
                                    </span>
                                </div>
                            </div>
                            <div class="text-lg font-semibold text-gray-900">
                                ${product.formatted_min_price}
                            </div>
                        </div>
                        
                        <p class="text-gray-600 mb-4 line-clamp-2 text-sm">
                            ${Utils.escapeHtml(product.description || 'Sin descripción')}
                        </p>
                        
                        ${this.renderProductPlansSection(product.plans)}
                        
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-100">
                            <div class="text-xs text-gray-500 flex items-center">
                                <i class="fas fa-calendar-alt mr-1"></i>
                                Creado: ${this.formatDate(product.created_at)}
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <button class="edit-product px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 min-w-[80px] justify-center" 
                                        data-id="${product.id}">
                                    <i class="fas fa-edit text-xs"></i> Editar
                                </button>
                                <button class="delete-product px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 min-w-[80px] justify-center" 
                                        data-id="${product.id}" data-name="${Utils.escapeHtml(product.name)}">
                                    <i class="fas fa-trash text-xs"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductPlansSection(plans) {
        const parsedPlans = this.parsePlans(plans);
        if (parsedPlans.length === 0) {
            return '';
        }

        return `
            <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <i class="fas fa-tags mr-2 text-gray-400"></i>
                    Planes disponibles
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    ${parsedPlans.map(plan => `
                        <div class="bg-gray-50 rounded-lg p-2 text-xs">
                            <div class="font-medium text-gray-800">${Utils.escapeHtml(plan.name)}</div>
                            <div class="text-green-600 font-semibold">
                                ${Utils.formatCurrency(plan.price_soles || 0)}
                            </div>
                            ${plan.price_dollars ? `
                                <div class="text-blue-600">
                                    ${Utils.formatCurrency(plan.price_dollars, 'USD')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderStatsSummary() {
        const statsContainer = document.getElementById('statsSummary');
        if (!statsContainer) return;
        
        const stats = this.state.stats;
        
        statsContainer.innerHTML = `
            <div class="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Total Productos -->
                <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                            <i class="fas fa-box text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-blue-700">Total Productos</p>
                            <p class="text-2xl font-bold text-blue-900">${stats.totalProducts}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Categorías -->
                <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                            <i class="fas fa-tags text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-green-700">Categorías</p>
                            <p class="text-2xl font-bold text-green-900">${stats.totalCategories}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Nuevos (7 días) -->
                <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                            <i class="fas fa-star text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-purple-700">Nuevos (7 días)</p>
                            <p class="text-2xl font-bold text-purple-900">${stats.recentProducts}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Activos -->
                <div class="stat-card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                            <i class="fas fa-check-circle text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-orange-700">Productos Activos</p>
                            <p class="text-2xl font-bold text-orange-900">${stats.activeProducts}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPaginationControls() {
        const paginationContainer = document.getElementById('paginationControls');
        if (!paginationContainer) return;
        
        const { currentPage, totalPages } = this.state.pagination;
        
        if (totalPages <= 1) {
            paginationContainer.classList.add('hidden');
            return;
        }
        
        paginationContainer.classList.remove('hidden');
        
        paginationContainer.innerHTML = `
            <div class="flex items-center justify-between gap-4 flex-wrap">
                <div class="text-sm text-gray-600">
                    Mostrando página ${currentPage} de ${totalPages}
                </div>
                
                <div class="flex items-center gap-1">
                    <!-- Botón Anterior -->
                    <button class="pagination-btn px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            onclick="window.adminPage.goToPage(${currentPage - 1})"
                            ${currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>
                    
                    <!-- Números de página -->
                    ${this.generatePageNumbers().map(page => `
                        <button class="pagination-btn px-3 py-2 rounded-lg border transition-colors min-w-[40px]
                                    ${page === currentPage ? 
                                        'bg-blue-600 text-white border-blue-600' : 
                                        'border-gray-300 hover:bg-gray-50 text-gray-700'}"
                                onclick="window.adminPage.goToPage(${page})">
                            ${page}
                        </button>
                    `).join('')}
                    
                    <!-- Botón Siguiente -->
                    <button class="pagination-btn px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            onclick="window.adminPage.goToPage(${currentPage + 1})"
                            ${currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
                
                <div class="flex items-center gap-2 text-sm">
                    <span>Productos por página:</span>
                    <select class="px-2 py-1 border border-gray-300 rounded text-sm"
                            onchange="window.adminPage.changeItemsPerPage(parseInt(this.value))">
                        <option value="5" ${this.state.pagination.itemsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${this.state.pagination.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="20" ${this.state.pagination.itemsPerPage === 20 ? 'selected' : ''}>20</option>
                        <option value="50" ${this.state.pagination.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                    </select>
                </div>
            </div>
        `;
    }

    generatePageNumbers() {
        const { currentPage, totalPages } = this.state.pagination;
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return pages;
    }

    setupEventListeners() {
        // Búsqueda con debounce mejorado
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(this.handleSearch, 400));
            searchInput.value = this.state.currentFilter.search;
        }
        
        // Filtros
        const filterCategory = document.getElementById('filterCategory');
        const filterStatus = document.getElementById('filterStatus');
        const sortProducts = document.getElementById('sortProducts');
        
        if (filterCategory) {
            filterCategory.addEventListener('change', this.handleFilterChange);
            filterCategory.value = this.state.currentFilter.category;
        }
        
        if (filterStatus) {
            filterStatus.addEventListener('change', this.handleFilterChange);
            filterStatus.value = this.state.currentFilter.status;
        }
        
        if (sortProducts) {
            sortProducts.addEventListener('change', this.handleSortChange);
            sortProducts.value = this.state.currentFilter.sort;
        }
        
        // Botones principales
        this.setupActionButtons();
        
        // Event listeners globales
        setupAllEventListeners();
        
        // Listener para cambios de autenticación
        AuthManagerFunctions.addAuthStateListener(this.handleAuthStateChange);
        
        // Event listeners para ventana
        window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
    }

    setupActionButtons() {
        const actions = {
            'addProductBtn': () => openProductModal(),
            'manageCategoriesBtn': () => openCategoriesModal(),
            'viewStatsBtn': () => openStatsModal(),
            'refreshBtn': () => this.handleRefresh(),
            'logoutBtn': () => this.handleLogout(),
            'exportBtn': () => this.exportData()
        };
        
        Object.entries(actions).forEach(([id, action]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', action);
            }
        });
    }

    handleSearch(event) {
        this.state.currentFilter.search = event.target.value.trim();
        this.state.pagination.currentPage = 1;
        this.applyFilters();
        this.updatePagination();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.state.currentFilter[name.replace('filter', '').toLowerCase()] = value;
        this.state.pagination.currentPage = 1;
        this.applyFilters();
        this.updatePagination();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    handleSortChange(event) {
        this.state.currentFilter.sort = event.target.value;
        this.applyFilters();
        this.renderProductsList();
    }

    handlePageChange(page) {
        this.goToPage(page);
    }

    handleRefresh() {
        this.loadData();
    }

    async handleLogout() {
        try {
            await AuthManagerFunctions.signOut();
            Utils.showSuccess('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Utils.showError('Error al cerrar sesión');
        }
    }

    handleAuthStateChange(event, data) {
        console.log('🔍 AdminPage detectó cambio de auth:', event);
        
        if (event === 'SIGNED_OUT') {
            Utils.showInfo('Sesión cerrada. Redirigiendo...');
            setTimeout(() => window.location.href = 'login.html', 1500);
        }
    }

    handleResize() {
        // Re-renderizar si es necesario para responsive
        this.renderProductsList();
    }

    handleInitializationError(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('autenticación') || 
            errorMessage.includes('autenticado') || 
            errorMessage.includes('no autenticado')) {
            
            Utils.showError('Sesión expirada o no autenticado. Redirigiendo al login...');
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            Utils.showError('Error al inicializar el panel de administración');
            
            // Mostrar botón de reintento
            const errorContainer = document.getElementById('errorContainer');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="text-center py-8">
                        <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Error de inicialización</h3>
                        <p class="text-gray-500 mb-4">${error.message}</p>
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                onclick="window.adminPage.initialize()">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
    }

    showLoadingState(show, message = 'Cargando...') {
        const loader = document.getElementById('loadingIndicator');
        const content = document.getElementById('adminContent');
        
        if (loader) {
            if (show) {
                loader.innerHTML = `
                    <div class="text-center py-12">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        <p class="mt-4 text-gray-600">${message}</p>
                    </div>
                `;
                loader.classList.remove('hidden');
            } else {
                loader.classList.add('hidden');
            }
        }
        
        if (content) {
            content.style.opacity = show ? '0.5' : '1';
            content.style.pointerEvents = show ? 'none' : 'auto';
        }
    }

    // Métodos públicos para uso global
    goToPage(page) {
        if (page < 1 || page > this.state.pagination.totalPages) return;
        
        this.state.pagination.currentPage = page;
        this.renderProductsList();
        this.renderPaginationControls();
        
        // Scroll suave hacia arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    changeItemsPerPage(itemsPerPage) {
        this.state.pagination.itemsPerPage = itemsPerPage;
        this.state.pagination.currentPage = 1;
        this.updatePagination();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    clearFilters() {
        this.state.currentFilter = {
            category: '',
            search: '',
            sort: 'newest',
            status: 'all'
        };
        
        const searchInput = document.getElementById('searchProducts');
        const filterCategory = document.getElementById('filterCategory');
        const filterStatus = document.getElementById('filterStatus');
        
        if (searchInput) searchInput.value = '';
        if (filterCategory) filterCategory.value = '';
        if (filterStatus) filterStatus.value = 'all';
        
        this.applyFilters();
        this.updatePagination();
        this.renderCategoriesFilter();
        this.renderProductsList();
        this.renderPaginationControls();
    }

    exportData() {
        Utils.showInfo('📊 Función de exportación en desarrollo');
        // Implementar exportación a CSV/Excel
    }

    // Helper methods
    getCategoryName(categoryId) {
        const category = this.state.categories.find(cat => cat.id === categoryId);
        return category ? Utils.escapeHtml(category.name) : 'Sin categoría';
    }

    formatDate(dateString) {
        return Utils.formatDate(dateString);
    }

    parsePlans(plans) {
        if (!plans) return [];
        
        try {
            if (Array.isArray(plans)) return plans;
            if (typeof plans === 'string') {
                return JSON.parse(plans);
            }
            if (typeof plans === 'object') return [plans];
            return [];
        } catch (error) {
            console.warn('Error parseando planes:', error);
            return [];
        }
    }

    addProductCardEventListeners() {
        // Event listeners para editar
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.id;
                this.editProduct(productId);
            });
        });
        
        // Event listeners para eliminar
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.id;
                const productName = btn.dataset.name;
                this.deleteProduct(productId, productName);
            });
        });
        
        // Click en tarjeta (para futuras funcionalidades)
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    // Implementar vista rápida o detalles
                }
            });
        });
    }

    async editProduct(productId) {
        try {
            const product = this.state.products.find(p => p.id === productId);
            if (product) {
                openProductModal(product);
            }
        } catch (error) {
            console.error('Error al editar producto:', error);
            Utils.showError('Error al intentar editar producto');
        }
    }

    async deleteProduct(productId, productName) {
        showDeleteConfirm(productId, productName);
    }
}

function getSafeImageUrl(photoUrl) {
    const placeholder = 'https://via.placeholder.com/300x200.png?text=Sin+imagen';
    
    if (!photoUrl || photoUrl.includes('%7B') || photoUrl.includes('%7D')) {
        return placeholder;
    }
    
    try {
        new URL(photoUrl);
        return photoUrl;
    } catch (error) {
        return placeholder;
    }
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
        console.error('❌ Error crítico inicializando AdminPage:', error);
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
