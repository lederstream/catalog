import { supabase } from './supabase.js';
import { renderHeader, updateHeader } from './components/header.js';
import { initAdminPanel, setupProductForm } from './components/admin-panel.js';
import { initializeAuth, isUserLoggedIn, setupAuthEventListeners } from './auth.js';
import { loadProducts, getProducts, filterProducts, renderProductsGrid } from './products.js';
import { loadCategories, getCategories } from './categories.js';
import { initModals } from './modals.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { showNotification, debounce } from './utils.js';

// Estado global de la aplicación
class AppState {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.currentFilter = { category: 'all', search: '' };
        this.isOnline = navigator.onLine;
    }
    
    static getInstance() {
        if (!AppState.instance) {
            AppState.instance = new AppState();
        }
        return AppState.instance;
    }
    
    updateProducts(products) {
        this.products = products;
        this._persistState();
    }
    
    updateCategories(categories) {
        this.categories = categories;
        this._persistState();
    }
    
    setUser(user) {
        this.currentUser = user;
        this._persistState();
    }
    
    _persistState() {
        if (this.isOnline) {
            localStorage.setItem('appState', JSON.stringify({
                products: this.products,
                categories: this.categories,
                currentFilter: this.currentFilter
            }));
        }
    }
    
    _restoreState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.products = state.products || [];
                this.categories = state.categories || [];
                this.currentFilter = state.currentFilter || { category: 'all', search: '' };
            }
        } catch (error) {
            console.warn('Error restoring state from localStorage:', error);
        }
    }
}

const appState = AppState.getInstance();

// Inicializar la aplicación
export const initializeApp = async () => {
    if (appState.isInitialized) {
        console.warn('La aplicación ya está inicializada');
        return;
    }

    try {
        showLoadingState();
        console.log('🚀 Inicializando aplicación DigitalCatalog...');
        
        // Restaurar estado previo
        appState._restoreState();
        
        // Configurar monitoreo de conexión
        setupConnectionMonitoring();

        // Renderizar componentes básicos
        renderHeader();
        initModals();

        // Inicializar autenticación
        console.log('🔄 Inicializando autenticación...');
        await initializeAuth();
        
        // Configurar event listeners de autenticación
        setupAuthEventListeners();
        
        // Cargar datos iniciales
        await loadInitialData();

        // Inicializar componentes
        initCatalogGrid();
        initAdminPanel();

        // Configurar event listeners globales
        setupGlobalEventListeners();

        // Finalizar inicialización
        hideLoadingState();
        appState.isInitialized = true;
        
        showNotification('Catálogo cargado correctamente', 'success');
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        showNotification('Error al cargar el catálogo. Usando modo demostración.', 'error');
        loadDemoData();
        hideLoadingState();
    }
};

// Configurar monitoreo de conexión
const setupConnectionMonitoring = () => {
    window.addEventListener('online', () => {
        appState.isOnline = true;
        showNotification('Conexión restaurada. Sincronizando datos...', 'success');
        refreshData();
    });

    window.addEventListener('offline', () => {
        appState.isOnline = false;
        showNotification('Sin conexión. Modo offline activado.', 'warning');
    });
};

// Cargar datos iniciales
const loadInitialData = async () => {
    try {
        console.log('📦 Cargando datos del catálogo...');
        
        // Cargar categorías
        let categories = [];
        if (typeof loadCategories === 'function') {
            categories = await loadCategories();
            appState.updateCategories(categories);
            console.log(`✅ ${categories.length} categorías cargadas`);
        }

        // Cargar productos
        let products = [];
        if (typeof loadProducts === 'function') {
            products = await loadProducts();
            appState.updateProducts(products);
            console.log(`✅ ${products.length} productos cargados`);
        }

        // Actualizar UI
        updateCategoryFilter();
        
        // Renderizar productos
        if (typeof renderProductsGrid === 'function') {
            console.log('🎨 Renderizando productos...');
            renderProductsGrid(products, 'productsGrid');
        }
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        throw error;
    }
};

// Cargar datos de demostración
const loadDemoData = () => {
    console.log('📋 Cargando datos de demostración...');
    appState.updateProducts(getSampleProducts());
    appState.updateCategories(getDefaultCategories());
    
    updateCategoryFilter();
    filterAndRenderProducts();
    
    showNotification('Modo demostración activado', 'info');
};

