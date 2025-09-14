// scripts/pages/index.js
import { ProductManager } from '../managers/product-manager.js';
import { CategoryManager } from '../managers/category-manager.js';
import { Utils } from '../core/utils.js';

class IndexPage {
    constructor() {
        this.productManager = new ProductManager();
        this.categoryManager = new CategoryManager();
        this.init();
    }

    async init() {
        try {
            // Cargar categorías y productos
            await Promise.all([this.loadCategories(), this.loadProducts()]);
            this.setupEventListeners();
        } catch (error) {
            console.error('Error inicializando la página:', error);
            this.showError();
        }
    }

    async loadCategories() {
        try {
            const { success, error } = await this.categoryManager.loadCategories();
            
            if (!success) {
                console.error('Error loading categories:', error);
                return;
            }
            
            this.populateCategoryFilter();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadProducts() {
        try {
            const { success, products, error } = await this.productManager.loadProducts();
            
            if (!success) {
                console.error('Error loading products:', error);
                this.showError();
                return;
            }
            
            this.renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError();
        }
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter || !this.categoryManager.categories.length) return;
        
        // Limpiar opciones excepto "Todas"
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Agregar categorías
        this.categoryManager.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    renderProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="text-center py-12 col-span-full">
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
                         class="w-full h-48 object-cover">
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
        if (!plans || !Array.isArray(plans) || plans.length === 0) {
            return '<p class="text-gray-500 text-sm">No hay planes disponibles</p>';
        }
        
        return `
            <div class="space-y-2">
                ${plans.map(plan => `
                    <div class="flex justify-between items-center text-sm">
                        <span class="font-medium">${plan.name}</span>
                        <div class="text-right">
                            <div class="font-semibold">${Utils.formatCurrency(plan.price_pen, 'PEN')}</div>
                            <div class="text-gray-500">${Utils.formatCurrency(plan.price_usd, 'USD')}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showError() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = `
            <div class="text-center py-12 col-span-full">
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
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.applyFilters();
            }, 300));
        }
    }

    async applyFilters() {
        const categoryValue = document.getElementById('categoryFilter')?.value || 'all';
        const searchValue = document.getElementById('searchInput')?.value || '';
        
        const filters = {
            category: categoryValue === 'all' ? '' : categoryValue,
            search: searchValue
        };
        
        try {
            const { success, products, error } = await this.productManager.loadProducts(1, filters);
            
            if (!success) {
                console.error('Error applying filters:', error);
                return;
            }
            
            this.renderProducts(products);
        } catch (error) {
            console.error('Error applying filters:', error);
        }
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
});
