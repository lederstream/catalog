import { AuthManager } from '../core/auth.js'
import { ProductManager } from '../managers/product-manager.js'
import { CategoryManager } from '../managers/category-manager.js'
import { ModalManager, ProductModal } from '../components/modals.js'
import { ProductCard } from '../components/product-card.js'
import { Utils } from '../core/utils.js'

// Instancias globales para acceso desde otros módulos
window.productManager = new ProductManager()
window.categoryManager = new CategoryManager()
window.modalManager = new ModalManager()
window.productModal = new ProductModal(window.modalManager)

class AdminPage {
    constructor() {
        this.init()
    }

    async init() {
        // Verificar autenticación
        AuthManager.requireAuth()
        
        // Cargar datos iniciales
        await this.loadInitialData()
        
        // Configurar event listeners
        this.setupEventListeners()
        
        // Cargar productos
        await window.productManager.loadProducts()
        this.renderProducts()
    }

    async loadInitialData() {
        // Cargar categorías
        const { success, categories } = await window.categoryManager.loadCategories()
        
        if (success) {
            this.populateCategoryFilters(categories)
        } else {
            Utils.showNotification('Error al cargar categorías', 'error')
        }
        
        // Cargar estadísticas
        await this.loadStats()
    }

    populateCategoryFilters(categories) {
        // Filtro de categorías en el panel de administración
        const filterCategory = document.getElementById('filterCategory')
        if (filterCategory) {
            // Limpiar opciones excepto la primera
            while (filterCategory.options.length > 1) {
                filterCategory.remove(1)
            }
            
            // Agregar categorías
            categories.forEach(category => {
                const option = document.createElement('option')
                option.value = category.id
                option.textContent = category.name
                filterCategory.appendChild(option)
            })
        }
        
        // Selector de categorías en el modal de producto
        const categorySelect = document.getElementById('category')
        if (categorySelect) {
            // Limpiar opciones excepto la primera
            while (categorySelect.options.length > 1) {
                categorySelect.remove(1)
            }
            
            // Agregar categorías
            categories.forEach(category => {
                const option = document.createElement('option')
                option.value = category.id
                option.textContent = category.name
                categorySelect.appendChild(option)
            })
        }
    }

    async loadStats() {
        const { success, stats } = await window.productManager.getStats()
        
        if (success) {
            this.renderStats(stats)
        } else {
            console.error('Error al cargar estadísticas')
        }
    }

    renderStats(stats) {
        const statsContainer = document.getElementById('statsSummary')
        if (!statsContainer) return
        
        statsContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <i class="fas fa-box text-xl"></i>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">Total Productos</p>
                        <p class="text-2xl font-bold">${stats.totalProducts}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <i class="fas fa-tags text-xl"></i>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">Total Categorías</p>
                        <p class="text-2xl font-bold">${stats.categories.length}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                        <i class="fas fa-star text-xl"></i>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">Producto Destacado</p>
                        <p class="text-lg font-bold truncate">${stats.recentProducts[0]?.name || 'Ninguno'}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                        <i class="fas fa-chart-line text-xl"></i>
                    </div>
                    <div>
                        <p class="text-gray-500 text-sm">Categoría Principal</p>
                        <p class="text-lg font-bold">
                            ${this.getTopCategory(stats.categories)}
                        </p>
                    </div>
                </div>
            </div>
        `
    }

    getTopCategory(categories) {
        if (!categories || categories.length === 0) return 'Ninguna'
        
        const topCategory = categories.reduce((prev, current) => {
            return (prev.product_count > current.product_count) ? prev : current
        })
        
        return topCategory.name
    }

    renderProducts() {
        const productsList = document.getElementById('adminProductsList')
        const productsCount = document.getElementById('productsCount')
        
        if (!productsList) return
        
        if (window.productManager.products.length === 0) {
            productsList.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No se encontraron productos</p>
                </div>
            `
            productsCount.textContent = '0 productos'
            return
        }
        
        // Actualizar contador
        productsCount.textContent = `${window.productManager.totalProducts} productos`
        
