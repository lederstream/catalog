// scripts/components/catalog-grid.js
import { showNotification, debounce, formatCurrency } from '../utils.js';

// Inicializar catálogo
export function initCatalogGrid() {
    console.log('🔄 Inicializando catálogo...');
    
    // Configurar filtros y búsqueda
    setupCatalogFilters();
    
    // Configurar animaciones de entrada para productos
    animateProductCards();
    
    console.log('✅ Catálogo inicializado');
}

// Configurar filtros del catálogo
function setupCatalogFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortSelect');

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
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filterAndRenderProducts();
        });
    }
}

// Animación de tarjetas de producto
function animateProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Filtrar y renderizar productos
export function filterAndRenderProducts() {
    try {
        // Obtener el estado de la aplicación
        const appState = window.AppState ? window.AppState.getInstance() : null;
        
        if (!appState) {
            console.error('AppState no está disponible');
            return;
        }
        
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('sortSelect');
        const productsGrid = document.getElementById('productsGrid');

        if (!searchInput || !categoryFilter || !productsGrid) return;

        const searchText = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;
        const sortBy = sortSelect ? sortSelect.value : 'name';

        // Guardar estado actual de filtros
        appState.currentFilter = { category, search: searchText, sort: sortBy };

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
                product.description.toLowerCase().includes(searchText)
            );
        }
        
        // Ordenar productos
        filteredProducts = sortProducts(filteredProducts, sortBy);

        // Renderizar productos filtrados
        renderProductsGrid(filteredProducts, 'productsGrid');
    } catch (error) {
        console.error('Error en filterAndRenderProducts:', error);
    }
}

// Ordenar productos
function sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch(sortBy) {
        case 'name':
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        case 'price-asc':
            return sortedProducts.sort((a, b) => {
                const aPrice = a.plans && a.plans.length > 0 ? 
                    (a.plans[0].price_soles || a.plans[0].price_dollars || 0) : 0;
                const bPrice = b.plans && b.plans.length > 0 ? 
                    (b.plans[0].price_soles || b.plans[0].price_dollars || 0) : 0;
                return aPrice - bPrice;
            });
        case 'price-desc':
            return sortedProducts.sort((a, b) => {
                const aPrice = a.plans && a.plans.length > 0 ? 
                    (a.plans[0].price_soles || a.plans[0].price_dollars || 0) : 0;
                const bPrice = b.plans && b.plans.length > 0 ? 
                    (b.plans[0].price_soles || b.plans[0].price_dollars || 0) : 0;
                return bPrice - aPrice;
            });
        case 'newest':
            return sortedProducts.sort((a, b) => 
                new Date(b.created_at || 0) - new Date(a.created_at || 0)
            );
        case 'oldest':
            return sortedProducts.sort((a, b) => 
                new Date(a.created_at || 0) - new Date(b.created_at || 0)
            );
        default:
            return sortedProducts;
    }
}

// Renderizar grid de productos
export function renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 animate-fade-in">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-500">No se encontraron productos</h3>
                <p class="text-gray-400 mt-2">Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group opacity-0">
            <div class="h-48 overflow-hidden relative">
                <img src="${product.photo_url}" alt="${product.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     onerror="this.src='https://images.unsplash.com/photo-1556655845-34a35b5b2015?w=300&h=200&fit=crop'">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                <div class="absolute top-3 right-3">
                    <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full shadow-md">${getCategoryName(product)}</span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                
                <div class="mb-3">
                    ${product.plans && product.plans.length > 0 ? `
                        <p class="text-sm text-gray-500 mb-1">Planes desde:</p>
                        <div class="flex items-baseline">
                            ${product.plans[0].price_soles > 0 ? `
                                <span class="text-green-600 font-bold">S/ ${formatCurrency(product.plans[0].price_soles)}</span>
                            ` : ''}
                            ${product.plans[0].price_soles > 0 && product.plans[0].price_dollars > 0 ? '<span class="text-gray-400 mx-2">|</span>' : ''}
                            ${product.plans[0].price_dollars > 0 ? `
                                <span class="text-blue-600 font-bold">$ ${formatCurrency(product.plans[0].price_dollars)}</span>
                            ` : ''}
                        </div>
                    ` : '<p class="text-gray-500 text-sm">Sin planes disponibles</p>'}
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${getCategoryName(product)}
                    </span>
                    <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center" 
                            data-product-id="${product.id}">
                        <i class="fas fa-eye mr-1"></i> Detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Animar la entrada de las tarjetas
    animateProductCards();
    
    // Agregar event listeners a los botones de ver detalles
    container.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.productId;
            if (typeof window.showProductDetails === 'function') {
                window.showProductDetails(productId);
            }
        });
    });
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

// Hacer funciones disponibles globalmente
window.initCatalogGrid = initCatalogGrid;
window.filterAndRenderProducts = filterAndRenderProducts;
window.renderProductsGrid = renderProductsGrid;
