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
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            
            // Inicializar managers primero
            await Promise.all([
                categoryManager.initialize(),
                productManager.initialize()
            ]);
            
            await this.loadInitialProducts();
            this.renderProducts();
            this.populateCategoryFilter();
            this.setupEventListeners();
            this.setupPagination();
        } catch (error) {
            console.error('Error inicializando la página:', error);
            this.showError();
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
        if (!categoryFilter) return;
        
        const categories = categoryManager.getCategories();
        if (!categories) return;
        
        // Limpiar opciones existentes (excepto la primera)
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Agregar categorías
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
        
        productsGrid.innerHTML = '';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'col-span-full text-center py-12';
        loadingDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mb-3"></i>
            <p class="text-gray-500">Cargando productos...</p>
        `;
        
        productsGrid.appendChild(loadingDiv);
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) {
            console.error('❌ productsGrid no encontrado en el DOM');
            return;
        }

        if (this.isLoading) {
            this.showLoading();
            return;
        }

        const products = productManager.getProducts();
        
        console.log('📦 Productos a renderizar:', products?.length);
        
        if (!products || products.length === 0) {
            console.log('ℹ️ No hay productos para mostrar');
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No hay productos disponibles</p>
                </div>
            `;
            return;
        }

        // LIMPIAR el contenedor
        productsGrid.innerHTML = '';
        
        // Crear fragmento para mejor performance
        const fragment = document.createDocumentFragment();
        
        products.forEach(product => {
            // USAR EL COMPONENTE ProductCard
            const card = ProductCard.create(product);
            fragment.appendChild(card);
        });
        
        // Agregar todos los productos al DOM
        productsGrid.appendChild(fragment);
        
        console.log('✅ Renderización completada correctamente');
    }

    showError() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
                <p class="text-gray-500">Error al cargar los productos</p>
                <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="location.reload()">
                    Reintentar
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const categoryFilter = document.getElementById('categoryFilter');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilters.search = e.target.value.trim();
                this.currentPage = 1;
                this.applyFilters();
            }, 500));
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        if (clearSearchBtn && searchInput) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.currentFilters.search = '';
                this.currentPage = 1;
                this.applyFilters();
            });
        }
    }

    setupPagination() {
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

        this.updatePagination();
    }

    updatePagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        const totalProducts = document.getElementById('totalProducts');

        const totalPages = productManager.getTotalPages() || 1;
        const totalProductsCount = productManager.getTotalProducts() || 0;

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
        if (totalProducts) totalProducts.textContent = `${totalProductsCount} productos encontrados`;
    }

    async applyFilters() {
        console.log('🔄 Aplicando filtros...', this.currentFilters);
        this.isLoading = true;
        this.showLoading();

        try {
            const result = await productManager.loadProducts(this.currentPage, this.currentFilters);
            
            if (!result.success) {
                console.error('❌ Error al cargar productos:', result.error);
                this.showError();
                return;
            }

            // Pequeña pausa para asegurar que el DOM se actualice
            await new Promise(resolve => setTimeout(resolve, 50));
            
            this.renderProducts();
            this.updatePagination();
            
        } catch (error) {
            console.error('💥 Error applying filters:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            console.log('🏁 Filtros aplicados');
        }
    }
}

// Función global para toggle de planes (si es necesaria)
window.toggleSimplePlansAccordion = function(accordionId, remainingPlansCount) {
    const container = document.getElementById(accordionId);
    if (!container) return;
    
    const additionalPlans = container.querySelector('.additional-plans');
    const viewMoreBtn = container.querySelector('.view-more-trigger');
    
    if (!additionalPlans || !viewMoreBtn) return;
    
    if (additionalPlans.classList.contains('hidden')) {
        additionalPlans.classList.remove('hidden');
        viewMoreBtn.textContent = 'Ocultar planes';
    } else {
        additionalPlans.classList.add('hidden');
        viewMoreBtn.textContent = `+${remainingPlansCount} planes más`;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.indexPage = new IndexPage();
});
