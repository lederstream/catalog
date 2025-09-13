// scripts/components/catalog-grid.js
import { Utils } from '../core/utils.js';
import { createProductCard, addProductCardEventListeners, animateProductsEntry } from './product-card.js';

class CatalogState {
    constructor() {
        this.currentView = 'grid';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filters = {
            category: 'all',
            search: '',
            priceRange: [0, 10000],
            features: []
        };
        this.currentPage = 1;
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
        this.currentPage = 1; // Reset to first page on filter change
        this._persistState();
        this._triggerEvent('filtersChanged', { filters: this.filters });
    }
    
    setPage(page) {
        if (page > 0) {
            this.currentPage = page;
            this._persistState();
            this._triggerEvent('pageChanged', { page });
        }
    }
    
    _persistState() {
        try {
            localStorage.setItem('catalogState', JSON.stringify({
                view: this.currentView,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                filters: this.filters,
                currentPage: this.currentPage
            }));
        } catch (error) {
            console.warn('Error persisting catalog state:', error);
        }
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
                this.currentPage = state.currentPage || 1;
            }
        } catch (error) {
            console.warn('Error restoring catalog state:', error);
        }
    }
    
    _triggerEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

// Configuración
const CONFIG = {
    ITEMS_PER_PAGE: 12,
    IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'
};

