// scripts/app.js
import { supabase } from './supabase.js';
import { renderHeader, updateHeader } from './components/header.js';
import { initAdminPanel, setupProductForm } from './components/admin-panel.js';
import { initializeAuth, isUserLoggedIn, setupAuthEventListeners } from './auth.js';
import { loadProducts, getProducts, filterProducts, renderProductsGrid } from './products.js';
import { loadCategories, getCategories } from './categories.js';
import { initModals } from './modals.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { 
    showNotification, 
    debounce, 
    fadeIn, 
    fadeOut, 
    smoothScrollTo,
    measurePerformance,
    enableDebugMode
} from './utils.js';

// Estado global de la aplicación
class AppState {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.currentFilter = { category: 'all', search: '' };
        this.isOnline = navigator.onLine;
        this.pendingActions = [];
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
        this._triggerEvent('productsUpdated', { products });
    }
    
    updateCategories(categories) {
        this.categories = categories;
        this._persistState();
        this._triggerEvent('categoriesUpdated', { categories });
    }
    
    setUser(user) {
        this.currentUser = user;
        this._persistState();
        this._triggerEvent('userChanged', { user });
    }
    
    addPendingAction(action) {
        this.pendingActions.push(action);
    }
    
    executePendingActions() {
        if (this.pendingActions.length > 0 && this.isOnline) {
            console.log(`🔄 Ejecutando ${this.pendingActions.length} acciones pendientes`);
            this.pendingActions.forEach(action => {
                try {
                    action();
                } catch (error) {
                    console.error('Error ejecutando acción pendiente:', error);
                }
            });
            this.pendingActions = [];
        }
    }
    
    _persistState() {
        try {
            if (this.isOnline) {
                localStorage.setItem('appState', JSON.stringify({
                    products: this.products,
                    categories: this.categories,
                    currentFilter: this.currentFilter,
                    timestamp: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.warn('Error persistiendo estado:', error);
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
                
                // Verificar si los datos están desactualizados (más de 1 hora)
                if (state.timestamp) {
                    const dataAge = Date.now() - new Date(state.timestamp).getTime();
                    if (dataAge > 3600000) { // 1 hora
                        console.log('📦 Datos locales desactualizados, se requerirá recarga');
                        this.products = [];
                        this.categories = [];
                    }
                }
            }
        } catch (error) {
            console.warn('Error restaurando estado:', error);
        }
    }
    
    _triggerEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

// Inicializar la aplicación
export const initializeApp = async () => {
    const appState = AppState.getInstance();
    
    if (appState.isInitialized) {
        console.warn('⚠️ La aplicación ya está inicializada');
        return;
    }

    try {
        showLoadingState();
        console.log('🚀 Inicializando aplicación DigitalCatalog...');
        
        // Configurar modo debug si está en URL
        if (window.location.search.includes('debug=true')) {
            enableDebugMode(true);
        }
        
        // Restaurar estado previo
        appState._restoreState();
        
        // Configurar monitoreo de conexión
        setupConnectionMonitoring();

        // Renderizar componentes básicos
        renderHeader();
        initModals();

        // Inicializar autenticación PRIMERO
        console.log('🔄 Inicializando autenticación...');
        await initializeAuth();
        
        // Configurar event listeners de autenticación
        setupAuthEventListeners();
        
        // Configurar event listeners globales
        setupGlobalEventListeners();
        
        // Cargar datos iniciales
        if (appState.isOnline) {
            await loadInitialData();
        } else {
            showNotification('📶 Modo offline activado. Usando datos almacenados localmente.', 'info');
            // Mostrar datos locales si existen
            if (appState.products.length > 0) {
                updateCategoryFilter();
                filterAndRenderProducts();
            }
        }

        // Inicializar componentes
        initCatalogGrid();
        initAdminPanel();

        // Ejecutar acciones pendientes
        appState.executePendingActions();

        // Finalizar inicialización
        await hideLoadingState();
        appState.isInitialized = true;
        
        // Animación de entrada
        animateAppEntry();
        
        if (appState.isOnline) {
            showNotification('✅ Catálogo cargado correctamente', 'success');
        }
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        showNotification('❌ Error al cargar el catálogo. Usando modo demostración.', 'error');
        loadDemoData();
        await hideLoadingState();
    }
};

// Configurar monitoreo de conexión
const setupConnectionMonitoring = () => {
    const appState = AppState.getInstance();
    
    window.addEventListener('online', () => {
        appState.isOnline = true;
        showNotification('📶 Conexión restaurada. Sincronizando datos...', 'success');
        
        // Ejecutar acciones pendientes
        appState.executePendingActions();
        
        // Recargar datos
        refreshData();
    });

    window.addEventListener('offline', () => {
        appState.isOnline = false;
        showNotification('📶 Sin conexión. Modo offline activado.', 'warning');
    });
    
    // Monitorear calidad de conexión
    if ('connection' in navigator) {
        navigator.connection.addEventListener('change', () => {
            console.log('📶 Calidad de conexión cambiada:', navigator.connection);
        });
    }
};

// Cargar datos iniciales
const loadInitialData = async () => {
    const appState = AppState.getInstance();
    
    try {
        console.log('📦 Cargando datos del catálogo...');
        
        // Cargar categorías primero
        let categories = [];
        if (typeof window.loadCategories === 'function') {
            categories = await window.loadCategories();
            appState.updateCategories(categories);
            console.log(`✅ ${categories.length} categorías cargadas`);
            
            // Actualizar el selector de categorías en el formulario
            if (typeof window.loadCategoriesIntoSelect === 'function') {
                window.loadCategoriesIntoSelect();
            }
        }

        // Luego cargar productos
        let products = [];
        if (typeof window.loadProducts === 'function') {
            products = await window.loadProducts();
            appState.updateProducts(products);
            console.log(`✅ ${products.length} productos cargados`);
        }

        // Actualizar UI
        updateCategoryFilter();
        
        // Renderizar productos
        if (typeof window.renderProductsGrid === 'function') {
            console.log('🎨 Renderizando productos...');
            window.renderProductsGrid(products, 'productsGrid');
        }
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        if (appState.products.length === 0) {
            loadDemoData();
        }
        showNotification('⚠️ Error al cargar datos. Verifica tu conexión.', 'error');
    }
};

// Cargar datos de demostración
const loadDemoData = () => {
    const appState = AppState.getInstance();
    
    console.log('📋 Cargando datos de demostración...');
    appState.updateProducts(getSampleProducts());
    appState.updateCategories(getDefaultCategories());
    
    updateCategoryFilter();
    filterAndRenderProducts();
    
    showNotification('🔶 Usando datos de demostración', 'warning');
};

// Datos de ejemplo
function getSampleProducts() {
    return [
        {
            id: 'demo-1',
            name: 'Diseño de Logo Profesional',
            description: 'Diseño de logo moderno y profesional para tu marca. Incluye 3 propuestas iniciales y revisiones ilimitadas.',
            category_id: 1,
            categories: { id: 1, name: 'Diseño' },
            photo_url: 'https://images.unsplash.com/photo-1567446537738-74804ee3a9bd?w=400&h=300&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 199, price_dollars: 50, features: ['1 propuesta', '2 revisiones', 'Formatos PNG/JPG'] },
                { name: 'Premium', price_soles: 399, price_dollars: 100, features: ['3 propuestas', 'Revisiones ilimitadas', 'Todos los formatos', 'Marca guía'] }
            ],
            created_at: new Date().toISOString(),
            isDemo: true
        },
        {
            id: 'demo-2', 
            name: 'Sitio Web Responsive',
            description: 'Desarrollo de sitio web moderno y responsive con diseño adaptado a todos los dispositivos.',
            category_id: 3,
            categories: { id: 3, name: 'Desarrollo' },
            photo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=300&fit=crop',
            plans: [
                { name: 'Landing Page', price_soles: 799, price_dollars: 200, features: ['Diseño responsive', 'Formulario de contacto', 'Optimización SEO'] },
                { name: 'Sitio Completo', price_soles: 1599, price_dollars: 400, features: ['Hasta 5 páginas', 'CMS integrado', 'Hosting por 1 año', 'Soporte técnico'] }
            ],
            created_at: new Date().toISOString(),
            isDemo: true
        },
        {
            id: 'demo-3', 
            name: 'Consultoría Marketing Digital',
            description: 'Estrategia personalizada de marketing digital para impulsar tu presencia online.',
            category_id: 2,
            categories: { id: 2, name: 'Marketing' },
            photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 299, price_dollars: 75, features: ['Análisis de mercado', 'Plan estratégico', '1 mes de seguimiento'] },
                { name: 'Completo', price_soles: 899, price_dollars: 225, features: ['Análisis completo', 'Plan detallado', '3 meses de seguimiento', 'Implementación guiada'] }
            ],
            created_at: new Date().toISOString(),
            isDemo: true
        }
    ];
}