// Datos de ejemplo
function getSampleProducts() {
    return [
        {
            id: 'demo-1',
            name: 'Diseño de Logo Profesional',
            description: 'Diseño de logo moderno y profesional para tu marca',
            category_id: 1,
            photo_url: 'https://images.unsplash.com/photo-1567446537738-74804ee3a9bd?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 199, price_dollars: 50 },
                { name: 'Premium', price_soles: 399, price_dollars: 100 }
            ],
            created_at: new Date().toISOString()
        },
        {
            id: 'demo-2', 
            name: 'Sitio Web Responsive',
            description: 'Desarrollo de sitio web moderno y responsive',
            category_id: 3,
            photo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&h=200&fit=crop',
            plans: [
                { name: 'Landing Page', price_soles: 799, price_dollars: 200 },
                { name: 'Sitio Completo', price_soles: 1599, price_dollars: 400 }
            ],
            created_at: new Date().toISOString()
        },
        {
            id: 'demo-3',
            name: 'Marketing Digital',
            description: 'Estrategias de marketing digital para tu negocio',
            category_id: 2,
            photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 299, price_dollars: 75 },
                { name: 'Completo', price_soles: 599, price_dollars: 150 }
            ],
            created_at: new Date().toISOString()
        }
    ];
}

function getDefaultCategories() {
    return [
        { id: 1, name: 'Diseño', created_at: new Date().toISOString() },
        { id: 2, name: 'Marketing', created_at: new Date().toISOString() },
        { id: 3, name: 'Desarrollo Web', created_at: new Date().toISOString() },
        { id: 4, name: 'Consultoría', created_at: new Date().toISOString() }
    ];
}

// Actualizar filtro de categorías
const updateCategoryFilter = () => {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const currentValue = categoryFilter.value;

    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';

    appState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });

    if (currentValue && categoryFilter.querySelector(`option[value="${currentValue}"]`)) {
        categoryFilter.value = currentValue;
    }
};

// Configurar event listeners globales
const setupGlobalEventListeners = () => {
    setupSearchAndFilter();
    setupSmoothNavigation();
    setupGlobalHandlers();
};

// Configurar búsqueda y filtros
const setupSearchAndFilter = () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterAndRenderProducts();
        }, 300));
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            filterAndRenderProducts();
        });
    }
};

// Configurar navegación suave
const setupSmoothNavigation = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
};

// Configurar manejadores globales
const setupGlobalHandlers = () => {
    window.addEventListener('error', (e) => {
        console.error('Error no capturado:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promesa rechazada no capturada:', e.reason);
        e.preventDefault();
    });
};

// Función para filtrar y renderizar productos
const filterAndRenderProducts = () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (!searchInput || !categoryFilter) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    // Guardar estado actual de filtros
    appState.currentFilter = { category, search: searchText };

    let filteredProducts = filterProducts(category, searchText);

    renderProductsGrid(filteredProducts, 'productsGrid');
};

// Recargar datos
export const refreshData = async () => {
    if (!appState.isOnline) {
        showNotification('No hay conexión a internet. No se pueden actualizar los datos.', 'warning');
        return;
    }

    try {
        showNotification('Actualizando datos...', 'info');
        
        const [products, categories] = await Promise.all([
            loadProducts(),
            loadCategories()
        ]);

        appState.updateProducts(products);
        appState.updateCategories(categories);

        updateCategoryFilter();
        filterAndRenderProducts();
        
        showNotification('Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('Error al actualizar datos', 'error');
    }
};

// Mostrar estado de carga
const showLoadingState = () => {
    const loadingElements = document.querySelectorAll('.loading-spinner, .loading-state');
    if (loadingElements.length === 0) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 loading-state';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="mt-2 text-gray-600">Cargando catálogo...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }
};

// Ocultar estado de carga
const hideLoadingState = () => {
    const loadingElements = document.querySelectorAll('.loading-spinner, .loading-state');
    loadingElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
};

// Hacer funciones disponibles globalmente
window.filterAndRenderProducts = filterAndRenderProducts;
window.refreshData = refreshData;
window.getAppState = () => appState;

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    setTimeout(initializeApp, 100);
}
