// scripts/core/app.js
import { Utils } from './utils.js';
import { getCategoryManager } from '../categories.js';
import { getProductManager } from '../products.js';
import { initModals } from '../modals.js';
import { initializeAuth } from '../auth.js';
import { initAdminPanel } from '../components/admin-panel.js';
import { initCatalogGrid } from '../components/catalog-grid.js';
import { renderHeader } from '../components/header.js';

class DigitalCatalogApp {
    constructor() {
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.currentUser = null;
        this.state = {
            products: [],
            categories: [],
            currentFilter: { category: 'all', search: '' },
            lastUpdate: null
        };
        
        // Bind methods for event listeners
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.adjustUIForScreenSize = this.adjustUIForScreenSize.bind(this);
    }
    
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ La aplicación ya está inicializada');
            return;
        }
        
        try {
            this.showLoadingState();
            Utils.clearAllNotifications();
            
            // Configurar modo debug
            if (window.location.search.includes('debug=true')) {
                localStorage.setItem('debug', 'true');
                Utils.debugMode = true;
            }
            
            await this.initializeCoreComponents();
            await this.loadInitialData();
            await this.initializeUIComponents();
            this.setupConnectionMonitoring();
            
            await this.hideLoadingState();
            this.isInitialized = true;
            
            console.log('🚀 Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            await this.hideLoadingState();
            Utils.showError('Error al inicializar la aplicación. Por favor, recarga la página.');
        }
    }
    
    showLoadingState() {
        if (document.querySelector('.app-loading-state')) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 app-loading-state';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-gray-600 font-medium">Cargando DigitalCatalog</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        document.body.style.overflow = 'hidden';
    }
    
    async hideLoadingState() {
        const loader = document.querySelector('.app-loading-state');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.3s ease';
            await new Promise(resolve => setTimeout(resolve, 300));
            loader.remove();
        }
        document.body.style.overflow = '';
    }
    
    async initializeCoreComponents() {
        try {
            await Promise.allSettled([
                getCategoryManager(),
                getProductManager(),
                initModals(),
                initializeAuth()
            ]);
        } catch (error) {
            console.error('Error inicializando componentes core:', error);
            throw error;
        }
    }
    
    async loadInitialData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 Modo offline - Usando datos locales');
            this.restoreState();
            return;
        }
        
        try {
            const [categories, products] = await Promise.all([
                this.loadCategories(),
                this.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            this.state.lastUpdate = new Date().toISOString();
            
            this.persistState();
            this.updateCategoryFilter();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.restoreState();
        }
    }
    
    async loadCategories() {
        try {
            const categoryManager = await getCategoryManager();
            return await categoryManager.loadCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    }
    
    async loadProducts() {
        try {
            const productManager = await getProductManager();
            return await productManager.loadProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    }
    
    persistState() {
        try {
            localStorage.setItem('appState', JSON.stringify({
                products: this.state.products,
                categories: this.state.categories,
                currentFilter: this.state.currentFilter,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.warn('Error persisting state:', error);
        }
    }
    
    restoreState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const state = JSON.parse(savedState);
                const dataAge = state.timestamp ? Date.now() - new Date(state.timestamp).getTime() : Infinity;
                
                if (dataAge <= 3600000) { // 1 hora
                    this.state.products = state.products || [];
                    this.state.categories = state.categories || [];
                    this.state.currentFilter = state.currentFilter || { category: 'all', search: '' };
                }
            }
        } catch (error) {
            console.warn('Error restoring state:', error);
        }
    }
    
    setupConnectionMonitoring() {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }
    
    handleOnline() {
        this.isOnline = true;
        Utils.showSuccess('📶 Conexión restaurada');
        this.refreshData();
    }
    
    handleOffline() {
        this.isOnline = false;
        Utils.showWarning('📶 Sin conexión. Modo offline activado.');
    }
    
    cleanup() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        window.removeEventListener('resize', this.adjustUIForScreenSize);
    }
    
    async initializeUIComponents() {
        // Renderizar header
        if (typeof renderHeader === 'function') {
            renderHeader();
        }
        
        // Inicializar componentes específicos de página
        this.initializePageSpecificComponents();
        
        // Configuraciones responsive
        this.setupResponsiveDesign();
        
        // Configurar animaciones
        this.setupScrollAnimations();
    }
    
    initializePageSpecificComponents() {
        const currentPath = window.location.pathname;
        
        // Panel de administración
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && typeof initAdminPanel === 'function') {
            console.log('✅ Inicializando panel de administración...');
            initAdminPanel();
        }
        
        // Catálogo principal
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid && typeof initCatalogGrid === 'function') {
            console.log('✅ Inicializando catálogo...');
            initCatalogGrid();
        }
    }
    
    setupScrollAnimations() {
        if (!('IntersectionObserver' in window)) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        
        // Observar elementos con clases de animación
        document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach(el => {
            observer.observe(el);
        });
    }
    
    setupResponsiveDesign() {
        this.adjustUIForScreenSize();
        window.addEventListener('resize', this.adjustUIForScreenSize);
    }
    
    adjustUIForScreenSize() {
        const isMobile = window.innerWidth < 768;
        
        // Ajustar grid de productos
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.className = isMobile ? 
                'grid grid-cols-1 gap-4' : 
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
        }
        
        // Ajustar header
        const header = document.getElementById('header');
        if (header) {
            header.classList.toggle('px-4', isMobile);
            header.classList.toggle('px-6', !isMobile);
        }
    }
    
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;
        
        const currentValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
        
        this.state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        // Restaurar selección previa si existe
        if (currentValue && categoryFilter.querySelector(`option[value="${currentValue}"]`)) {
            categoryFilter.value = currentValue;
        }
    }
    
    async refreshData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 No hay conexión a internet');
            return;
        }
        
        try {
            Utils.showInfo('🔄 Actualizando datos...');
            
            const [products, categories] = await Promise.all([
                this.loadProducts(),
                this.loadCategories()
            ]);
            
            this.state.products = products;
            this.state.categories = categories;
            this.state.lastUpdate = new Date().toISOString();
            
            this.persistState();
            this.updateCategoryFilter();
            
            // Notificar a otros componentes sobre la actualización
            if (typeof window.filterAndRenderProducts === 'function') {
                window.filterAndRenderProducts();
            }
            
            Utils.showSuccess('✅ Datos actualizados correctamente');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            Utils.showError('❌ Error al actualizar datos');
        }
    }
    
    // Métodos públicos para compatibilidad
    async refresh() {
        return this.refreshData();
    }
    
    getProducts() {
        return this.state.products;
    }
    
    getCategories() {
        return this.state.categories;
    }
    
    getCurrentFilter() {
        return this.state.currentFilter;
    }
}

// Singleton instance
const app = new DigitalCatalogApp();

// Exportar para módulos
export { app };

// Hacer disponible globalmente
window.DigitalCatalogApp = DigitalCatalogApp;
window.app = app;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    setTimeout(() => app.initialize(), 100);
}
