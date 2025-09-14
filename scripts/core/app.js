// scripts/core/app.js
import { Utils } from './utils.js';
import { getAuthManager } from './auth.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { getProductManager } from '../managers/product-manager.js';

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
        if (this.isInitialized) return;
        
        try {
            this.showLoadingState();
            
            // Configurar modo debug
            if (window.location.search.includes('debug=true')) {
                Utils.enableDebugMode(true);
            }
            
            // Configurar monitoreo de conexión
            this.setupConnectionMonitoring();
            
            // Inicializar managers
            await Promise.all([
                getAuthManager(),
                getCategoryManager(),
                getProductManager()
            ]);
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            this.isInitialized = true;
            Utils.showSuccess('🚀 Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            Utils.showError('Error al inicializar la aplicación');
        } finally {
            this.hideLoadingState();
        }
    }
    
    async loadInitialData() {
        try {
            Utils.showInfo('🔄 Cargando datos...');
            
            const categoryManager = await getCategoryManager();
            const productManager = await getProductManager();
            
            const [categories, products] = await Promise.all([
                categoryManager.loadCategories(),
                productManager.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            this.state.lastUpdate = new Date().toISOString();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showWarning('⚠️ Error cargando datos iniciales');
        }
    }
    
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Utils.showSuccess('📶 Conexión restaurada');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            Utils.showWarning('📶 Sin conexión. Modo offline activado.');
        });
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
            loader.remove();
        }
        document.body.style.overflow = '';
    }
    
    async refresh() {
        if (!this.isOnline) {
            Utils.showWarning('📶 No hay conexión a internet');
            return;
        }
        
        try {
            Utils.showInfo('🔄 Actualizando datos...');
            
            const categoryManager = await getCategoryManager();
            const productManager = await getProductManager();
            
            const [products, categories] = await Promise.all([
                productManager.loadProducts(),
                categoryManager.loadCategories()
            ]);
            
            this.state.products = products;
            this.state.categories = categories;
            this.state.lastUpdate = new Date().toISOString();
            
            Utils.showSuccess('✅ Datos actualizados correctamente');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            Utils.showError('❌ Error al actualizar datos');
        }
    }
    
    getState() {
        return { ...this.state };
    }
    
    setFilter(filter) {
        this.state.currentFilter = { ...this.state.currentFilter, ...filter };
    }
}

// Singleton instance
const app = new DigitalCatalogApp();

// Exportar para módulos
export { app };

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    setTimeout(() => app.initialize(), 0);
}
