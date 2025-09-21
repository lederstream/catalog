// scripts/pages/index.js
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';
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
            
            await Promise.all([
                categoryManager.loadCategories(),
                this.loadInitialProducts()
            ]);
            
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
        
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
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

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.isLoading) {
            this.showLoading();
            return;
        }

        const products = productManager.getProducts();
        console.log('📦 Productos a renderizar:', products);
        console.log('🔍 Número de productos:', products?.length);
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No hay productos disponibles</p>
                </div>
            `;
            return;
        }
        if (products.length > 0) {
        console.log('👀 Primer producto:', products[0]);
        console.log('📸 URL de imagen:', products[0].photo_url);
        console.log('🏷️ Categoría:', products[0].categories);
    }
    
        productsGrid.innerHTML = products.map(product => {
            // Manejo seguro de categorías
            const category = product.categories || {};
            const categoryColor = category.color || '#3B82F6';
            const categoryName = category.name || 'Sin categoría';
            
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div class="relative">
                        <img src="${product.photo_url || 'https://via.placeholder.com/300x200'}" 
                             alt="${product.name}" 
                             class="w-full h-48 object-cover" 
                             onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+no+disponible'">
                        <span class="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded-full" 
                              style="background-color: ${categoryColor}">
                            ${categoryName}
                        </span>
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-lg mb-2 line-clamp-2">${product.name}</h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3">${product.description || 'Sin descripción'}</p>
                        ${this.renderPlans(product.plans)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPlans(plans) {
        let parsedPlans = [];
        
        try {
            if (typeof plans === 'string') {
                parsedPlans = JSON.parse(plans);
            } else if (Array.isArray(plans)) {
                parsedPlans = plans;
            } else if (plans && typeof plans === 'object') {
                parsedPlans = Object.values(plans);
            }
        } catch (error) {
            console.error('Error parsing plans:', error);
            parsedPlans = [];
        }
        
        if (!parsedPlans || parsedPlans.length === 0) {
            return '<p class="text-gray-500 text-sm">No hay planes disponibles</p>';
        }
        
        const accordionId = `plans-${Math.random().toString(36).substr(2, 9)}`;
        
        let html = `
            <div class="space-y-2" id="${accordionId}">
                <h4 class="font-medium text-sm text-gray-700 mb-1">Planes:</h4>
        `;
        
        parsedPlans.slice(0, 2).forEach(plan => {
            const priceSoles = typeof plan.price_soles === 'number' ? plan.price_soles : parseFloat(plan.price_soles || 0);
            const priceDollars = typeof plan.price_dollars === 'number' ? plan.price_dollars : parseFloat(plan.price_dollars || 0);
            
            html += `
                <div class="flex justify-between items-center text-xs plan-item">
                    <span class="font-medium">${plan.name}</span>
                    <div class="text-right">
                        ${priceSoles > 0 ? `<div class="font-semibold">${Utils.formatCurrency(priceSoles, 'PEN')}</div>` : ''}
                        ${priceDollars > 0 ? `<div class="text-gray-500">${Utils.formatCurrency(priceDollars, 'USD')}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        if (parsedPlans.length > 2) {
            html += `
                <div class="text-xs text-blue-600 text-center cursor-pointer view-more-trigger" 
                    onclick="toggleSimplePlansAccordion('${accordionId}', ${parsedPlans.length - 2})">
                    +${parsedPlans.length - 2} planes más
                </div>
                <div class="additional-plans hidden space-y-2">
            `;
            
            parsedPlans.slice(2).forEach(plan => {
                const priceSoles = typeof plan.price_soles === 'number' ? plan.price_soles : parseFloat(plan.price_soles || 0);
                const priceDollars = typeof plan.price_dollars === 'number' ? plan.price_dollars : parseFloat(plan.price_dollars || 0);
                
                html += `
                    <div class="flex justify-between items-center text-xs plan-item">
                        <span>${plan.name}</span>
                        <div class="text-right">
                            ${priceSoles > 0 ? `<div>${Utils.formatCurrency(priceSoles, 'PEN')}</div>` : ''}
                            ${priceDollars > 0 ? `<div class="text-gray-500">${Utils.formatCurrency(priceDollars, 'USD')}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        html += '</div>';
        return html;
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
                if (this.currentPage < productManager.getTotalPages()) {
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
        this.isLoading = true;
        this.renderProducts();

        try {
            const result = await productManager.loadProducts(this.currentPage, this.currentFilters);
            
            if (!result.success) {
                this.showError();
                return;
            }

            this.renderProducts();
            this.updatePagination();
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError();
        } finally {
            this.isLoading = false;
        }
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
});
