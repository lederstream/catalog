// scripts/app.js
import { supabase } from './supabase.js';
import { renderHeader, updateHeader } from './components/header.js';
import { initAdminPanel, setupProductForm } from './components/admin-panel.js';
import { initializeAuth, isUserLoggedIn, setupAuthEventListeners } from './auth.js';
import { loadProducts, getProducts } from './products.js';
import { loadCategories } from './categories.js';
import { initModals } from './modals.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { showNotification, debounce } from './utils.js';

// Estado global de la aplicación con patrón Singleton
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
    
    // Métodos de utilidad para el estado
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

// Inicializar la aplicación
export const initializeApp = async () => {
    const appState = AppState.getInstance();
    
    if (appState.isInitialized) {
        console.warn('La aplicación ya está inicializada');
        return;
    }

    try {
        showLoadingState();
        console.log('🚀 Inicializando aplicación DigitalCatalog...');
        
        // Restaurar estado previo si existe
        appState._restoreState();
        
        // Configurar monitoreo de conexión
        setupConnectionMonitoring();

        // Renderizar componentes básicos
        renderHeader();
        initModals();

        // Inicializar autenticación
        await initializeAuth();
        
        // Cargar datos iniciales (solo si estamos online)
        if (appState.isOnline) {
            await loadInitialData();
        } else {
            showNotification('Modo offline activado. Usando datos almacenados localmente.', 'info');
        }

        // Inicializar componentes
        initCatalogGrid();
        initAdminPanel();

        // Configurar event listeners globales
        setupGlobalEventListeners();

        // Finalizar inicialización
        hideLoadingState();
        appState.isInitialized = true;
        
        if (appState.isOnline) {
            showNotification('Catálogo cargado correctamente', 'success');
        }
        
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
    const appState = AppState.getInstance();
    
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
    const appState = AppState.getInstance();
    
    try {
        console.log('📦 Cargando datos del catálogo...');
        
        const [productsResult, categoriesResult] = await Promise.allSettled([
            loadProducts(),
            loadCategories()
        ]);

        // Procesar resultados de productos
        if (productsResult.status === 'fulfilled') {
            appState.updateProducts(productsResult.value);
            console.log(`✅ ${appState.products.length} productos cargados`);
        } else {
            console.error('Error loading products:', productsResult.reason);
            if (appState.products.length === 0) {
                appState.updateProducts(getSampleProducts());
                showNotification('Error al cargar productos, usando datos demo', 'error');
            }
        }

        // Procesar resultados de categorías
        if (categoriesResult.status === 'fulfilled') {
            appState.updateCategories(categoriesResult.value);
            console.log(`✅ ${appState.categories.length} categorías cargadas`);
        } else {
            console.error('Error loading categories:', categoriesResult.reason);
            if (appState.categories.length === 0) {
                appState.updateCategories(getDefaultCategories());
                showNotification('Error al cargar categorías, usando datos demo', 'error');
            }
        }

        // Actualizar UI
        updateCategoryFilter();
        filterProducts();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        if (appState.products.length === 0) {
            loadDemoData();
        }
        showNotification('Error al cargar datos. Verifica tu conexión.', 'error');
    }
};

// Cargar datos de demostración
const loadDemoData = () => {
    const appState = AppState.getInstance();
    
    console.log('📋 Cargando datos de demostración...');
    appState.updateProducts(getSampleProducts());
    appState.updateCategories(getDefaultCategories());
    
    updateCategoryFilter();
    if (typeof window.renderProductsGrid === 'function') {
        window.renderProductsGrid(appState.products, 'productsGrid');
    }
};

// Datos de ejemplo
function getSampleProducts() {
    return [
        {
            id: 'demo-1',
            name: 'Diseño de Logo Profesional',
            description: 'Diseño de logo moderno y profesional para tu marca',
            category_id: 1,
            categories: { id: 1, name: 'diseño' },
            photo_url: 'https://images.unsplash.com/photo-1567446537738-74804ee3a9bd?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 199, price_dollars: 50 },
                { name: 'Premium', price_soles: 399, price_dollars: 100 }
            ],
            created_at: new Date().toISOString(),
            isDemo: true
        },
        {
            id: 'demo-2', 
            name: 'Sitio Web Responsive',
            description: 'Desarrollo de sitio web moderno y responsive',
            category_id: 3,
            categories: { id: 3, name: 'software' },
            photo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&h=200&fit=crop',
            plans: [
                { name: 'Landing Page', price_soles: 799, price_dollars: 200 },
                { name: 'Sitio Completo', price_soles: 1599, price_dollars: 400 }
            ],
            created_at: new Date().toISOString(),
            isDemo: true
        }
    ];
}

