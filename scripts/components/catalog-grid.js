// scripts/components/catalog-grid.js
import { filterProducts } from '../products.js';
import { renderProductsGrid } from '../products.js';

// Inicializar grid del catálogo
export function initCatalogGrid() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');

    if (!categoryFilter || !searchInput || !productsGrid) return;

    // Cargar y renderizar productos
    if (typeof window.loadPublicProducts === 'function') {
        window.loadPublicProducts();
    }

    // Event listeners para filtros
    categoryFilter.addEventListener('change', () => {
        filterAndRenderProducts();
    });

    searchInput.addEventListener('input', () => {
        filterAndRenderProducts();
    });
}

// Filtrar y renderizar productos
function filterAndRenderProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');

    if (!categoryFilter || !searchInput || !productsGrid) return;

    const categoryId = categoryFilter.value;
    const searchTerm = searchInput.value;

    if (typeof window.filterProducts === 'function' && typeof window.renderProductsGrid === 'function') {
        const filteredProducts = window.filterProducts(categoryId, searchTerm);
        window.renderProductsGrid(filteredProducts, productsGrid);
    }
}