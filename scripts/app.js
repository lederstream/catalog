// scripts/app.js
import { supabase } from './supabase.js';
import { renderHeader, updateHeader } from './components/header.js';
import { renderProductsGrid } from './components/product-card.js';
import { initAdminPanel, setupProductForm } from './components/admin-panel.js';
import { checkAuth, initializeAuth, setupAuthEventListeners, handleAuthChange } from './auth.js';
import { loadProducts, getProducts, filterProducts as filterProductsUtil } from './products.js';
import { loadCategories, getCategories } from './categories.js';
import { initModals } from './modals.js';
import { initCatalogGrid } from './components/catalog-grid.js';
import { showNotification, debounce } from './utils.js';

// Variables globales
let allProducts = [];
let allCategories = [];
let isAppInitialized = false;

// Inicializar la aplicación
export const initializeApp = async () => {
    if (isAppInitialized) {
        console.warn('La aplicación ya está inicializada');
        return;
    }

    try {
        // Mostrar estado de carga
        showLoadingState();

        // 1. Renderizar componentes estáticos
        renderHeader();
        initAdminPanel();
        setupProductForm();
        initModals();

        // 2. Inicializar autenticación
        await initializeAuth();
        setupAuthEventListeners();

        // 3. Cargar datos iniciales
        await loadInitialData();

        // 4. Configurar event listeners globales
        setupGlobalEventListeners();

        // 5. Inicializar componentes específicos
        initCatalogGrid();

        // 6. Ocultar estado de carga
        hideLoadingState();

        isAppInitialized = true;
        
        showNotification('Aplicación cargada correctamente', 'success');
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al cargar la aplicación', 'error');
        hideLoadingState();
    }
};

// Cargar datos iniciales
const loadInitialData = async () => {
    try {
        // Cargar en paralelo pero manejar errores individualmente
        const [productsResult, categoriesResult] = await Promise.allSettled([
            loadProducts(),
            loadCategories()
        ]);

        // Manejar resultados
        if (productsResult.status === 'fulfilled') {
            allProducts = productsResult.value;
        } else {
            console.error('Error loading products:', productsResult.reason);
            allProducts = [];
            showNotification('Error al cargar productos', 'error');
        }

        if (categoriesResult.status === 'fulfilled') {
            allCategories = categoriesResult.value;
        } else {
            console.error('Error loading categories:', categoriesResult.reason);
            allCategories = getDefaultCategories();
            showNotification('Error al cargar categorías', 'error');
        }

        // Actualizar filtro de categorías
        updateCategoryFilter();

        // Renderizar productos
        renderProductsGrid(allProducts, 'productsGrid');

    } catch (error) {
        console.error('Error loading initial data:', error);
        // Usar datos de ejemplo en caso de error crítico
        allProducts = getSampleProducts();
        allCategories = getDefaultCategories();
        updateCategoryFilter();
        renderProductsGrid(allProducts, 'productsGrid');
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

    // Guardar selección actual
    const currentValue = categoryFilter.value;

    // Limpiar opciones excepto "Todas las categorías"
    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';

    // Agregar categorías
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id || category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });

    // Restaurar selección si existe
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
                
                // Actualizar URL
                history.pushState(null, null, targetId);
            }
        });
    });
};

// Configurar manejadores globales
const setupGlobalHandlers = () => {
    // Recargar datos cuando se hace focus en la ventana
    window.addEventListener('focus', async () => {
        if (isAppInitialized) {
            await refreshData();
        }
    });

    // Manejar errores no capturados
    window.addEventListener('error', (e) => {
        console.error('Error no capturado:', e.error);
        showNotification('Error inesperado en la aplicación', 'error');
    });

    // Manejar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promesa rechazada no capturada:', e.reason);
        showNotification('Error en operación asíncrona', 'error');
        e.preventDefault();
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

    let filteredProducts = allProducts;

    // Filtrar por categoría
    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
            product.category_id == category || 
            product.category === category ||
            (product.category && product.category.toLowerCase() === category.toLowerCase())
        );
    }

    // Filtrar por texto de búsqueda
    if (searchText) {
        filteredProducts = filteredProducts.filter(product => 
            (product.name && product.name.toLowerCase().includes(searchText)) || 
            (product.description && product.description.toLowerCase().includes(searchText)) ||
            (product.category && product.category.toLowerCase().includes(searchText))
        );
    }

    // Renderizar productos filtrados
    renderProductsGrid(filteredProducts, 'productsGrid');
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
        filterProducts(); // Re-aplicar filtros actuales
        
        showNotification('Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('Error al actualizar datos', 'error');
    }
};

// Mostrar estado de carga
const showLoadingState = () => {
    const loadingElements = document.querySelectorAll('.loading-spinner, .loading-state');
    loadingElements.forEach(element => {
        element.classList.remove('hidden');
    });
};

// Ocultar estado de carga
const hideLoadingState = () => {
    const loadingElements = document.querySelectorAll('.loading-spinner, .loading-state');
    loadingElements.forEach(element => {
        element.classList.add('hidden');
    });
};

// Función para reinicializar la aplicación
export const reinitializeApp = async () => {
    isAppInitialized = false;
    await initializeApp();
};

// Exportar funciones para uso global
window.filterProducts = filterProducts;
window.refreshData = refreshData;
window.reinitializeApp = reinitializeApp;
window.handleAuthChange = handleAuthChange;

// Hacer variables globales disponibles para depuración
window.appState = {
    products: allProducts,
    categories: allCategories,
    isInitialized: isAppInitialized
};

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Exportar para tests
export { allProducts, allCategories, isAppInitialized };