function getDefaultCategories() {
    return [
        { id: 1, name: 'diseño', created_at: new Date().toISOString(), isDemo: true },
        { id: 2, name: 'marketing', created_at: new Date().toISOString(), isDemo: true },
        { id: 3, name: 'software', created_at: new Date().toISOString(), isDemo: true },
        { id: 4, name: 'consultoria', created_at: new Date().toISOString(), isDemo: true }
    ];
}

// Actualizar filtro de categorías
const updateCategoryFilter = () => {
    const appState = AppState.getInstance();
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const currentValue = categoryFilter.value;

    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';

    appState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (category.isDemo) {
            option.dataset.demo = 'true';
        }
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
    setupGlobalEventListenersFromFile(); // Desde el archivo event-listeners.js
};

// Configurar búsqueda y filtros
const setupSearchAndFilter = () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterProducts();
        }, 300));
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            filterProducts();
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
                
                // Actualizar URL sin recargar la página
                history.pushState(null, null, targetId);
            }
        });
    });
};

// Configurar manejadores globales
const setupGlobalHandlers = () => {
    const appState = AppState.getInstance();
    
    window.addEventListener('focus', async () => {
        if (appState.isInitialized && appState.isOnline) {
            await refreshData();
        }
    });

    window.addEventListener('error', (e) => {
        console.error('Error no capturado:', e.error);
        showNotification('Error inesperado en la aplicación', 'error');
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promesa rechazada no capturada:', e.reason);
        showNotification('Error en operación asíncrona', 'error');
        e.preventDefault();
    });

    window.addEventListener('authStateChanged', (event) => {
        console.log('Estado de autenticación cambiado:', event.detail);
        updateHeader();
    });

    // Prevenir recarga accidental con Ctrl+R
    window.addEventListener('beforeunload', (e) => {
        if (appState.currentUser) {
            const message = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
            e.returnValue = message;
            return message;
        }
    });
};

// Función para filtrar productos
const filterProducts = () => {
    const appState = AppState.getInstance();
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const productsGrid = document.getElementById('productsGrid');

    if (!searchInput || !categoryFilter || !productsGrid) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    // Guardar estado actual de filtros
    appState.currentFilter = { category, search: searchText };

    let filteredProducts = appState.products;

    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
            const productCategoryId = product.category_id || product.categories?.id;
            const productCategoryName = product.category || product.categories?.name;
            
            return (
                productCategoryId == category || 
                productCategoryName === category ||
                (productCategoryName && productCategoryName.toLowerCase() === category.toLowerCase())
            );
        });
    }

    if (searchText) {
        filteredProducts = filteredProducts.filter(product => {
            const categoryName = product.category || product.categories?.name;
            const searchableText = `${product.name || ''} ${product.description || ''} ${categoryName || ''}`.toLowerCase();
            return searchableText.includes(searchText);
        });
    }

    if (typeof window.renderProductsGrid === 'function') {
        window.renderProductsGrid(filteredProducts, 'productsGrid');
    }
};

// Recargar datos
export const refreshData = async () => {
    const appState = AppState.getInstance();
    
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
        filterProducts();
        
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
    } else {
        loadingElements.forEach(element => {
            element.classList.remove('hidden');
        });
    }
};

