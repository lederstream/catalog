import { 
    showNotification, 
    debounce, // Esta importación está bien
    fadeIn, 
    observeElementIntersection,
    smoothScrollTo
} from '../utils.js';

// Estado del catálogo
class CatalogState {
    constructor() {
        this.currentView = 'grid'; // grid or list
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filters = {
            category: 'all',
            search: '',
            priceRange: [0, 10000],
            features: []
        };
    }
    
    static getInstance() {
        if (!CatalogState.instance) {
            CatalogState.instance = new CatalogState();
        }
        return CatalogState.instance;
    }
    
    setView(view) {
        if (['grid', 'list'].includes(view)) {
            this.currentView = view;
            this._persistState();
            this._triggerEvent('viewChanged', { view });
        }
    }
    
    setSort(field, order = 'asc') {
        this.sortBy = field;
        this.sortOrder = order;
        this._persistState();
        this._triggerEvent('sortChanged', { field, order });
    }
    
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this._persistState();
        this._triggerEvent('filtersChanged', { filters: this.filters });
    }
    
    _persistState() {
        localStorage.setItem('catalogState', JSON.stringify({
            view: this.currentView,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder,
            filters: this.filters
        }));
    }
    
    _restoreState() {
        try {
            const savedState = localStorage.getItem('catalogState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.currentView = state.view || 'grid';
                this.sortBy = state.sortBy || 'name';
                this.sortOrder = state.sortOrder || 'asc';
                this.filters = state.filters || {
                    category: 'all',
                    search: '',
                    priceRange: [0, 10000],
                    features: []
                };
            }
        } catch (error) {
            console.warn('Error restoring catalog state:', error);
        }
    }
    
    _triggerEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

// Inicializar catálogo
export function initCatalogGrid() {
    console.log('🔄 Inicializando catálogo...');
    
    const catalogState = CatalogState.getInstance();
    catalogState._restoreState();
    
    // Configurar filtros y búsqueda
    setupCatalogFilters();
    
    // Configurar controles de vista
    setupViewControls();
    
    // Configurar ordenamiento
    setupSorting();
    
    // Configurar animaciones de scroll
    setupScrollAnimations();
    
    console.log('✅ Catálogo inicializado');
}

// Configurar filtros del catálogo
function setupCatalogFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const filterButton = document.getElementById('filterButton');
    const filterPanel = document.getElementById('filterPanel');

    const catalogState = CatalogState.getInstance();
    
    // Restaurar valores
    if (searchInput && catalogState.filters.search) {
        searchInput.value = catalogState.filters.search;
    }
    
    if (categoryFilter && catalogState.filters.category) {
        categoryFilter.value = catalogState.filters.category;
    }
    
    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const searchText = searchInput.value.toLowerCase().trim();
            catalogState.setFilters({ search: searchText });
            filterAndRenderProducts();
            
            // Mostrar/ocultar botón de limpiar
            if (clearSearchBtn) {
                if (searchText) {
                    clearSearchBtn.classList.remove('hidden');
                } else {
                    clearSearchBtn.classList.add('hidden');
                }
            }
        }, 300));
    }
    
    // Filtro de categoría
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            catalogState.setFilters({ category: categoryFilter.value });
            filterAndRenderProducts();
        });
    }
    
    // Botón de limpiar búsqueda
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                catalogState.setFilters({ search: '' });
                filterAndRenderProducts();
                clearSearchBtn.classList.add('hidden');
            }
        });
    }
    
    // Panel de filtros avanzados
    if (filterButton && filterPanel) {
        filterButton.addEventListener('click', () => {
            filterPanel.classList.toggle('hidden');
            filterButton.classList.toggle('bg-blue-600');
            filterButton.classList.toggle('bg-gray-600');
            
            if (!filterPanel.classList.contains('hidden')) {
                fadeIn(filterPanel);
            }
        });
        
        // Configurar filtros de precio
        const priceMin = document.getElementById('priceMin');
        const priceMax = document.getElementById('priceMax');
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        
        if (priceMin && priceMax && applyFiltersBtn) {
            // Restaurar valores
            if (catalogState.filters.priceRange) {
                priceMin.value = catalogState.filters.priceRange[0];
                priceMax.value = catalogState.filters.priceRange[1];
            }
            
            applyFiltersBtn.addEventListener('click', () => {
                const min = parseFloat(priceMin.value) || 0;
                const max = parseFloat(priceMax.value) || 10000;
                
                catalogState.setFilters({ 
                    priceRange: [min, max] 
                });
                
                filterAndRenderProducts();
                filterPanel.classList.add('hidden');
                filterButton.classList.remove('bg-blue-600');
                filterButton.classList.add('bg-gray-600');
            });
        }
    }
}

