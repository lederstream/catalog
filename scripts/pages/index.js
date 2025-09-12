// scripts/pages/index.js
import { Utils } from '../core/utils.js';
import { ProductManager } from '../managers/product-manager.js';
import { CategoryManager } from '../managers/category-manager.js';
import { createProductCard, addProductCardEventListeners, animateProductsEntry } from '../components/product-card.js';

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
            console.log('✅ Página de inicio inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando página de inicio:', error);
            Utils.showError('Error al cargar la página');
            await this.hideLoadingState();
        }
    }

    async initializeManagers() {
        await CategoryManager.init();
        await ProductManager.init();
    }

    async loadData() {
        try {
            Utils.showInfo('🔄 Cargando catálogo...');
            
            const [categories, products] = await Promise.all([
                CategoryManager.loadCategories(),
                ProductManager.loadProducts()
            ]);
            
            this.state.categories = categories;
            this.state.products = products;
            
            // Actualizar UI
            this.updateCategoryFilter();
            this.renderProducts();
            
            Utils.showSuccess('✅ Catálogo cargado correctamente');
            
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
        animateProductsEntry();
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
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.categories?.name.toLowerCase().includes(searchTerm))
            );
        }
        
        return filtered;
    }

    setupEventListeners() {
        // Filtro de categoría
        document.getElementById('categoryFilter')?.addEventListener('change', 
            () => this.renderProducts()
        );
        
        // Búsqueda
        document.getElementById('searchInput')?.addEventListener('input', 
            Utils.debounce(() => this.renderProducts(), 300)
        );
        
        // Smooth scrolling para enlaces internos
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
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
                    <p class="text-sm text-gray-500 mt-1">Por favor, recarga la página</p>
                    <button class="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                            onclick="window.location.reload()">
                        <i class="fas fa-refresh mr-2"></i>
                        Recargar página
                    </button>
                </div>
            `;
        }
    }

    getNoProductsHTML() {
        return `
            <div class="col-span-full text-center py-16 fade-in-up">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500 mb-4">Intenta con otros términos de búsqueda o categorías</p>
                <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                        onclick="this.resetFilters()">
                    <i class="fas fa-refresh mr-2"></i>
                    Limpiar filtros
                </button>
            </div>
        `;
    }

    async hideLoadingState() {
        // Ocultar cualquier estado de carga si es necesario
    }
}

// Función global para resetear filtros
window.resetFilters = function() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) categoryFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    const indexPage = window.indexPage;
    if (indexPage) indexPage.renderProducts();
};

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.indexPage = new IndexPage();
    await window.indexPage.initialize();
});
