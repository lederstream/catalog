// scripts/pages/admin.js
import { authManager } from '../core/auth.js'
import { productManager } from '../managers/product-manager.js'
import { categoryManager } from '../managers/category-manager.js'
import { modalManager, productModal } from '../components/modals.js'
import { ProductCard } from '../components/product-card.js'
import { Utils } from '../core/utils.js'
import { setupAllEventListeners } from '../event-listeners.js'

class AdminPage {
    constructor() {
        this.currentFilters = {
            search: '',
            category: '',
            sort: 'newest'
        }
        
        this.init()
    }

    async init() {
        try {
            console.log('🔄 Inicializando AdminPage...')
            
            // Verificar autenticación
            if (!authManager.requireAuth()) {
                console.error('❌ Usuario no autenticado')
                return
            }
            
            // Inicializar managers
            console.log('🔄 Inicializando managers...')
            await authManager.initialize()
            await categoryManager.loadCategories()
            
            // Configurar UI
            this.setupUI()
            this.setupEventListeners()
            
            // Cargar datos iniciales
            await this.loadData()
            
            console.log('✅ AdminPage inicializada correctamente')
            
        } catch (error) {
            console.error('❌ Error inicializando AdminPage:', error)
            Utils.showError('Error al inicializar la aplicación: ' + error.message)
        }
    }

    setupUI() {
        // Configurar tema oscuro/claro según preferencia
        this.setupTheme()
    }

    setupTheme() {
        // Implementación existente...
    }

    async loadData() {
        try {
            console.log('🔄 Cargando datos...')
            Utils.showLoading('Cargando productos...')
            
            // Cargar productos y estadísticas en paralelo
            await Promise.all([
                this.loadProducts(),
                this.loadStats()
            ])
            
            this.renderProducts()
            this.renderStats()
            this.renderCategoryFilters()
            
            Utils.hideLoading()
            
        } catch (error) {
            console.error('❌ Error loading data:', error)
            Utils.showError('Error al cargar los datos: ' + error.message)
            Utils.hideLoading()
        }
    }

    async loadProducts() {
        try {
            console.log('🔄 Cargando productos con filtros:', this.currentFilters)
            
            // Usar el productManager para cargar productos
            const result = await productManager.loadProducts(1, this.currentFilters)
            
            if (!result.success) {
                throw new Error(result.error || 'Error desconocido al cargar productos')
            }
            
            console.log(`✅ ${result.products.length} productos cargados correctamente`)
            
        } catch (error) {
            console.error('❌ Error en loadProducts:', error)
            throw error
        }
    }

    async loadStats() {
        try {
            console.log('🔄 Cargando estadísticas...')
            const result = await productManager.getStats()
            
            if (result.success) {
                this.stats = result.stats
                console.log('✅ Estadísticas cargadas correctamente')
            } else {
                console.warn('⚠️ No se pudieron cargar las estadísticas:', result.error)
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error)
            // No lanzamos el error para que no afecte la carga de productos
        }
    }

