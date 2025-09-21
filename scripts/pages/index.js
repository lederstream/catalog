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
        console.log('📋 IndexPage constructor llamado');
    }

    async init() {
        try {
            console.log('🔄 Inicializando IndexPage...');
            this.showLoading();
            
            // Inicializar managers
            console.log('🔄 Inicializando categoryManager...');
            const categoryResult = await categoryManager.initialize();
            console.log('✅ categoryManager:', categoryResult.success);
            
            console.log('🔄 Inicializando productManager...');
            const productResult = await productManager.initialize();
            console.log('✅ productManager:', productResult.success);
            
            await this.loadInitialProducts();
            this.renderProducts();
            this.populateCategoryFilter();
            this.setupEventListeners();
            this.setupPagination();
            
            console.log('✅ IndexPage inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando IndexPage:', error);
            this.showError();
        }
    }

    async loadInitialProducts() {
        console.log('📦 Cargando productos iniciales...');
        const result = await productManager.loadProducts(this.currentPage, this.currentFilters);
        console.log('📊 Resultado carga inicial:', result);
        
        if (!result.success) {
            throw new Error(result.error);
        }
    }

    showLoading() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) {
            console.error('❌ productsGrid no encontrado en el DOM');
            return;
        }
        
        console.log('⏳ Mostrando loading state...');
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
        console.log('🎨 Renderizando productos...');
        const productsGrid = document.getElementById('productsGrid');
        
        if (!productsGrid) {
            console.error('❌ productsGrid no encontrado en el DOM');
            return;
        }

        if (this.isLoading) {
            console.log('⏳ En estado loading, mostrando spinner...');
            this.showLoading();
            return;
        }

        const products = productManager.getProducts();
        console.log('📦 Productos disponibles:', products?.length);
        console.log('🔍 Primer producto:', products[0]);
        
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
        
        products.forEach((product, index) => {
            console.log(`🖼️ Creando card para producto ${index}:`, product.name);
            
            try {
                const card = ProductCard.create(product);
                fragment.appendChild(card);
            } catch (error) {
                console.error(`❌ Error creando card para producto ${index}:`, error);
            }
        });
        
        // Agregar todos los productos al DOM
        productsGrid.appendChild(fragment);
        
        console.log('✅ Renderización completada');
    }

    async applyFilters() {
        console.log('🔄 Aplicando filtros:', this.currentFilters);
        this.isLoading = true;
        this.showLoading();

        try {
            const result = await productManager.loadProducts(this.currentPage, this.currentFilters);
            console.log('📊 Resultado de loadProducts:', result);
            
            if (!result.success) {
                console.error('❌ Error al cargar productos:', result.error);
                this.showError();
                return;
            }

            // Pequeña pausa para asegurar que el DOM se actualice
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.renderProducts();
            this.updatePagination();
            
        } catch (error) {
            console.error('💥 Error applying filters:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            console.log('🏁 Filtros aplicados');
        }
    }}

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
    window.indexPage.init();
});
