// scripts/pages/index.js
import { getSupabase } from '../../supabase.js';
import { Utils } from '../core/utils.js';

class IndexPage {
    constructor() {
        this.init();
    }

    async init() {
        // Inicializar Supabase
        this.supabase = await getSupabase();
        
        // Cargar productos de demostración
        await this.loadDemoProducts();
        this.renderProducts();
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    async loadDemoProducts() {
        // En una implementación real, esto vendría de Supabase
        // Por ahora usamos datos de demostración
        this.products = [
            {
                id: 1,
                name: "Plan Básico de Streaming",
                description: "Disfruta de contenido en HD con hasta 2 dispositivos simultáneos.",
                category_id: 1,
                photo_url: "https://images.unsplash.com/photo-1586899028174-e7098604235?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
                plans: [
                    { name: "Mensual", price_pen: 29.90, price_usd: 9.99 },
                    { name: "Anual", price_pen: 299.90, price_usd: 99.99 }
                ],
                categories: { name: "Streaming", color: "#3B82F6" }
            },
            {
                id: 2,
                name: "Plan Premium Cine",
                description: "Acceso a estrenos exclusivos y contenido en 4K con hasta 5 dispositivos.",
                category_id: 1,
                photo_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
                plans: [
                    { name: "Mensual", price_pen: 49.90, price_usd: 16.99 },
                    { name: "Anual", price_pen: 499.90, price_usd: 169.99 }
                ],
                categories: { name: "Streaming", color: "#3B82F6" }
            },
            {
                id: 3,
                name: "Curso de Producción Audiovisual",
                description: "Aprende a producir contenido profesional desde cero con expertos de la industria.",
                category_id: 2,
                photo_url: "https://images.unsplash.com/photo-1589254065878-42c9da997cc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
                plans: [
                    { name: "Acceso Completo", price_pen: 199.90, price_usd: 59.99 }
                ],
                categories: { name: "Cursos", color: "#10B981" }
            }
        ];
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '';
        this.products.forEach(product => {
            const productElement = this.createProductCard(product);
            productsGrid.appendChild(productElement);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
        
        // Obtener el color de la categoría si está disponible
        const categoryColor = product.categories ? product.categories.color : '#3B82F6';
        
        card.innerHTML = `
            <div class="relative">
                <img src="${product.photo_url}" alt="${product.name}" 
                     class="w-full h-48 object-cover">
                <span class="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded-full" 
                      style="background-color: ${categoryColor}">
                    ${product.categories ? product.categories.name : 'Sin categoría'}
                </span>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2 line-clamp-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${product.description}</p>
                
                <div class="mb-4">
                    ${this.renderPlans(product.plans)}
                </div>
            </div>
        `;
        
        return card;
    }

    renderPlans(plans) {
        if (!plans || !Array.isArray(plans) || plans.length === 0) {
            return '<p class="text-gray-500 text-sm">No hay planes disponibles</p>'
        }
        
        let html = '<div class="space-y-2">';
        
        plans.forEach(plan => {
            html += `
                <div class="flex justify-between items-center text-sm">
                    <span class="font-medium">${plan.name}</span>
                    <div class="text-right">
                        <div class="font-semibold">${Utils.formatCurrency(plan.price_pen, 'PEN')}</div>
                        <div class="text-gray-500">${Utils.formatCurrency(plan.price_usd, 'USD')}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    setupEventListeners() {
        // Filtro de categorías
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.applyFilters();
            }, 500));
        }
    }

    applyFilters() {
        const categoryValue = document.getElementById('categoryFilter').value;
        const searchValue = document.getElementById('searchInput').value.toLowerCase();
        
        let filteredProducts = this.products;
        
        // Filtrar por categoría
        if (categoryValue !== 'all') {
            filteredProducts = filteredProducts.filter(product => 
                product.category_id.toString() === categoryValue
            );
        }
        
        // Filtrar por búsqueda
        if (searchValue) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchValue) || 
                product.description.toLowerCase().includes(searchValue)
            );
        }
        
        // Mostrar productos filtrados
        this.displayFilteredProducts(filteredProducts);
    }

    displayFilteredProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '';
        
        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="text-center py-12 col-span-full">
                    <i class="fas fa-search text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No se encontraron productos</p>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const productElement = this.createProductCard(product);
            productsGrid.appendChild(productElement);
        });
    }
}

// Inicializar la página principal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
});
