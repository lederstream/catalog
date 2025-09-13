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
        
        this.eventListeners = new Map();
    }
    
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ La aplicación ya está inicializada');
            return;
        }
        
        try {
            this.showLoadingState();
            
            // Configurar modo debug
            if (window.location.search.includes('debug=true')) {
                Utils.enableDebugMode(true);
                console.log('🔧 Modo debug activado');
            }
            
            // Configurar monitoreo de conexión
            this.setupConnectionMonitoring();
            
            // Inicializar autenticación primero
            await getAuthManager();
            
            // Inicializar managers
            await Promise.all([
                getCategoryManager(),
                getProductManager()
            ]);
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Finalizar inicialización
            await this.hideLoadingState();
            this.isInitialized = true;
            
            Utils.showSuccess('🚀 Aplicación inicializada correctamente');
            this.emit('app:initialized');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            Utils.showError('Error al inicializar la aplicación');
            await this.hideLoadingState();
            this.emit('app:error', error);
        }
    }
    
    async loadInitialData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 Modo offline - Usando datos locales');
            this.restoreState();
            return;
        }
        
        try {
            Utils.showInfo('🔄 Cargando datos...');
            this.emit('data:loadingStart');
            
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
            this.emit('data:loaded', { products, categories });
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showWarning('⚠️ Error cargando datos iniciales');
            this.restoreState();
            this.emit('data:error', error);
        }
    }
    
    persistState() {
        if (this.isOnline && window.localStorage) {
            try {
                const stateToPersist = {
                    products: this.state.products,
                    categories: this.state.categories,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('appState', JSON.stringify(stateToPersist));
                this.emit('state:persisted');
            } catch (error) {
                console.warn('Error persistiendo estado:', error);
            }
        }
    }
    
    restoreState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Verificar si los datos están desactualizados (más de 1 hora)
                const dataAge = state.timestamp ? Date.now() - new Date(state.timestamp).getTime() : Infinity;
                
                if (dataAge <= 3600000) { // 1 hora
                    this.state = {
                        ...this.state,
                        products: state.products || [],
                        categories: state.categories || [],
                        currentFilter: state.currentFilter || { category: 'all', search: '' }
                    };
                    this.emit('state:restored');
                }
            }
        } catch (error) {
            console.warn('Error restaurando estado:', error);
            this.emit('state:restoreError', error);
        }
    }
    
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Utils.showSuccess('📶 Conexión restaurada');
            this.emit('connection:online');
            this.refreshData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            Utils.showWarning('📶 Sin conexión. Modo offline activado.');
            this.emit('connection:offline');
        });
    }
    
    setupGlobalEventListeners() {
        // Scroll to top button
        this.createScrollToTopButton();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Global error handling
        this.setupErrorHandling();
        
        // Service Worker registration (si usas PWA)
        this.registerServiceWorker();
    }
    
    createScrollToTopButton() {
        if (document.getElementById('scrollToTop')) return;
        
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scrollToTop';
        scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        scrollBtn.className = 'fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg opacity-0 transition-all duration-300 hover:bg-blue-700 transform translate-y-10 z-40';
        scrollBtn.setAttribute('aria-label', 'Volver arriba');
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        document.body.appendChild(scrollBtn);
        
        // Mostrar/ocultar según scroll
        window.addEventListener('scroll', Utils.throttle(() => {
            const scrollBtn = document.getElementById('scrollToTop');
            if (!scrollBtn) return;
            
            if (window.scrollY > 300) {
                scrollBtn.classList.remove('opacity-0', 'translate-y-10');
                scrollBtn.classList.add('opacity-100', 'translate-y-0');
            } else {
                scrollBtn.classList.remove('opacity-100', 'translate-y-0');
                scrollBtn.classList.add('opacity-0', 'translate-y-10');
            }
        }, 100));
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para buscar
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Escape para cerrar modales
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-container');
                modals.forEach(modal => {
                    if (!modal.classList.contains('hidden')) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });
    }
    
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Error global:', e.error);
            Utils.showError('❌ Error inesperado en la aplicación');
            this.emit('error:global', e.error);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada:', e.reason);
            Utils.showError('❌ Error en operación asíncrona');
            this.emit('error:unhandled', e.reason);
            e.preventDefault();
        });
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                        this.emit('sw:registered', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                        this.emit('sw:error', registrationError);
                    });
            });
        }
    }
    
    async refreshData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 No hay conexión a internet');
            return;
        }
        
        try {
            Utils.showInfo('🔄 Actualizando datos...');
            this.emit('data:refreshStart');
            
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
            this.emit('data:refreshed', { products, categories });
            
            Utils.showSuccess('✅ Datos actualizados correctamente');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            Utils.showError('❌ Error al actualizar datos');
            this.emit('data:refreshError', error);
        }
    }
    
    showLoadingState() {
        // Evitar múltiples loaders
        if (document.querySelector('.app-loading-state')) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 app-loading-state';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-gray-600 font-medium">Cargando DigitalCatalog</p>
                <p class="text-gray-400 text-sm mt-1">Estamos preparando todo para ti...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        document.body.style.overflow = 'hidden';
    }
    
    async hideLoadingState() {
        const loader = document.querySelector('.app-loading-state');
        if (loader) {
            await Utils.fadeOut(loader);
            loader.remove();
        }
        document.body.style.overflow = '';
    }
    
    // Sistema de eventos
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            for (const callback of this.eventListeners.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener para evento ${event}:`, error);
                }
            }
        }
    }
    
    // Métodos públicos para compatibilidad
    async refresh() {
        return this.refreshData();
    }
    
    getState() {
        return { ...this.state };
    }
    
    setFilter(filter) {
        this.state.currentFilter = { ...this.state.currentFilter, ...filter };
        this.emit('filter:changed', this.state.currentFilter);
    }
}

// Singleton instance
const app = new DigitalCatalogApp();

// Exportar para módulos
export { app };

// Hacer disponible globalmente
window.DigitalCatalogApp = DigitalCatalogApp;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    setTimeout(() => app.initialize(), 0);
}
