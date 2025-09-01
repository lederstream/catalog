// scripts/components/catalog-grid.js
import { showNotification } from '../utils.js';

// Inicializar grid del catálogo
export function initCatalogGrid() {
    console.log('🔄 Inicializando catálogo...');
    
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');

    if (!categoryFilter || !searchInput || !productsGrid) {
        console.error('Elementos del catálogo no encontrados');
        return;
    }

    // Cargar y renderizar productos
    loadAndRenderProducts();

    // Event listeners para filtros
    categoryFilter.addEventListener('change', () => {
        filterAndRenderProducts();
    });

    searchInput.addEventListener('input', debounce(() => {
        filterAndRenderProducts();
    }, 300));
}

// Cargar y renderizar productos
export async function loadAndRenderProducts() {
    try {
        if (typeof window.loadProducts === 'function') {
            const products = await window.loadProducts();
            if (products && products.length > 0) {
                if (typeof window.renderProductsGrid === 'function') {
                    window.renderProductsGrid(products, 'productsGrid');
                } else {
                    console.error('renderProductsGrid function not available');
                    showNoProductsMessage();
                }
            } else {
                showNoProductsMessage();
            }
        } else {
            console.error('loadProducts function not available');
            showNoProductsMessage();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNoProductsMessage();
    }
}

// Filtrar y renderizar productos
export function filterAndRenderProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');

    if (!categoryFilter || !searchInput || !productsGrid) return;

    const categoryId = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (typeof window.filterProducts === 'function' && typeof window.renderProductsGrid === 'function') {
        const filteredProducts = window.filterProducts(categoryId, searchTerm);
        window.renderProductsGrid(filteredProducts, 'productsGrid');
    } else {
        console.error('filterProducts or renderProductsGrid functions not available');
    }
}

// Mostrar mensaje de no productos
function showNoProductsMessage() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-box-open fa-3x text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No hay productos disponibles</p>
                <p class="text-sm text-gray-400">Agrega productos desde el panel de administración</p>
            </div>
        `;
    }
}

// Función debounce simple
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

// Hacer funciones disponibles globalmente
window.initCatalogGrid = initCatalogGrid;
window.loadAndRenderProducts = loadAndRenderProducts;
window.filterAndRenderProducts = filterAndRenderProducts;
