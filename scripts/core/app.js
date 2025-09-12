// scripts/core/app.js
import { Utils } from './utils.js';
import { supabase } from './supabase.js';
import { CategoryManager } from '../managers/category-manager.js';
import { ProductManager } from '../managers/product-manager.js';
import { AuthManager } from './auth.js';
import { setupAllEventListeners } from '../event-listeners.js';

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
            
            // Configurar modo debug
            if (window.location.search.includes('debug=true')) {
                Utils.enableDebugMode(true);
            }
            
            // Configurar monitoreo de conexión
            this.setupConnectionMonitoring();
            
            // Inicializar componentes core
            await this.initializeCoreComponents();
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
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
        // Inicializar Supabase
        await this.initSupabase();
        
        // Inicializar managers
        await Promise.all([
            CategoryManager.init(),
            ProductManager.init(),
            AuthManager.init()
        ]);
    }
    
    async initSupabase() {
        try {
            // Verificar conexión con Supabase
            const { data, error } = await supabase.from('products').select('count').limit(1);
            
            if (error) {
                console.error('Error conectando con Supabase:', error);
                throw error;
            }
            
            console.log('✅ Supabase conectado correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
            Utils.showError('Error de conexión con la base de datos');
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
            Utils.showInfo('🔄 Cargando datos...');
            
            const [categories, products] = await Promise.all([
                CategoryManager.loadCategories(),
                ProductManager.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            this.state.lastUpdate = new Date().toISOString();
            
            this.persistState();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showWarning('⚠️ Error cargando datos iniciales');
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
    
    setupGlobalEventListeners() {
        // Configurar event listeners globales
        setupAllEventListeners();
        
        // Scroll to top button
        this.createScrollToTopButton();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Global error handling
        this.setupErrorHandling();
    }
    
    createScrollToTopButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        scrollBtn.className = 'fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg opacity-0 transition-all duration-300 hover:bg-blue-700 transform translate-y-10 z-40';
        scrollBtn.setAttribute('aria-label', 'Volver arriba');
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        document.body.appendChild(scrollBtn);
        
        // Mostrar/ocultar según scroll
        window.addEventListener('scroll', Utils.throttle(() => {
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
                modals.forEach(modal => modal.classList.add('hidden'));
            }
        });
    }
    
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Error global:', e.error);
            Utils.showError('❌ Error inesperado en la aplicación');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada:', e.reason);
            Utils.showError('❌ Error en operación asíncrona');
            e.preventDefault();
        });
    }
    
    async refreshData() {
        if (!this.isOnline) {
            Utils.showWarning('📶 No hay conexión a internet');
            return;
        }
        
        try {
            Utils.showInfo('🔄 Actualizando datos...');
            
            const [products, categories] = await Promise.all([
                ProductManager.loadProducts(),
                CategoryManager.loadCategories()
            ]);
            
            this.state.products = products;
            this.state.categories = categories;
            this.state.lastUpdate = new Date().toISOString();
            
            this.persistState();
            
            Utils.showSuccess('✅ Datos actualizados correctamente');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            Utils.showError('❌ Error al actualizar datos');
        }
    }
    
    showLoadingState() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 loading-state';
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
        const loader = document.querySelector('.loading-state');
        if (loader) {
            await Utils.fadeOut(loader);
            loader.remove();
        }
        document.body.style.overflow = '';
    }
    
    // Métodos públicos para compatibilidad
    async refresh() {
        return this.refreshData();
    }
}

// Singleton instance
const app = new DigitalCatalogApp();

// Exportar para módulos
export { app };

// Hacer disponible globalmente
window.DigitalCatalogApp = DigitalCatalogApp;
window.app = app;