// Ocultar estado de carga
const hideLoadingState = () => {
    const loadingElements = document.querySelectorAll('.loading-spinner, .loading-state');
    loadingElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        } else {
            element.classList.add('hidden');
        }
    });
};

// Función para reinicializar la aplicación
const reinitializeApp = async () => {
    const appState = AppState.getInstance();
    appState.isInitialized = false;
    await initializeApp();
};

// Función de diagnóstico
window.debugApp = async () => {
    console.log('=== 🐛 DIAGNÓSTICO DE LA APLICACIÓN ===');
    
    const { data: session } = await supabase.auth.getSession();
    console.log('Sesión:', session);
    
    const appState = AppState.getInstance();
    console.log('Usuario actual:', appState.currentUser);
    
    console.log('Productos en memoria:', appState.products.length);
    console.log('Categorías en memoria:', appState.categories.length);
    console.log('Estado de conexión:', appState.isOnline ? 'Online' : 'Offline');
    
    console.log('Category Filter:', document.getElementById('categoryFilter'));
    console.log('Products Grid:', document.getElementById('productsGrid'));
    console.log('Search Input:', document.getElementById('searchInput'));
    
    console.log('=== ✅ FIN DIAGNÓSTICO ===');
};

// Exportar funciones para uso global
window.filterProducts = filterProducts;
window.refreshData = refreshData;
window.reinitializeApp = reinitializeApp;

// Hacer variables globales disponibles para depuración
window.appState = {
    getState: () => {
        const appState = AppState.getInstance();
        return {
            products: appState.products,
            categories: appState.categories,
            isInitialized: appState.isInitialized,
            user: appState.currentUser,
            filters: appState.currentFilter,
            isOnline: appState.isOnline
        };
    }
};

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    setTimeout(initializeApp, 100);
}

// Manejar el evento de vuelta/adelante del navegador
window.addEventListener('popstate', () => {
    const appState = AppState.getInstance();
    if (appState.isInitialized) {
        filterProducts();
    }
});

// Función para cargar event listeners desde archivo externo
function setupGlobalEventListenersFromFile() {
    // Event delegation para todos los botones de la aplicación
    document.addEventListener('click', function(e) {
        // Logout buttons
        if (e.target.closest('#logoutBtn') || 
            e.target.closest('#mobileLogoutBtn') || 
            e.target.closest('.mobile-logout-btn')) {
            e.preventDefault();
            if (typeof window.logout === 'function') {
                window.logout();
            }
        }
        
        // Delete product buttons
        if (e.target.closest('.delete-product')) {
            e.preventDefault();
            const id = e.target.closest('.delete-product').dataset.id;
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                if (window.deleteProduct) {
                    window.deleteProduct(id);
                }
            }
        }
        
        // Edit product buttons
        if (e.target.closest('.edit-product')) {
            e.preventDefault();
            const id = e.target.closest('.edit-product').dataset.id;
            if (window.editProduct) {
                window.editProduct(id);
            }
        }
        
        // View details buttons
        if (e.target.closest('.view-details-btn')) {
            e.preventDefault();
            const id = e.target.closest('.view-details-btn').dataset.id;
            if (window.showProductDetails) {
                window.showProductDetails(id);
            }
        }
        
        // Toggle mobile menu
        if (e.target.closest('#mobileMenuBtn')) {
            e.preventDefault();
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        }
    });

    // Manejar envío de formularios
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        // Formulario de contacto
        if (form.id === 'contactForm') {
            e.preventDefault();
            handleContactForm(form);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+K para buscar
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape para cerrar modales
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        }
    });
}

// Manejar formulario de contacto
function handleContactForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validación básica
    if (!data.contactName || !data.contactEmail || !data.contactMessage) {
        showNotification('Por favor completa todos los campos obligatorios', 'error');
        return;
    }
    
    // Simular envío (en una app real, aquí harías una petición a tu backend)
    showNotification('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
    form.reset();
}

