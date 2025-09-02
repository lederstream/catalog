// scripts/components/catalog-grid.js
import { showNotification } from '../utils.js';

// Inicializar catálogo
export function initCatalogGrid() {
    console.log('🔄 Inicializando catálogo...');
    
    // Configurar filtros y búsqueda
    setupCatalogFilters();
    
    console.log('✅ Catálogo inicializado');
}

// Configurar filtros del catálogo
function setupCatalogFilters() {
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
}

// Función debounce para optimizar búsquedas
function debounce(func, wait) {
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
        
        if (!appState) {
            console.error('AppState no está disponible');
            return;
        }
        
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const productsGrid = document.getElementById('productsGrid');

        if (!searchInput || !categoryFilter || !productsGrid) return;

        const searchText = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;

        // Guardar estado actual de filtros
        appState.currentFilter = { category, search: searchText };

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

        // Renderizar productos filtrados
        renderProductsGrid(filteredProducts, 'productsGrid');
    } catch (error) {
        console.error('Error en filterAndRenderProducts:', error);
    }
}

// Renderizar grid de productos
export function renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-500">No se encontraron productos</h3>
                <p class="text-gray-400 mt-2">Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div class="h-48 overflow-hidden">
                <img src="${product.photo_url}" alt="${product.name}" 
                     class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                     onerror="this.src='https://images.unsplash.com/photo-1556655845-34a35b5b2015?w=300&h=200&fit=crop'">
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                
                <div class="mb-3">
                    ${product.plans && product.plans.length > 0 ? `
                        <p class="text-sm text-gray-500 mb-1">Planes desde:</p>
                        <div class="flex items-baseline">
                            ${product.plans[0].price_soles > 0 ? `
                                <span class="text-green-600 font-bold">S/ ${product.plans[0].price_soles}</span>
                            ` : ''}
                            ${product.plans[0].price_soles > 0 && product.plans[0].price_dollars > 0 ? '<span class="text-gray-400 mx-2">|</span>' : ''}
                            ${product.plans[0].price_dollars > 0 ? `
                                <span class="text-blue-600 font-bold">$ ${product.plans[0].price_dollars}</span>
                            ` : ''}
                        </div>
                    ` : '<p class="text-gray-500 text-sm">Sin planes disponibles</p>'}
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${product.categories ? product.categories.name : 'Sin categoría'}
                    </span>
                    <button class="view-details-btn text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200" 
                            data-product-id="${product.id}">
                        Ver detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');

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

// Hacer funciones disponibles globalmente
window.initCatalogGrid = initCatalogGrid;
window.filterAndRenderProducts = filterAndRenderProducts;
window.renderProductsGrid = renderProductsGrid;