        // Renderizar productos
        productsList.innerHTML = ''
        window.productManager.products.forEach(product => {
            const productElement = ProductCard.create(product, true)
            productsList.appendChild(productElement)
            
            // Configurar eventos para botones de editar/eliminar
            const editBtn = productElement.querySelector('.edit-product')
            const deleteBtn = productElement.querySelector('.delete-product')
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editProduct(product.id))
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.confirmDeleteProduct(product))
            }
        })
        
        // Renderizar paginación
        this.renderPagination()
    }

    renderPagination() {
        const paginationContainer = document.getElementById('productsPagination')
        if (!paginationContainer) return
        
        const totalPages = window.productManager.getTotalPages()
        
        if (totalPages <= 1) {
            paginationContainer.classList.add('hidden')
            return
        }
        
        paginationContainer.classList.remove('hidden')
        
        let paginationHTML = `
            <button class="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50" 
                    ${window.productManager.currentPage === 1 ? 'disabled' : ''}
                    data-page="${window.productManager.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="px-3 py-1 rounded border ${
                    i === window.productManager.currentPage 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }" data-page="${i}">
                    ${i}
                </button>
            `
        }
        
        paginationHTML += `
            <button class="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50" 
                    ${window.productManager.currentPage === totalPages ? 'disabled' : ''}
                    data-page="${window.productManager.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `
        
        paginationContainer.querySelector('nav').innerHTML = paginationHTML
        
        // Configurar eventos de paginación
        paginationContainer.querySelectorAll('button[data-page]').forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.getAttribute('data-page'))
                this.changePage(page)
            })
        })
    }

    async changePage(page) {
        await window.productManager.loadProducts(page)
        this.renderProducts()
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    setupEventListeners() {
        // Botón de cerrar sesión
        const logoutBtn = document.getElementById('logoutBtn')
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout)
        }
        
        // Botón de agregar producto
        const addProductBtn = document.getElementById('addProductBtn')
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => window.productModal.open())
        }
        
        // Filtros y búsqueda
        const searchInput = document.getElementById('searchProducts')
        const filterCategory = document.getElementById('filterCategory')
        const sortSelect = document.getElementById('sortProducts')
        
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.applyFilters()
            }, 500))
        }
        
        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.applyFilters()
            })
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.applyFilters()
            })
        }
        
        // Botón de gestionar categorías
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn')
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', () => {
                // Implementar gestión de categorías
                Utils.showNotification('Funcionalidad en desarrollo', 'info')
            })
        }
        
        // Botón de ver estadísticas
        const viewStatsBtn = document.getElementById('viewStatsBtn')
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => {
                // Implementar vista de estadísticas
                Utils.showNotification('Funcionalidad en desarrollo', 'info')
            })
        }
        
        // Botón de cancelar en modal de producto
        const cancelProductBtn = document.getElementById('cancelProductBtn')
        if (cancelProductBtn) {
            cancelProductBtn.addEventListener('click', () => {
                window.modalManager.hideModal('productModal')
            })
        }
    }

    async applyFilters() {
        const searchValue = document.getElementById('searchProducts').value
        const categoryValue = document.getElementById('filterCategory').value
        const sortValue = document.getElementById('sortProducts').value
        
        const filters = {
            search: searchValue,
            category: categoryValue,
            sort: sortValue
        }
        
        await window.productManager.loadProducts(1, filters)
        this.renderProducts()
    }

    async editProduct(productId) {
        const { success, product } = await window.productManager.getProductById(productId)
        
        if (success) {
            window.productModal.open(product)
        } else {
            Utils.showNotification('Error al cargar el producto', 'error')
        }
    }

    async confirmDeleteProduct(product) {
        const modal = document.getElementById('deleteConfirmModal')
        const title = document.getElementById('deleteConfirmTitle')
        const message = document.getElementById('deleteConfirmMessage')
        
        if (title && message) {
            title.textContent = `Eliminar ${product.name}`
            message.textContent = `¿Estás seguro de que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`
        }
        
        window.modalManager.showModal('deleteConfirmModal')
        
        // Configurar eventos de los botones de confirmación
        const confirmBtn = document.querySelector('.confirm-delete')
        const cancelBtn = document.querySelector('.cancel-delete')
        
        const handleConfirm = async () => {
            const { success } = await window.productManager.deleteProduct(product.id)
            
            if (success) {
                // Recargar productos
                await window.productManager.loadProducts()
                this.renderProducts()
            }
            
            window.modalManager.hideModal('deleteConfirmModal')
            
            // Remover event listeners
            confirmBtn.removeEventListener('click', handleConfirm)
            cancelBtn.removeEventListener('click', handleCancel)
        }
        
        const handleCancel = () => {
            window.modalManager.hideModal('deleteConfirmModal')
            
            // Remover event listeners
            confirmBtn.removeEventListener('click', handleConfirm)
            cancelBtn.removeEventListener('click', handleCancel)
        }
        
        confirmBtn.addEventListener('click', handleConfirm)
        cancelBtn.addEventListener('click', handleCancel)
    }

    async handleLogout() {
        const { success } = await AuthManager.logout()
        
        if (success) {
            window.location.href = 'login.html'
        } else {
            Utils.showNotification('Error al cerrar sesión', 'error')
        }
    }
}

// Inicializar la página de administración cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AdminPage()
})