    renderProducts() {
        const productsList = document.getElementById('adminProductsList')
        const productsCount = document.getElementById('productsCount')
        
        if (!productsList) {
            console.error('❌ Elemento adminProductsList no encontrado en el DOM')
            return
        }
        
        // Obtener productos del manager
        const products = productManager.getProducts()
        const totalProducts = productManager.getTotalProducts()
        
        console.log(`🔄 Renderizando ${products.length} de ${totalProducts} productos`)
        
        if (products.length === 0) {
            productsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-4"></i>
                    <p class="text-lg font-medium">No se encontraron productos</p>
                    <p class="mt-2">Intenta ajustar los filtros o agregar nuevos productos.</p>
                </div>
            `
            
            if (productsCount) {
                productsCount.textContent = '0 productos'
            }
            return
        }
        
        // Actualizar contador
        if (productsCount) {
            productsCount.textContent = `${totalProducts} producto${totalProducts !== 1 ? 's' : ''}`
        }
        
        // Renderizar productos
        productsList.innerHTML = products.map(product => 
            this.createProductCard(product)
        ).join('')
        
        // Configurar eventos para los botones de cada producto
        this.setupProductEvents()
        
        // Renderizar paginación
        this.renderPagination()
    }

    createProductCard(product) {
        // Asegurarse de que los planes sean un array
        let plans = []
        try {
            plans = typeof product.plans === 'string' ? 
                JSON.parse(product.plans) : 
                (product.plans || [])
        } catch (e) {
            console.warn('Error parsing plans for product', product.id, e)
            plans = []
        }
        
        // Obtener nombre de categoría
        const categoryName = product.categories?.name || 'Sin categoría'
        const categoryColor = product.categories?.color || '#3B82F6'
        
        return `
            <div class="bg-white border rounded-lg p-4 md:p-6 flex flex-col md:flex-row gap-4">
                <div class="md:w-1/4">
                    <img src="${product.photo_url || 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'}" 
                         alt="${product.name}" 
                         class="w-full h-40 object-cover rounded-lg">
                </div>
                
                <div class="md:w-2/4">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-lg">${product.name}</h4>
                        <span class="px-2 py-1 text-xs font-semibold text-white rounded-full" 
                              style="background-color: ${categoryColor}">
                            ${categoryName}
                        </span>
                    </div>
                    
                    <p class="text-gray-600 mb-4 line-clamp-2">${product.description || 'Sin descripción'}</p>
                    
                    <div class="mb-4">
                        <p class="text-sm font-medium mb-2">Planes:</p>
                        ${plans.length > 0 ? 
                            plans.map(plan => `
                                <div class="flex justify-between text-sm mb-1">
                                    <span>${plan.name}</span>
                                    <span>
                                        ${plan.price_soles ? `S/ ${plan.price_soles}` : ''}
                                        ${plan.price_soles && plan.price_usd ? ' | ' : ''}
                                        ${plan.price_usd ? `$ ${plan.price_usd}` : ''}
                                    </span>
                                </div>
                            `).join('') : 
                            '<p class="text-gray-500 text-sm">No hay planes definidos</p>'
                        }
                    </div>
                </div>
                
                <div class="md:w-1/4 flex flex-col justify-between">
                    <div class="text-sm text-gray-500 mb-4">
                        <p>ID: ${product.id}</p>
                        <p>Creado: ${new Date(product.created_at).toLocaleDateString()}</p>
                        <p>Estado: 
                            <span class="px-2 py-1 rounded-full text-xs 
                                ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                ${product.status || 'unknown'}
                            </span>
                        </p>
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <button class="edit-product px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center justify-center"
                                data-product-id="${product.id}">
                            <i class="fas fa-edit mr-2"></i> Editar
                        </button>
                        <button class="delete-product px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center justify-center"
                                data-product-id="${product.id}">
                            <i class="fas fa-trash mr-2"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    setupProductEvents() {
        // Botones de editar
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId
                this.editProduct(productId)
            })
        })
        
        // Botones de eliminar
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId
                const product = productManager.getProductById(productId)
                if (product) this.confirmDeleteProduct(product)
            })
        })
    }

    renderPagination() {
        const pagination = document.getElementById('productsPagination')
        if (!pagination) return
        
        const totalPages = productManager.getTotalPages()
        const currentPage = productManager.getCurrentPage()
        
        if (totalPages <= 1) {
            pagination.classList.add('hidden')
            return
        }
        
        pagination.classList.remove('hidden')
        
        // Crear HTML de paginación
        let html = `
            <button class="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 
                ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === 1 ? 'disabled' : ''} 
                onclick="adminPage.changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `
        
        // Mostrar páginas
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="px-3 py-1 rounded border 
                    ${currentPage === i ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}" 
                    onclick="adminPage.changePage(${i})">
                    ${i}
                </button>
            `
        }
        
        html += `
            <button class="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 
                ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="adminPage.changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `
        
        pagination.innerHTML = html
    }

    renderCategoryFilters() {
        const filterSelect = document.getElementById('filterCategory')
        if (!filterSelect) return
        
        const categories = categoryManager.getCategories()
        const currentValue = filterSelect.value
        
        filterSelect.innerHTML = `
            <option value="">Todas las categorías</option>
            ${categories.map(cat => `
                <option value="${cat.id}" ${currentValue === cat.id ? 'selected' : ''}>
                    ${cat.name}
                </option>
            `).join('')}
        `
    }

    renderStats() {
        const statsContainer = document.getElementById('statsSummary')
        if (!statsContainer) return
        
        // Si no hay estadísticas, mostrar esqueleto
        if (!this.stats) {
            statsContainer.innerHTML = `
                <div class="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            `
            return
        }
        
        const topCategory = this.getTopCategory()
        
        statsContainer.innerHTML = `
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4">
                <div class="flex items-center mb-2">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-box text-white"></i>
                    </div>
                    <h3 class="text-2xl font-bold">${this.stats.totalProducts || 0}</h3>
                </div>
                <p class="text-gray-700">Total Productos</p>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4">
                <div class="flex items-center mb-2">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-tags text-white"></i>
                    </div>
                    <h3 class="text-2xl font-bold">${this.stats.categories?.length || 0}</h3>
                </div>
                <p class="text-gray-700">Categorías</p>
            </div>
            
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4">
                <div class="flex items-center mb-2">
                    <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-star text-white"></i>
                    </div>
                    <h3 class="text-2xl font-bold">${this.stats.activeProducts || 0}</h3>
                </div>
                <p class="text-gray-700">Activos</p>
            </div>
            
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-4">
                <div class="flex items-center mb-2">
                    <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-chart-line text-white"></i>
                    </div>
                    <h3 class="text-2xl font-bold">${topCategory}</h3>
                </div>
                <p class="text-gray-700">Categoría Principal</p>
            </div>
        `
    }

    getTopCategory() {
        if (!this.stats?.categories) return 'N/A'
        
        const topCategory = this.stats.categories.reduce((prev, current) => 
            (prev.product_count > current.product_count) ? prev : current, 
        { product_count: 0, name: 'N/A' })
        
        return topCategory.product_count > 0 ? topCategory.name : 'N/A'
    }

    setupEventListeners() {
        // Configurar listeners básicos
        setupAllEventListeners(this)
        
        // Listeners adicionales
        this.setupAdditionalListeners()
    }

    setupAdditionalListeners() {
        // Botón agregar producto
        const addProductBtn = document.getElementById('addProductBtn')
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                productModal.open()
            })
        }
        
        // Botón recargar (si existe)
        const reloadBtn = document.getElementById('reloadBtn')
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                this.loadData()
            })
        }
    }

    async handleSearch(e) {
        this.currentFilters.search = e.target.value
        await this.applyFilters()
    }

    async handleFilterChange(e) {
        this.currentFilters.category = e.target.value
        await this.applyFilters()
    }

    async handleSortChange(e) {
        this.currentFilters.sort = e.target.value
        await this.applyFilters()
    }

    async applyFilters() {
        Utils.showLoading('Aplicando filtros...')
        await this.loadProducts()
        this.renderProducts()
        Utils.hideLoading()
    }

    async changePage(page) {
        Utils.showLoading(`Cargando página ${page}...`)
        await productManager.loadProducts(page, this.currentFilters)
        this.renderProducts()
        Utils.hideLoading()
        
        // Scroll suave al principio
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async editProduct(productId) {
        try {
            const result = await productManager.getProductById(productId)
            if (result.success) {
                productModal.open(result.product)
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error('Error editing product:', error)
            Utils.showError('Error al cargar el producto: ' + error.message)
        }
    }

    async confirmDeleteProduct(product) {
        const confirmed = await Utils.showConfirm(
            `Eliminar "${product.name}"`,
            `¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.`,
            'warning'
        )
        
        if (confirmed) {
            try {
                Utils.showLoading('Eliminando producto...')
                const result = await productManager.deleteProduct(product.id)
                
                if (result.success) {
                    await this.loadData()
                    Utils.showSuccess('Producto eliminado correctamente')
                } else {
                    throw new Error(result.error)
                }
            } catch (error) {
                console.error('Error deleting product:', error)
                Utils.showError('Error al eliminar el producto: ' + error.message)
            }
        }
    }

    async handleLogout() {
        const confirmed = await Utils.showConfirm(
            'Cerrar sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            'question'
        )
        
        if (confirmed) {
            await authManager.logout()
            window.location.href = 'login.html'
        }
    }

    handleAuthenticationChange(event, user) {
        console.log('Auth change:', event, user)
        // Actualizar UI según estado de autenticación
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminPage = new AdminPage()
})
