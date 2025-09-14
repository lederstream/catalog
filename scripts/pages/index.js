// scripts/pages/index.js
import { Utils } from '../core/utils.js';
import { getProductManager } from '../managers/product-manager.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { createProductCard, addProductCardEventListeners } from '../components/product-card.js';

class IndexPage {
    constructor() {
        this.isInitialized = false;
        this.state = {
            products: [],
            categories: [],
            currentFilter: { category: 'all', search: '' }
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.showLoadingState();
            
            // Inicializar managers
            await this.initializeManagers();
            
            // Cargar datos
            await this.loadData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error inicializando página de inicio:', error);
            Utils.showError('Error al cargar la página');
            this.showErrorState();
        }
    }

    async initializeManagers() {
        window.categoryManager = await getCategoryManager();
        window.productManager = await getProductManager();
    }

    async loadData() {
        try {
            Utils.showInfo('🔄 Cargando catálogo...');
            
            const [categories, products] = await Promise.all([
                window.categoryManager.loadCategories(),
                window.productManager.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            
            this.updateCategoryFilter();
            this.renderProducts();
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            Utils.showError('Error al cargar el catálogo');
            this.showErrorState();
        }
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;
        
        categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
        
        this.state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        const filteredProducts = this.filterProducts();
        
        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = this.getNoProductsHTML();
            return;
        }
        
        productsGrid.innerHTML = filteredProducts.map((product, index) => 
            createProductCard(product, false, index)
        ).join('');
        
        addProductCardEventListeners();
    }

    filterProducts() {
        let filtered = [...this.state.products];
        
        // Filtrar por categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categoryFilter.value !== 'all') {
            filtered = filtered.filter(product => 
                product.category_id == categoryFilter.value
            );
        }
        
        // Filtrar por búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        return filtered;
    }

    setupEventListeners() {
        // Filtro de categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.renderProducts());
        }
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => this.renderProducts(), 300));
        }
    }

    showLoadingState() {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="text-center py-12 col-span-full">
                    <div class="loading-spinner inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 text-gray-600">Cargando productos...</p>
                </div>
            `;
        }
    }

    showErrorState() {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="text-center py-12 col-span-full">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                    <p class="text-gray-600">Error al cargar los productos</p>
                    <button class="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                            onclick="window.location.reload()">
                        Recargar página
                    </button>
                </div>
            `;
        }
    }

    getNoProductsHTML() {
        return `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                        onclick="window.resetFilters()">
                    Limpiar filtros
                </button>
            </div>
        `;
    }
}

// Función global para resetear filtros
window.resetFilters = function() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) categoryFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    if (window.indexPage) window.indexPage.renderProducts();
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    window.indexPage = new IndexPage();
    await window.indexPage.initialize();
});
