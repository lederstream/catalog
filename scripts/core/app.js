import Utils from './utils.js';
import { supabase } from './supabase.js';
import { getCategoryManager } from './categories.js';
import { getProductManager } from './products.js';
import { initModals } from './modals.js';
import { initializeAuth } from './auth.js';
import { initAdminPanel } from './components/admin-panel.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { renderHeader } from './components/header.js';

class DigitalCatalogApp {
    constructor() {
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.currentUser = null;
        this.state = {
            products: [],
            categories: [],
            currentFilter: { category: 'all', search: '' }
        };
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.showLoadingState();
            
            // Inicializar componentes core
            await this.initializeCoreComponents();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Inicializar UI components
            this.initializeUIComponents();
            
            // Finalizar inicialización
            await this.hideLoadingState();
            this.isInitialized = true;
            
            Utils.showSuccess('🚀 Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            Utils.showError('Error al inicializar la aplicación');
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
        try {
            const categoryManager = await getCategoryManager();
            const productManager = await getProductManager();
            
            const [categories, products] = await Promise.all([
                categoryManager.loadCategories(),
                productManager.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showWarning('⚠️ Error cargando datos iniciales');
        }
    }
    
    initializeUIComponents() {
        // Renderizar header
        renderHeader();
        
        // Inicializar componentes de UI
        if (typeof initAdminPanel === 'function') {
            initAdminPanel();
        }
        
        if (typeof initCatalogGrid === 'function') {
            initCatalogGrid();
        }
    }
    
    showLoadingState() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50';
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
        const loader = document.querySelector('.fixed.inset-0');
        if (loader) {
            await Utils.fadeOut(loader);
            loader.remove();
        }
        document.body.style.overflow = '';
    }
}

// Singleton instance
const app = new DigitalCatalogApp();

// Hacer disponible globalmente
window.DigitalCatalogApp = DigitalCatalogApp;
window.app = app;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    setTimeout(() => app.initialize(), 100);
}
