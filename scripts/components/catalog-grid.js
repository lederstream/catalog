// scripts/components/catalog-grid.js
import { debounce, showNotification } from '../utils.js';
import { loadProducts, filterProducts, renderProductsGrid } from '../products.js';

// Inicializar grid del catálogo
export function initCatalogGrid() {
    console.log('🔄 Inicializando catálogo...');
    
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');

    if (!categoryFilter || !searchInput) {
        console.error('Elementos del catálogo no encontrados');
        return;
    }

    // Event listeners para filtros
    categoryFilter.addEventListener('change', () => {
        filterAndRenderProducts();
    });

    searchInput.addEventListener('input', debounce(() => {
        filterAndRenderProducts();
    }, 300));
}

// Función para filtrar y renderizar productos
export function filterAndRenderProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');

    if (!categoryFilter || !searchInput || !productsGrid) return;

    const categoryId = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Obtener productos desde el estado global de la aplicación
    const appState = window.appState.getInstance();
    if (!appState || !appState.products) {
        console.error('No se pudo acceder al estado de la aplicación.');
        return;
    }

    const filteredProducts = filterProducts(appState.products, categoryId, searchTerm);
    renderProductsGrid(filteredProducts, 'productsGrid');

    if (filteredProducts.length === 0) {
        showNoProductsMessage();
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
