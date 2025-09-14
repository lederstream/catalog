// scripts/pages/index.js
import { Utils } from '../core/utils.js';
import { getProductManager } from '../managers/product-manager.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { createProductCard, addProductCardEventListeners } from '../components/product-card.js';

class IndexPage {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filteredProducts = [];
        this.currentFilter = {
            category: 'all',
            search: ''
        };
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderProducts();
            console.log('✅ IndexPage inicializada correctamente');
        } catch (error) {
            console.error('Error inicializando IndexPage:', error);
            this.showErrorState();
        }
    }

    async loadData() {
        try {
            // Mostrar estado de carga
            document.getElementById('productsGrid').innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="loading-spinner mx-auto mb-3"></div>
                    <p class="text-gray-500">Cargando productos...</p>
                </div>
            `;

            // Cargar productos y categorías
            const [productManager, categoryManager] = await Promise.all([
                getProductManager(),
                getCategoryManager()
            ]);

            this.products = productManager.getProducts();
            this.categories = categoryManager.getCategories();

            // Actualizar filtro de categorías
            this.updateCategoryFilter();

        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Limpiar opciones excepto la primera
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }

        // Añadir categorías
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    setupEventListeners() {
        // Filtro de categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilter.category = e.target.value;
                this.filterProducts();
                this.renderProducts();
            });
        }

        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilter.search = e.target.value.toLowerCase();
                this.filterProducts();
                this.renderProducts();
            }, 300));
        }
    }

    filterProducts() {
        this.filteredProducts = [...this.products];
        
        // Aplicar filtro de categoría
        if (this.currentFilter.category !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(product => 
                product.category_id == this.currentFilter.category
            );
        }
        
        // Aplicar filtro de búsqueda
        if (this.currentFilter.search) {
            this.filteredProducts = this.filteredProducts.filter(product => 
                product.name.toLowerCase().includes(this.currentFilter.search) || 
                (product.description && product.description.toLowerCase().includes(this.currentFilter.search))
            );
        }
    }

    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        // Mostrar mensaje si no hay productos
        if (this.filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                    <p class="text-gray-500 mb-4">Intenta con otros términos de búsqueda o categorías</p>
                    <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                            onclick="window.indexPage.resetFilters()">
                        <i class="fas fa-refresh mr-2"></i>
                        Limpiar filtros
                    </button>
                </div>
            `;
            return;
        }

        // Renderizar productos
        container.innerHTML = this.filteredProducts
            .map((product, index) => createProductCard(product, false, index))
            .join('');
        
        // Configurar event listeners para los productos
        addProductCardEventListeners();
    }

    resetFilters() {
        this.currentFilter = {
            category: 'all',
            search: ''
        };
        
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (categoryFilter) categoryFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        
        this.filterProducts();
        this.renderProducts();
    }

    showErrorState() {
        const container = document.getElementById('productsGrid');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">Error al cargar los productos</h3>
                    <p class="text-gray-500 mb-4">Por favor, intenta recargar la página</p>
                    <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" 
                            onclick="window.location.reload()">
                        <i class="fas fa-refresh mr-2"></i>
                        Recargar página
                    </button>
                </div>
            `;
        }
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.indexPage = new IndexPage();
    await window.indexPage.init();
});

// Hacer la función resetFilters disponible globalmente
window.resetFilters = function() {
    if (window.indexPage) {
        window.indexPage.resetFilters();
    }
};