// Inicializar catálogo
export function initCatalogGrid() {
    const catalogState = CatalogState.getInstance();
    catalogState._restoreState();
    
    setupCatalogFilters();
    setupViewControls();
    setupSorting();
    setupScrollAnimations();
    setupPagination();
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
        searchInput.addEventListener('input', Utils.debounce((e) => {
            const searchText = e.target.value.toLowerCase().trim();
            catalogState.setFilters({ search: searchText });
            filterAndRenderProducts();
            
            if (clearSearchBtn) {
                clearSearchBtn.classList.toggle('hidden', !searchText);
            }
        }, 300));
    }
    
    // Filtro de categoría
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            catalogState.setFilters({ category: e.target.value });
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
            const isHidden = filterPanel.classList.toggle('hidden');
            filterButton.classList.toggle('bg-blue-600', !isHidden);
            filterButton.classList.toggle('bg-gray-600', isHidden);
            
            if (!isHidden) {
                Utils.fadeIn(filterPanel);
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
                
                catalogState.setFilters({ priceRange: [min, max] });
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
        const isGridView = catalogState.currentView === 'grid';
        gridViewBtn.classList.toggle('bg-blue-600', isGridView);
        gridViewBtn.classList.toggle('text-white', isGridView);
        listViewBtn.classList.toggle('bg-blue-600', !isGridView);
        listViewBtn.classList.toggle('text-white', !isGridView);
        
        // Cambiar a vista grid
        gridViewBtn.addEventListener('click', () => {
            catalogState.setView('grid');
            updateViewButtons('grid');
            filterAndRenderProducts();
        });
        
        // Cambiar a vista lista
        listViewBtn.addEventListener('click', () => {
            catalogState.setView('list');
            updateViewButtons('list');
            filterAndRenderProducts();
        });
    }
    
    function updateViewButtons(view) {
        const isGridView = view === 'grid';
        gridViewBtn.classList.toggle('bg-blue-600', isGridView);
        gridViewBtn.classList.toggle('text-white', isGridView);
        listViewBtn.classList.toggle('bg-blue-600', !isGridView);
        listViewBtn.classList.toggle('text-white', !isGridView);
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.dataset.view = view;
        }
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
        sortSelect.addEventListener('change', (e) => {
            catalogState.setSort(e.target.value, catalogState.sortOrder);
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

// Configurar paginación
function setupPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const catalogState = CatalogState.getInstance();
    
    window.addEventListener('productsFiltered', (e) => {
        const totalItems = e.detail.totalItems;
        updatePagination(totalItems);
    });
}

function updatePagination(totalItems) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const catalogState = CatalogState.getInstance();
    const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        return;
    }
    
    paginationContainer.classList.remove('hidden');
    
    let paginationHTML = '';
    const currentPage = catalogState.currentPage;
    
    // Botón anterior
    paginationHTML += `
        <button class="px-4 py-2 mx-1 border rounded-lg hover:bg-gray-50" 
                ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">
            Anterior
        </button>
    `;
    
    // Botones de página
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="px-4 py-2 mx-1 border rounded-lg ${currentPage === i ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span class="px-2 py-2">...</span>`;
        }
    }
    
    // Botón siguiente
    paginationHTML += `
        <button class="px-4 py-2 mx-1 border rounded-lg hover:bg-gray-50" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">
            Siguiente
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function updateSortOrderIcon(button, order) {
    const icon = button.querySelector('i');
    if (icon) {
        icon.className = order === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    }
}

// Configurar animaciones de scroll
function setupScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach(el => {
        observer.observe(el);
    });
}

// Filtrar y renderizar productos
export function filterAndRenderProducts() {
    try {
        const catalogState = CatalogState.getInstance();
        const appState = window.app?.state;
        
        if (!appState) {
            console.error('AppState no está disponible');
            return;
        }
        
        const { search, category, priceRange } = catalogState.filters;
        let filteredProducts = [...appState.products];

        // Filtrar por categoría
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(product => 
                product.category_id == category
            );
        }
        
        // Filtrar por búsqueda
        if (search) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(search) || 
                (product.description && product.description.toLowerCase().includes(search)) ||
                (product.categories?.name.toLowerCase().includes(search))
            );
        }
        
        // Filtrar por precio
        if (priceRange) {
            const [min, max] = priceRange;
            filteredProducts = filteredProducts.filter(product => {
                const minPrice = getProductMinPrice(product);
                return minPrice >= min && minPrice <= max && minPrice !== Infinity;
            });
        }
        
        // Ordenar productos
        filteredProducts = sortProducts(filteredProducts, catalogState.sortBy, catalogState.sortOrder);

        // Paginar productos
        const startIndex = (catalogState.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + CONFIG.ITEMS_PER_PAGE);

        // Renderizar productos
        renderProductsGrid(paginatedProducts, 'productsGrid');
        updateResultsCount(filteredProducts.length);
        
        // Disparar evento para actualizar paginación
        window.dispatchEvent(new CustomEvent('productsFiltered', { 
            detail: { totalItems: filteredProducts.length } 
        }));
        
    } catch (error) {
        console.error('Error en filterAndRenderProducts:', error);
    }
}

// Ordenar productos
function sortProducts(products, field, order = 'asc') {
    if (!Array.isArray(products)) return [];
    
    return [...products].sort((a, b) => {
        let aValue = getSortValue(a, field);
        let bValue = getSortValue(b, field);
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
    });
}

function getSortValue(product, field) {
    switch (field) {
        case 'name': return product.name?.toLowerCase() || '';
        case 'price': return getProductMinPrice(product);
        case 'category': return product.categories?.name?.toLowerCase() || '';
        case 'date': return new Date(product.created_at || 0).getTime();
        default: return product[field] || '';
    }
}

// Obtener precio mínimo de un producto
function getProductMinPrice(product) {
    if (!product.plans?.length) return Infinity;
    
    const plans = typeof product.plans === 'string' ? 
        JSON.parse(product.plans) : product.plans;
    
    return Math.min(...plans.map(plan => 
        Math.min(
            plan.price_soles || Infinity,
            plan.price_dollars || Infinity
        )
    ).filter(price => price > 0));
}

// Actualizar contador de resultados
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        resultsCount.classList.add('scale-105');
        setTimeout(() => resultsCount.classList.remove('scale-105'), 300);
    }
}

// Renderizar grid de productos
export function renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products?.length) {
        container.innerHTML = getNoProductsHTML();
        return;
    }
    
    try {
        const catalogState = CatalogState.getInstance();
        const isListView = catalogState.currentView === 'list';
        
        container.className = `grid ${isListView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`;
        container.innerHTML = products.map((product, index) => 
            createProductCard(product, isListView, index)
        ).join('');
        
        addProductCardEventListeners();
        animateProductsEntry();
        
    } catch (error) {
        console.error('Error al renderizar productos:', error);
        container.innerHTML = getErrorHTML();
    }
}

function getNoProductsHTML() {
    return `
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
}

function getErrorHTML() {
    return `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
            <p class="text-gray-600">Error al cargar los productos</p>
            <p class="text-sm text-gray-500 mt-1">Por favor, recarga la página</p>
        </div>
    `;
}

// Obtener nombre de categoría
function getCategoryName(product) {
    if (product.categories?.name) return product.categories.name;
    if (product.category_id && typeof window.getCategories === 'function') {
        try {
            const category = window.getCategories().find(cat => cat.id == product.category_id);
            return category?.name || `Categoría ${product.category_id}`;
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
        }
    }
    return product.category || 'General';
}

// Cambiar página
window.changePage = function(page) {
    const catalogState = CatalogState.getInstance();
    catalogState.setPage(page);
    filterAndRenderProducts();
    
    // Scroll to top of products
    const productsSection = document.getElementById('catalog');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Resetear filtros
window.resetFilters = function() {
    const catalogState = CatalogState.getInstance();
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    // Resetear valores UI
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
    
    catalogState.setPage(1);
    filterAndRenderProducts();
};

// Hacer funciones disponibles globalmente
window.initCatalogGrid = initCatalogGrid;
window.filterAndRenderProducts = filterAndRenderProducts;
window.renderProductsGrid = renderProductsGrid;
