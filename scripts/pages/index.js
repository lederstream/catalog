// scripts/pages/index.js
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';
import { ProductCard } from '../components/product-card.js';
import { Utils } from '../core/utils.js';

class IndexPage {
    constructor() {
        this.currentFilters = {
            category: '',
            search: '',
            sort: 'newest'
        };
        this.currentPage = 1;
        this.isLoading = false;
        
        // Bind methods
        this.applyFilters = this.applyFilters.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleCategoryChange = this.handleCategoryChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
    }

    async init() {
        try {
            console.log('🏠 Inicializando IndexPage...');
            this.showLoading();
            
            // Inicializar managers en SECUENCIA, no en paralelo
            console.log('🔄 Inicializando categoryManager...');
            await categoryManager.initialize();
            
            console.log('🔄 Inicializando productManager...');
            await productManager.initialize();
            
            console.log('📦 Cargando productos iniciales...');
            await this.loadInitialProducts();
            
            this.renderProducts();
            this.populateCategoryFilter();
            this.setupEventListeners();
            this.setupPagination();
            
            console.log('✅ IndexPage inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando IndexPage:', error);
            this.showError('Error al cargar los productos: ' + error.message);
        }
    }

    async loadInitialProducts() {
        const result = await productManager.loadProducts(this.currentPage, this.currentFilters);
        if (!result.success) {
            throw new Error(result.error);
        }
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) {
            console.warn('⚠️ categoryFilter no encontrado');
            return;
        }
        
        const categories = categoryManager.getCategories();
        if (!categories || categories.length === 0) {
            console.warn('⚠️ No hay categorías disponibles');
            return;
        }
        
        // Limpiar y poblar el filtro
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    showLoading() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mb-3"></i>
                <p class="text-gray-500">Cargando productos...</p>
            </div>
        `;
    }

    showError(message = 'Error al cargar los productos') {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                <p class="text-gray-500">${message}</p>
                <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="location.reload()">
                    Reintentar
                </button>
            </div>
        `;
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) {
            console.error('❌ productsGrid no encontrado en el DOM');
            return;
        }

        const products = productManager.getProducts();
        console.log('🎨 Renderizando', products.length, 'productos');
        
        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No se encontraron productos</p>
                    <p class="text-sm text-gray-400 mt-1">Intenta con otros filtros</p>
                </div>
            `;
            return;
        }

        // Limpiar y renderizar
        productsGrid.innerHTML = '';
        
        products.forEach(product => {
            try {
                const cardElement = ProductCard.create(product);
                productsGrid.appendChild(cardElement);
            } catch (error) {
                console.error('❌ Error creando card para producto:', product.name, error);
            }
        });
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch);
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', this.handleCategoryChange);
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange);
        }

        // Clear search
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    this.applyFilters();
                }
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.applyFilters();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = productManager.getTotalPages();
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.applyFilters();
                }
            });
        }
    }

    handleSearch(event) {
        this.currentFilters.search = event.target.value.trim();
        this.currentPage = 1;
        this.applyFilters();
    }

    handleCategoryChange(event) {
        this.currentFilters.category = event.target.value;
        this.currentPage = 1;
        this.applyFilters();
    }

    handleSortChange(event) {
        this.currentFilters.sort = event.target.value;
        this.currentPage = 1;
        this.applyFilters();
    }

    async applyFilters() {
        console.log('🔄 Aplicando filtros:', this.currentFilters);
        
        this.isLoading = true;
        this.showLoading();

        try {
            const result = await productManager.loadProducts(this.currentPage, this.currentFilters);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Pequeño delay para permitir que el DOM se actualice
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.renderProducts();
            this.updatePagination();
            
        } catch (error) {
            console.error('❌ Error aplicando filtros:', error);
            this.showError('Error al aplicar filtros: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    updatePagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        const totalProducts = document.getElementById('totalProducts');

        const totalPages = productManager.getTotalPages();
        const totalCount = productManager.getTotalProducts();

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
        if (totalProducts) totalProducts.textContent = `${totalCount} productos encontrados`;
    }

    setupPagination() {
        this.updatePagination();
    }
}

// Inicialización global
let indexPageInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 DOM cargado, iniciando IndexPage...');
    indexPageInstance = new IndexPage();
    indexPageInstance.init();
});

// Debug helpers
window.debugIndex = {
    reload: () => indexPageInstance?.applyFilters(),
    getProducts: () => productManager.getProducts(),
    getFilters: () => indexPageInstance?.currentFilters,
    testRender: () => {
        const testProduct = {
            id: 999,
            name: "Producto de prueba",
            description: "Descripción de prueba para verificar el renderizado",
            photo_url: "https://via.placeholder.com/300x200",
            categories: { name: "Test", color: "#ff0000" },
            plans: JSON.stringify([{ name: "Plan Test", price_soles: 100, price_dollars: 30 }])
        };
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            const card = ProductCard.create(testProduct);
            productsGrid.innerHTML = '';
            productsGrid.appendChild(card);
            console.log('✅ Producto de prueba renderizado');
        }
    }
};