// Configurar controles de vista
function setupViewControls() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const productsGrid = document.getElementById('productsGrid');
    
    const catalogState = CatalogState.getInstance();
    
    // Aplicar vista guardada
    if (productsGrid) {
        productsGrid.dataset.view = catalogState.currentView;
    }
    
    if (gridViewBtn && listViewBtn) {
        // Actualizar estado de botones
        if (catalogState.currentView === 'grid') {
            gridViewBtn.classList.add('bg-blue-600', 'text-white');
            listViewBtn.classList.remove('bg-blue-600', 'text-white');
        } else {
            listViewBtn.classList.add('bg-blue-600', 'text-white');
            gridViewBtn.classList.remove('bg-blue-600', 'text-white');
        }
        
        // Cambiar a vista grid
        gridViewBtn.addEventListener('click', () => {
            catalogState.setView('grid');
            productsGrid.dataset.view = 'grid';
            
            gridViewBtn.classList.add('bg-blue-600', 'text-white');
            listViewBtn.classList.remove('bg-blue-600', 'text-white');
            
            filterAndRenderProducts();
        });
        
        // Cambiar a vista lista
        listViewBtn.addEventListener('click', () => {
            catalogState.setView('list');
            productsGrid.dataset.view = 'list';
            
            listViewBtn.classList.add('bg-blue-600', 'text-white');
            gridViewBtn.classList.remove('bg-blue-600', 'text-white');
            
            filterAndRenderProducts();
        });
    }
}

// Configurar ordenamiento
function setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    const sortOrderBtn = document.getElementById('sortOrderBtn');
    
    const catalogState = CatalogState.getInstance();
    
    if (sortSelect && sortOrderBtn) {
        // Restaurar valores
        sortSelect.value = catalogState.sortBy;
        updateSortOrderIcon(sortOrderBtn, catalogState.sortOrder);
        
        // Cambiar campo de ordenamiento
        sortSelect.addEventListener('change', () => {
            catalogState.setSort(sortSelect.value, catalogState.sortOrder);
            filterAndRenderProducts();
        });
        
        // Cambiar orden
        sortOrderBtn.addEventListener('click', () => {
            const newOrder = catalogState.sortOrder === 'asc' ? 'desc' : 'asc';
            catalogState.setSort(catalogState.sortBy, newOrder);
            updateSortOrderIcon(sortOrderBtn, newOrder);
            filterAndRenderProducts();
        });
    }
}

// Actualizar icono de ordenamiento
function updateSortOrderIcon(button, order) {
    if (order === 'asc') {
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    } else {
        button.innerHTML = '<i class="fas fa-arrow-down"></i>';
    }
}

// Configurar animaciones de scroll
function setupScrollAnimations() {
    // Animación para elementos que entran en vista
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
    
    if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(el => observer.observe(el));
    }
    
    // Animación para cards de productos
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        observeElementIntersection(card, (isIntersecting) => {
            if (isIntersecting) {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        }, { threshold: 0.1 });
    });
}

// Función debounce para optimizar búsquedas (RENOMBRADA para evitar conflicto)
function catalogDebounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filtrar y renderizar productos
export function filterAndRenderProducts() {
    try {
        // Obtener el estado de la aplicación
        const appState = window.AppState ? window.AppState.getInstance() : null;
        const catalogState = CatalogState.getInstance();
        
        if (!appState) {
            console.error('AppState no está disponible');
            return;
        }
        
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const productsGrid = document.getElementById('productsGrid');

        if (!searchInput || !categoryFilter || !productsGrid) return;

        const searchText = catalogState.filters.search;
        const category = catalogState.filters.category;

        // Filtrar productos
        let filteredProducts = appState.products;
        
        // Filtrar por categoría
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(product => 
                product.category_id == category
            );
        }
        
        // Filtrar por búsqueda
        if (searchText) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchText) || 
                (product.description && product.description.toLowerCase().includes(searchText)) ||
                (product.categories && product.categories.name.toLowerCase().includes(searchText))
            );
        }
        
        // Filtrar por precio
        if (catalogState.filters.priceRange) {
            const [min, max] = catalogState.filters.priceRange;
            filteredProducts = filteredProducts.filter(product => {
                if (!product.plans || product.plans.length === 0) return false;
                
                const minPrice = Math.min(
                    ...product.plans.map(plan => 
                        Math.min(
                            plan.price_soles || Infinity,
                            plan.price_dollars || Infinity
                        )
                    ).filter(price => price > 0)
                );
                
                return minPrice >= min && minPrice <= max;
            });
        }
        
        // Ordenar productos
        filteredProducts = sortProducts(filteredProducts, catalogState.sortBy, catalogState.sortOrder);

        // Renderizar productos filtrados
        renderProductsGrid(filteredProducts, 'productsGrid');
        
        // Actualizar contador de resultados
        updateResultsCount(filteredProducts.length);
        
    } catch (error) {
        console.error('Error en filterAndRenderProducts:', error);
    }
}

