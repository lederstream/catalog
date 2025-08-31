// scripts/app.js
import { supabase } from './supabase.js';
import { renderHeader, updateHeader } from './components/header.js';
import { initAdminPanel, setupProductForm } from './components/admin-panel.js';
import { checkAuth, initializeAuth, setupAuthEventListeners, handleAuthChange } from './auth.js';
import { loadProducts, getProducts, filterProducts as filterProductsUtil } from './products.js';
import { loadCategories, getCategories } from './categories.js';
import { initModals } from './modals.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { showNotification, debounce, getRandomId } from './utils.js';

// Variables globales para el estado de la aplicación
let allProducts = [];
let allCategories = [];
let isAppInitialized = false;
let currentFilterState = { category: 'all', search: '' };

// Inicializar la aplicación
export const initializeApp = async () => {
    if (isAppInitialized) {
        console.warn('La aplicación ya está inicializada');
        return;
    }

    try {
        showLoadingState();
        console.log('🚀 Inicializando aplicación DigitalCatalog...');

        // Renderizar componentes básicos
        renderHeader();
        initModals();

        // Cargar datos iniciales
        await loadInitialData();

        // Inicializar componentes
        initCatalogGrid();
        initializeAuthBackground();

        // Configurar event listeners globales
        setupGlobalEventListeners();

        // Finalizar inicialización
        hideLoadingState();
        isAppInitialized = true;
        
        showNotification('Catálogo cargado correctamente', 'success');
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        showNotification('Error al cargar el catálogo. Usando modo demostración.', 'error');
        loadDemoData();
        hideLoadingState();
    }
};

// Cargar datos de demostración
const loadDemoData = () => {
    console.log('📋 Cargando datos de demostración...');
    allProducts = getSampleProducts();
    allCategories = getDefaultCategories();
    
    window.getCategories = () => allCategories;
    
    updateCategoryFilter();
    if (typeof window.renderProductsGrid === 'function') {
        window.renderProductsGrid(allProducts, 'productsGrid');
    }
};

// Inicializar autenticación en segundo plano
const initializeAuthBackground = async () => {
    try {
        const dbConnected = await checkDatabaseConnection();
        if (!dbConnected) {
            showNotification('Base de datos no configurada. Usando modo demostración.', 'warning');
        }

        await initializeAuth();
        setupAuthEventListeners();

        initAdminPanel();
        setupProductForm();

    } catch (error) {
        console.error('Error en inicialización en segundo plano:', error);
    }
};

// Función de diagnóstico para verificar la base de datos
export const checkDatabaseConnection = async () => {
    try {
        console.log('🔍 Verificando conexión con la base de datos...');
        
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('count')
            .limit(1);
        
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('count')
            .limit(1);
        
        if (productsError && productsError.code === '42P01') {
            console.error('❌ La tabla products no existe en la base de datos');
            return false;
        }
        
        if (categoriesError && categoriesError.code === '42P01') {
            console.error('❌ La tabla categories no existe en la base de datos');
            return false;
        }
        
        console.log('✅ Tablas verificadas correctamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error verificando base de datos:', error);
        return false;
    }
};

// Cargar datos iniciales
const loadInitialData = async () => {
    try {
        console.log('📦 Cargando datos del catálogo...');
        
        const [productsResult, categoriesResult] = await Promise.allSettled([
            loadProducts(),
            loadCategories()
        ]);

        // Procesar resultados de productos
        if (productsResult.status === 'fulfilled') {
            allProducts = productsResult.value;
            console.log(`✅ ${allProducts.length} productos cargados`);
        } else {
            console.error('Error loading products:', productsResult.reason);
            allProducts = getSampleProducts();
            showNotification('Error al cargar productos, usando datos demo', 'error');
        }

        // Procesar resultados de categorías
        if (categoriesResult.status === 'fulfilled') {
            allCategories = categoriesResult.value;
            console.log(`✅ ${allCategories.length} categorías cargadas`);
            
            window.getCategories = () => allCategories;
        } else {
            console.error('Error loading categories:', categoriesResult.reason);
            allCategories = getDefaultCategories();
            showNotification('Error al cargar categorías, usando datos demo', 'error');
            
            window.getCategories = () => allCategories;
        }

        // Actualizar UI
        updateCategoryFilter();

        if (typeof window.renderProductsGrid === 'function') {
            window.renderProductsGrid(allProducts, 'productsGrid');
        }

    } catch (error) {
        console.error('Error loading initial data:', error);
        loadDemoData();
        showNotification('Usando datos de demostración', 'info');
    }
};

