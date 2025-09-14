// scripts/pages/admin.js
import { Utils } from './core.utils.js';
import { getCategoryManager } from './managers/category-manager.js';
import { getProductManager } from './managers/product-manager.js';
import { AuthManagerFunctions } from './coreAuth.js';
import { setupAllEventListeners } from './event-listeners.js';
import { initModals, openCategoriesModal, openStatsModal, showDeleteConfirm, openProductModal } from './components/modals.js';

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
        
        // ... resto de los filtros
        this.state.filteredProducts = filtered;
    }

    // Métodos restantes que necesitarás implementar:
    showLoadingState(show, message) {}
    setupEventListeners() {}
    handleInitializationError(error) {}
    renderCategoriesFilter() {}
    renderProductsList() {}
    renderStatsSummary() {}
    renderPaginationControls() {}
    updatePagination() {}
    handlePageChange() {}
    handleSearch() {}
    handleFilterChange() {}
    handleSortChange() {}
    handlePageSizeChange() {}
    handleRefresh() {}
    handleLogout() {}
    handleAuthenticationChange() {}
}

// Exportar la clase para su uso
export { AdminPage };