// Ordenar productos
function sortProducts(products, field, order = 'asc') {
    if (!products || !Array.isArray(products)) return [];
    
    return [...products].sort((a, b) => {
        let aValue, bValue;
        
        switch (field) {
            case 'name':
                aValue = a.name ? a.name.toLowerCase() : '';
                bValue = b.name ? b.name.toLowerCase() : '';
                break;
                
            case 'price':
                aValue = getProductMinPrice(a);
                bValue = getProductMinPrice(b);
                break;
                
            case 'category':
                aValue = a.categories ? a.categories.name.toLowerCase() : '';
                bValue = b.categories ? b.categories.name.toLowerCase() : '';
                break;
                
            case 'date':
                aValue = new Date(a.created_at || 0);
                bValue = new Date(b.created_at || 0);
                break;
                
            default:
                aValue = a[field] || '';
                bValue = b[field] || '';
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return order === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

// Obtener precio mínimo de un producto
function getProductMinPrice(product) {
    if (!product.plans || product.plans.length === 0) return Infinity;
    
    return Math.min(
        ...product.plans.map(plan => 
            Math.min(
                plan.price_soles || Infinity,
                plan.price_dollars || Infinity
            )
        ).filter(price => price > 0)
    );
}

// Actualizar contador de resultados
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        
        // Animación
        resultsCount.classList.add('scale-105');
        setTimeout(() => {
            resultsCount.classList.remove('scale-105');
        }, 300);
    }
}

// Renderizar grid de productos
export function renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    const catalogState = CatalogState.getInstance();
    
    if (!container) {
        console.error(`Contenedor con ID ${containerId} no encontrado`);
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16 fade-in-up">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500 mb-4">Intenta con otros términos de búsqueda o categorías</p>
                <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                        onclick="resetFilters()">
                    <i class="fas fa-refresh mr-2"></i>
                    Limpiar filtros
                </button>
            </div>
        `;
        return;
    }
    
    try {
        // Determinar la vista actual
        const isListView = catalogState.currentView === 'list';
        const gridClass = isListView 
            ? 'grid-cols-1' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        
        container.className = `grid ${gridClass} gap-6`;
        
        // Renderizar productos
        container.innerHTML = products.map((product, index) => 
            createProductCard(product, isListView, index)
        ).join('');
        
        // Configurar event listeners
        addProductCardEventListeners();
        
        // Animación de entrada
        animateProductsEntry();
        
    } catch (error) {
        console.error('Error al renderizar productos:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                <p class="text-gray-600">Error al cargar los productos</p>
                <p class="text-sm text-gray-500 mt-1">Por favor, recarga la página</p>
            </div>
        `;
    }
}

// Crear tarjeta de producto
function createProductCard(product, isListView = false, index = 0) {
    const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
    const categoryName = getCategoryName(product);
    const minPrice = getProductMinPrice(product);
    
    if (isListView) {
        // Vista de lista
        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row opacity-0 translate-y-4" 
                 style="animation-delay: ${index * 50}ms"
                 data-product-id="${product.id}">
                <div class="md:w-48 h-48 bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src="${imageUrl}" alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                </div>
                
                <div class="flex-1 p-6 flex flex-col">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold text-gray-800">${product.name}</h3>
                        <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            ${categoryName}
                        </span>
                    </div>
                    
                    <p class="text-gray-600 mb-4 flex-1">${product.description || 'Sin descripción'}</p>
                    
                    <div class="mb-4">
                        <h4 class="font-medium text-gray-700 mb-2">Planes disponibles:</h4>
                        <div class="space-y-2">
                            ${renderPlansList(product.plans)}
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <div class="text-lg font-bold text-blue-600">
                            Desde ${formatCurrency(minPrice)}
                        </div>
                        <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center">
                            <i class="fas fa-eye mr-2"></i>
                            Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Vista de grid
        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col opacity-0 translate-y-4" 
                 style="animation-delay: ${index * 50}ms"
                 data-product-id="${product.id}">
                <div class="h-48 bg-gray-100 overflow-hidden relative">
                    <img src="${imageUrl}" alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                    <div class="absolute top-3 right-3">
                        <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            ${categoryName}
                        </span>
                    </div>
                </div>
                
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">${product.description || 'Sin descripción'}</p>
                    
                    <div class="mb-4">
                        <div class="text-sm text-gray-500 mb-1">Desde:</div>
                        <div class="text-xl font-bold text-blue-600">
                            ${formatCurrency(minPrice)}
                        </div>
                    </div>
                    
                    <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center group/btn">
                        <i class="fas fa-eye mr-2 group-hover/btn:animate-bounce"></i>
                        Ver detalles
                    </button>
                </div>
            </div>
        `;
    }
}

// Renderizar lista de planes
function renderPlansList(plans) {
    if (!plans || plans.length === 0) {
        return '<span class="text-gray-500 text-sm">No hay planes disponibles</span>';
    }
    
    // Mostrar máximo 3 planes
    const visiblePlans = plans.slice(0, 3);
    const hiddenPlansCount = plans.length - 3;
    
    return visiblePlans.map(plan => `
        <div class="flex justify-between items-center py-1">
            <span class="text-sm font-medium">${plan.name}</span>
            <div class="text-right">
                ${plan.price_soles ? `<div class="text-green-600 font-bold">S/ ${plan.price_soles}</div>` : ''}
                ${plan.price_dollars ? `<div class="text-blue-600 text-sm">$ ${plan.price_dollars}</div>` : ''}
            </div>
        </div>
    `).join('') + (hiddenPlansCount > 0 ? 
        `<div class="text-xs text-gray-500 mt-1">+${hiddenPlansCount} plan(s) más</div>` : ''
    );
}

// Formatear moneda
function formatCurrency(amount) {
    if (amount === Infinity || isNaN(amount)) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', { 
        style: 'currency', 
        currency: 'PEN',
        minimumFractionDigits: 2
    }).format(amount);
}

// Obtener nombre de categoría
function getCategoryName(product) {
    if (product.categories && product.categories.name) {
        return product.categories.name;
    }
    if (product.category_id && typeof window.getCategories === 'function') {
        try {
            const categories = window.getCategories();
            if (categories && Array.isArray(categories)) {
                const category = categories.find(cat => cat.id == product.category_id);
                return category ? category.name : `Categoría ${product.category_id}`;
            }
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
        }
    }
    if (product.category) {
        return product.category;
    }
    return 'General';
}

// Añadir event listeners a las tarjetas
function addProductCardEventListeners() {
    // Botones de ver detalles
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.currentTarget.closest('.product-card').getAttribute('data-product-id');
            if (productId && typeof window.showProductDetails === 'function') {
                // Efecto de clic
                btn.classList.add('scale-95');
                setTimeout(() => btn.classList.remove('scale-95'), 150);
                
                window.showProductDetails(productId);
            }
        });
    });
    
    // Hacer toda la tarjeta clickeable en móviles
    if (window.innerWidth < 768) {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // No activar si se hizo clic en un botón o enlace
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button, a')) {
                    return;
                }
                
                const productId = card.getAttribute('data-product-id');
                if (productId && typeof window.showProductDetails === 'function') {
                    window.showProductDetails(productId);
                }
            });
        });
    }
}

// Animación de entrada de productos
function animateProductsEntry() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        }, index * 50);
    });
}

// Resetear filtros
window.resetFilters = function() {
    const catalogState = CatalogState.getInstance();
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    // Resetear valores
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (priceMin) priceMin.value = '0';
    if (priceMax) priceMax.value = '10000';
    if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
    
    // Resetear estado
    catalogState.setFilters({
        category: 'all',
        search: '',
        priceRange: [0, 10000],
        features: []
    });
    
    // Re-renderizar
    filterAndRenderProducts();
};

// Hacer funciones disponibles globalmente
window.initCatalogGrid = initCatalogGrid;
window.filterAndRenderProducts = filterAndRenderProducts;
window.renderProductsGrid = renderProductsGrid;