function getDefaultCategories() {
    return [
        { id: 1, name: 'Diseño', created_at: new Date().toISOString(), icon: 'fas fa-paint-brush', isDemo: true },
        { id: 2, name: 'Marketing', created_at: new Date().toISOString(), icon: 'fas fa-chart-line', isDemo: true },
        { id: 3, name: 'Desarrollo', created_at: new Date().toISOString(), icon: 'fas fa-code', isDemo: true },
        { id: 4, name: 'Consultoría', created_at: new Date().toISOString(), icon: 'fas fa-handshake', isDemo: true }
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
        if (category.icon) {
            option.textContent = `${category.name}`;
        }
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
    setupKeyboardShortcuts();
};

// Configurar búsqueda y filtros
const setupSearchAndFilter = () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterAndRenderProducts();
            // Mostrar/ocultar botón de limpiar
            if (clearSearchBtn) {
                if (searchInput.value.trim()) {
                    clearSearchBtn.classList.remove('hidden');
                } else {
                    clearSearchBtn.classList.add('hidden');
                }
            }
        }, 300));
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            filterAndRenderProducts();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                clearSearchBtn.classList.add('hidden');
                filterAndRenderProducts();
            }
        });
    }
};

// Configurar navegación suave
const setupSmoothNavigation = () => {
    // Smooth scroll para enlaces internos
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                smoothScrollTo(target, 80).then(() => {
                    // Actualizar URL
                    history.pushState(null, null, targetId);
                });
            }
        }
    });
    
    // Botón de scroll to top
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollTopBtn.className = 'fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg opacity-0 transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-40';
    scrollTopBtn.style.transform = 'translateY(20px)';
    scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(scrollTopBtn);
    
    scrollTopBtn.addEventListener('click', () => {
        smoothScrollTo(document.body);
    });
    
    // Mostrar/ocultar botón según scroll
    window.addEventListener('scroll', debounce(() => {
        if (window.scrollY > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.transform = 'translateY(20px)';
        }
    }, 100));
};

