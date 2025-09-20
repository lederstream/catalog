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
            // Mostrar loading inicial
            this.showLoading();
            
            // Cargar categorías y productos
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
        if (!categoryFilter) {
            console.warn('categoryFilter no encontrado');
            return;
        }
        
        const categories = categoryManager.getCategories();
        if (!categories || categories.length === 0) return;
        
        // Limpiar opciones excepto "Todas"
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

        // Establecer valor actual si existe
        if (this.currentFilters.category) {
            categoryFilter.value = this.currentFilters.category;
        }
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
        if (!productsGrid) {
            console.warn('productsGrid no encontrado');
            return;
        }

        if (this.isLoading) {
            this.showLoading();
            return;
        }

        const products = productManager.getProducts();
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No hay productos disponibles</p>
                </div>
            `;
            return;
        }
        
        productsGrid.innerHTML = products.map(product => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div class="relative">
                    <img src="${product.photo_url}" alt="${product.name}" 
                         class="w-full h-48 object-cover" onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+no+disponible'">
                    <span class="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded-full" 
                          style="background-color: ${product.categories?.color || '#3B82F6'}">
                        ${product.categories?.name || 'Sin categoría'}
                    </span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2 line-clamp-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${product.description}</p>
                    ${this.renderPlans(product.plans)}
                </div>
            </div>
        `).join('');
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
        
        // Generar ID único
        const accordionId = `plans-${Math.random().toString(36).substr(2, 9)}`;
        
        let html = `
            <div class="space-y-2" id="${accordionId}">
                <h4 class="font-medium text-sm text-gray-700 mb-1">Planes:</h4>
        `;
        
        // Mostrar primeros 2 planes
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
        
        // Mostrar contador si hay más planes
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
        // Filtro de categorías
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentFilters.search = e.target.value.trim();
                this.currentPage = 1;
                this.applyFilters();
            }, 500));
        }
        
        // Ordenamiento
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        // Limpiar búsqueda
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn && searchInput) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.currentFilters.search = '';
                this.currentPage = 1;
                this.applyFilters();
                clearSearchBtn.classList.add('hidden');
            });

            // Mostrar/ocultar botón de limpiar según si hay texto
            searchInput.addEventListener('input', () => {
                clearSearchBtn.classList.toggle('hidden', !searchInput.value);
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
            nextBtn.addEventListener('click', async () => {
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

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.classList.toggle('opacity-50', this.currentPage === 1);
            prevBtn.classList.toggle('cursor-not-allowed', this.currentPage === 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
            nextBtn.classList.toggle('opacity-50', this.currentPage >= totalPages);
            nextBtn.classList.toggle('cursor-not-allowed', this.currentPage >= totalPages);
        }

        if (pageInfo) {
            pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
        }

        if (totalProducts) {
            totalProducts.textContent = `${totalProductsCount} producto${totalProductsCount !== 1 ? 's' : ''} encontrado${totalProductsCount !== 1 ? 's' : ''}`;
        }
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

// Función global para el acordeón simple (index page)
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

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
});
