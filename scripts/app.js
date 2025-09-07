// scripts/app.js
import { Utils } from './utils.js';
import { supabase } from './supabase.js';
import { getCategoryManager } from './categories.js';
import { getProductManager } from './products.js';
import { initModals } from './modals.js';
import { initializeAuth } from './auth.js';
import { initAdminPanel } from './components/admin-panel.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { renderHeader, updateHeader } from './components/header.js';

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
    }
    
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ La aplicación ya está inicializada');
            return;
        }
        
        try {
            this.showLoadingState();
            
            // Limpiar notificaciones previas
            Utils.clearAllNotifications();
            
            // Configurar modo debug
            if (window.location.search.includes('debug=true')) {
                localStorage.setItem('debug', 'true');
                Utils.debugMode = true;
            }
            
            // Inicializar componentes core
            await this.initializeCoreComponents();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Inicializar UI components
            await this.initializeUIComponents();
            
            // Configurar monitoreo de conexión
            this.setupConnectionMonitoring();
            
            // Finalizar inicialización
            await this.hideLoadingState();
            this.isInitialized = true;
            
            console.log('🚀 Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            await this.hideLoadingState();
        }
    }
    
    async initializeCoreComponents() {
        // Inicializar managers
        await Promise.all([
            getCategoryManager(),
            getProductManager(),
            initModals(),
            initializeAuth()
        ]);
    }
    
    async loadInitialData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 Modo offline - Usando datos locales');
            this.restoreState();
            return;
        }
        
        try {
            const categoryManager = await getCategoryManager();
            const productManager = await getProductManager();
            
            const [categories, products] = await Promise.all([
                categoryManager.loadCategories(),
                productManager.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            this.state.lastUpdate = new Date().toISOString();
            
            this.persistState();
            
            // Actualizar UI
            this.updateCategoryFilter();
            this.filterAndRenderProducts();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.restoreState();
        }
    }
    
    persistState() {
        if (this.isOnline) {
            localStorage.setItem('appState', JSON.stringify({
                ...this.state,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    restoreState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Verificar si los datos están desactualizados (más de 1 hora)
                const dataAge = state.timestamp ? Date.now() - new Date(state.timestamp).getTime() : Infinity;
                
                if (dataAge <= 3600000) {
                    this.state = {
                        ...this.state,
                        products: state.products || [],
                        categories: state.categories || [],
                        currentFilter: state.currentFilter || { category: 'all', search: '' }
                    };
                }
            }
        } catch (error) {
            console.warn('Error restaurando estado:', error);
        }
    }
    
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Utils.showSuccess('📶 Conexión restaurada. Sincronizando datos...');
            this.refreshData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            Utils.showWarning('📶 Sin conexión. Modo offline activado.');
        });
    }
    
    async initializeUIComponents() {
        // Renderizar header
        if (typeof renderHeader === 'function') {
            renderHeader();
        }
        
        // Inicializar componentes de UI solo si existen
        if (typeof initAdminPanel === 'function') {
            // Solo inicializar el panel de admin si existe en la página actual
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                initAdminPanel();
            } else {
                console.log('ℹ️ Panel de administración no encontrado en esta página');
            }
        }
        
        if (typeof initCatalogGrid === 'function') {
            initCatalogGrid();
        }
        
        // Configurar animaciones de scroll
        this.setupScrollAnimations();
        
        // Configurar responsive design
        this.setupResponsiveDesign();
    }
    
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
        
        if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            animatedElements.forEach(el => observer.observe(el));
        }
    }
    
    setupResponsiveDesign() {
        // Ajustar elementos según el tamaño de pantalla
        const adjustUIForScreenSize = () => {
            const isMobile = window.innerWidth < 768;
            
            // Ajustar grid de productos
            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                if (isMobile) {
                    productsGrid.classList.add('grid-cols-1');
                    productsGrid.classList.remove('grid-cols-2', 'grid-cols-3', 'grid-cols-4');
                } else {
                    productsGrid.classList.remove('grid-cols-1');
                    productsGrid.classList.add('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
                }
            }
            
            // Ajustar header
            const header = document.getElementById('header');
            if (header) {
                if (isMobile) {
                    header.classList.add('px-2');
                    header.classList.remove('px-6');
                } else {
                    header.classList.remove('px-2');
                    header.classList.add('px-6');
                }
            }
        };
        
        // Ejecutar al cargar y al cambiar tamaño
        adjustUIForScreenSize();
        window.addEventListener('resize', adjustUIForScreenSize);
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
            if (category.icon) {
                option.textContent = `${category.name}`;
            }
            categoryFilter.appendChild(option);
        });
        
        if (currentValue && categoryFilter.querySelector(`option[value="${currentValue}"]`)) {
            categoryFilter.value = currentValue;
        }
    }
    
    filterAndRenderProducts() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const productsGrid = document.getElementById('productsGrid');
        
        if (!searchInput || !categoryFilter || !productsGrid) return;
        
        const searchText = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;
        
        // Guardar estado actual de filtros
        this.state.currentFilter = { category, search: searchText };
        
        // Filtrar productos
        const productManager = window.productManager;
        const filteredProducts = productManager ? productManager.filterProducts(category, searchText) : [];
        
        // Renderizar productos
        if (productManager && typeof productManager.renderProductsGrid === 'function') {
            productManager.renderProductsGrid(filteredProducts, 'productsGrid');
        }
    }
    
    async refreshData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 No hay conexión a internet');
            return;
        }
        
        try {
            const categoryManager = await getCategoryManager();
            const productManager = await getProductManager();
            
            const [products, categories] = await Promise.all([
                productManager.loadProducts(),
                categoryManager.loadCategories()
            ]);
            
            this.state.products = products;
            this.state.categories = categories;
            this.state.lastUpdate = new Date().toISOString();
            
            this.persistState();
            this.updateCategoryFilter();
            this.filterAndRenderProducts();
            
            Utils.showSuccess('✅ Datos actualizados correctamente');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            Utils.showError('❌ Error al actualizar datos');
        }
    }
    
    async hideLoadingState() {
        const loader = document.querySelector('.loading-state');
        if (loader) {
            // Usar una transición suave en lugar de fadeOut si existe
            if (typeof Utils !== 'undefined' && typeof Utils.fadeOut === 'function') {
                await Utils.fadeOut(loader);
            } else {
                // Fallback si Utils no está disponible
                loader.style.opacity = '0';
                loader.style.transition = 'opacity 0.5s ease';
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            loader.remove();
        }
        document.body.style.overflow = '';
    }
    
    // Métodos públicos para compatibilidad
    async refresh() {
        return this.refreshData();
    }
    
    filterProducts() {
        return this.filterAndRenderProducts();
    }
}

// Singleton instance
const app = new DigitalCatalogApp();

// Exportar para módulos
export { app };

// Hacer funciones disponibles globalmente
window.showProductDetails = (productId) => {
    if (window.productManager) {
        window.productManager.showProductDetails(productId)
    }
};

// Hacer disponible globalmente
window.DigitalCatalogApp = DigitalCatalogApp;
window.app = app;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    setTimeout(() => app.initialize(), 100);
}