// Configurar atajos de teclado
const setupKeyboardShortcuts = () => {
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
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    fadeOut(modal).then(() => modal.classList.add('hidden'));
                });
            }
        }
    });
};

// Configurar manejadores globales
const setupGlobalHandlers = () => {
    const appState = AppState.getInstance();
    
    // Recargar datos al obtener foco
    window.addEventListener('focus', async () => {
        if (appState.isInitialized && appState.isOnline) {
            await refreshData();
        }
    });

    // Manejar errores globales
    window.addEventListener('error', (e) => {
        console.error('Error no capturado:', e.error);
        showNotification('❌ Error inesperado en la aplicación', 'error');
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promesa rechazada no capturada:', e.reason);
        showNotification('❌ Error en operación asíncrona', 'error');
        e.preventDefault();
    });

    // Prevenir recarga accidental
    window.addEventListener('beforeunload', (e) => {
        if (appState.currentUser && appState.pendingActions.length > 0) {
            const message = '⚠️ Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
            e.returnValue = message;
            return message;
        }
    });
    
    // Animaciones al hacer scroll
    setupScrollAnimations();
};

// Configurar animaciones al scroll
const setupScrollAnimations = () => {
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
};

// Función para filtrar y renderizar productos
const filterAndRenderProducts = () => {
    const appState = AppState.getInstance();
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const productsGrid = document.getElementById('productsGrid');

    if (!searchInput || !categoryFilter || !productsGrid) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    // Guardar estado actual de filtros
    appState.currentFilter = { category, search: searchText };

    let filteredProducts = filterProducts(category, searchText);

    renderProductsGrid(filteredProducts, 'productsGrid');
};

// Recargar datos
export const refreshData = async () => {
    const appState = AppState.getInstance();
    
    if (!appState.isOnline) {
        showNotification('📶 No hay conexión a internet. No se pueden actualizar los datos.', 'warning');
        return;
    }

    try {
        showNotification('🔄 Actualizando datos...', 'info');
        
        const [products, categories] = await Promise.all([
            loadProducts(),
            loadCategories()
        ]);

        appState.updateProducts(products);
        appState.updateCategories(categories);

        updateCategoryFilter();
        filterAndRenderProducts();
        
        showNotification('✅ Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('❌ Error al actualizar datos', 'error');
    }
};

// Animación de entrada de la aplicación
const animateAppEntry = () => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            mainContent.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        }, 100);
    }
};

// Mostrar estado de carga
const showLoadingState = () => {
    // Eliminar cualquier estado de carga existente
    hideLoadingState();
    
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
    
    // Prevenir scrolling durante la carga
    document.body.style.overflow = 'hidden';
};

// Ocultar estado de carga
const hideLoadingState = () => {
    const loadingElements = document.querySelectorAll('.loading-state');
    loadingElements.forEach(element => {
        fadeOut(element).then(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    });
    
    // Restaurar scrolling
    document.body.style.overflow = '';
};

// Mostrar mensaje de no productos
const showNoProductsMessage = () => {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-16 fade-in-up">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500">Intenta con otros términos de búsqueda o categorías</p>
                <button class="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" onclick="document.getElementById('searchInput').value = ''; document.getElementById('categoryFilter').value = 'all'; filterAndRenderProducts()">
                    Limpiar filtros
                </button>
            </div>
        `;
    }
};

// Exportar funciones para uso global
window.filterAndRenderProducts = filterAndRenderProducts;
window.refreshData = refreshData;
window.initializeApp = initializeApp;

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
        filterAndRenderProducts();
    }
});

// Registrar el service worker para funcionalidad offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('✅ ServiceWorker registrado correctamente:', registration.scope);
        }).catch(registrationError => {
            console.log('❌ Error registrando ServiceWorker:', registrationError);
        });
    });
}
