// scripts/pages/index.js
import { ProductManager } from '../managers/product-manager.js'
import { CategoryManager } from '../managers/category-manager.js'
import { ProductCard } from '../components/product-card.js'
import { Utils } from '../core/utils.js'

class IndexPage {
    constructor() {
        this.productManager = new ProductManager()
        this.categoryManager = new CategoryManager()
        this.init()
    }

    async init() {
        // Cargar categorías
        await this.categoryManager.loadCategories()
        this.populateCategoryFilter()
        
        // Cargar productos
        await this.productManager.loadProducts()
        this.renderProducts()
        
        // Configurar event listeners
        this.setupEventListeners()
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter')
        if (!categoryFilter) return
        
        // Limpiar opciones excepto la primera
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1)
        }
        
        // Agregar categorías
        this.categoryManager.categories.forEach(category => {
            const option = document.createElement('option')
            option.value = category.id
            option.textContent = category.name
            categoryFilter.appendChild(option)
        })
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid')
        if (!productsGrid) return
        
        if (this.productManager.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="text-center py-12 col-span-full">
                    <i class="fas fa-search text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No se encontraron productos</p>
                </div>
            `
            return
        }
        
        productsGrid.innerHTML = ''
        this.productManager.products.forEach(product => {
            const productElement = ProductCard.create(product)
            productsGrid.appendChild(productElement)
        })
    }

    setupEventListeners() {
        // Filtro de categorías
        const categoryFilter = document.getElementById('categoryFilter')
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyFilters()
            })
        }
        
        // Búsqueda
        const searchInput = document.getElementById('searchInput')
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.applyFilters()
            }, 500))
        }
    }

    async applyFilters() {
        const categoryValue = document.getElementById('categoryFilter').value
        const searchValue = document.getElementById('searchInput').value
        
        const filters = {
            category: categoryValue === 'all' ? '' : categoryValue,
            search: searchValue
        }
        
        await this.productManager.loadProducts(1, filters)
        this.renderProducts()
    }
}

// Inicializar la página principal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new IndexPage()
})