// Datos de ejemplo
function getSampleProducts() {
    return [
        {
            id: '1',
            name: 'Diseño de Logo Profesional',
            description: 'Diseño de logo moderno y profesional para tu marca',
            category: 'diseño',
            photo_url: 'https://images.unsplash.com/photo-1567446537738-74804ee3a9bd?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 199, price_dollars: 50 },
                { name: 'Premium', price_soles: 399, price_dollars: 100 }
            ]
        },
        {
            id: '2',
            name: 'Sitio Web Responsive',
            description: 'Desarrollo de sitio web moderno y adaptable',
            category: 'software',
            photo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&h=200&fit=crop',
            plans: [
                { name: 'Landing Page', price_soles: 799, price_dollars: 200 },
                { name: 'Sitio Completo', price_soles: 1599, price_dollars: 400 }
            ]
        },
        {
            id: '3',
            name: 'Campaña de Marketing Digital',
            description: 'Campaña completa de marketing para redes sociales',
            category: 'marketing',
            photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básica', price_soles: 999, price_dollars: 250 },
                { name: 'Completa', price_soles: 1999, price_dollars: 500 }
            ]
        }
    ];
}

function getDefaultCategories() {
    return [
        { id: 1, name: 'diseño' },
        { id: 2, name: 'marketing' },
        { id: 3, name: 'software' },
        { id: 4, name: 'consultoria' }
    ];
}

// Actualizar filtro de categorías
const updateCategoryFilter = () => {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const currentValue = categoryFilter.value;

    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';

    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id || category.name;
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
                
                history.pushState(null, null, targetId);
            }
        });
    });
};

// Configurar manejadores globales
const setupGlobalHandlers = () => {
    window.addEventListener('focus', async () => {
        if (isAppInitialized) {
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
};

// Función para filtrar productos
const filterProducts = () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const productsGrid = document.getElementById('productsGrid');

    if (!searchInput || !categoryFilter || !productsGrid) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    // Guardar estado actual de filtros
    currentFilterState = { category, search: searchText };

    let filteredProducts = allProducts;

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
            return (
                (product.name && product.name.toLowerCase().includes(searchText)) || 
                (product.description && product.description.toLowerCase().includes(searchText)) ||
                (categoryName && categoryName.toLowerCase().includes(searchText))
            );
        });
    }

    if (typeof window.renderProductsGrid === 'function') {
        window.renderProductsGrid(filteredProducts, 'productsGrid');
    }
};

// Recargar datos
export const refreshData = async () => {
    try {
        showNotification('Actualizando datos...', 'info');
        
        const [products, categories] = await Promise.all([
            loadProducts(),
            loadCategories()
        ]);

        allProducts = products;
        allCategories = categories;

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
    isAppInitialized = false;
    await initializeApp();
};

// Manejar cambios de autenticación
const handleAppAuthChange = async () => {
    try {
        await refreshData();
        updateHeader();
        showNotification('Sesión actualizada', 'success');
    } catch (error) {
        console.error('Error handling auth change:', error);
        showNotification('Error al actualizar sesión', 'error');
    }
};

// Función de diagnóstico
window.debugApp = async () => {
    console.log('=== 🐛 DIAGNÓSTICO DE LA APLICACIÓN ===');
    
    const { data: session } = await supabase.auth.getSession();
    console.log('Sesión:', session);
    console.log('Usuario actual:', window.getCurrentUser ? window.getCurrentUser() : null);
    
    await checkDatabaseConnection();
    
    console.log('Productos en memoria:', allProducts.length);
    console.log('Categorías en memoria:', allCategories.length);
    
    console.log('Category Filter:', document.getElementById('categoryFilter'));
    console.log('Products Grid:', document.getElementById('productsGrid'));
    console.log('Search Input:', document.getElementById('searchInput'));
    
    console.log('=== ✅ FIN DIAGNÓSTICO ===');
};

// Exportar funciones para uso global
window.filterProducts = filterProducts;
window.refreshData = refreshData;
window.reinitializeApp = reinitializeApp;
window.handleAppAuthChange = handleAppAuthChange;

// Hacer variables globales disponibles para depuración
window.appState = {
    products: allProducts,
    categories: allCategories,
    isInitialized: isAppInitialized,
    getState: () => ({
        products: allProducts,
        categories: allCategories,
        isInitialized: isAppInitialized,
        user: window.getCurrentUser ? window.getCurrentUser() : null,
        filters: currentFilterState
    })
};

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    setTimeout(initializeApp, 100);
}
