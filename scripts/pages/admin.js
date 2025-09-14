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
        // Verificar autenticación
        if (!authManager.requireAuth()) return
        
        try {
            // Inicializar managers
            await Promise.all([
                authManager.initialize(),
                productManager.initialize(),
                categoryManager.loadCategories()
            ])
            
            // Configurar UI
            this.setupUI()
            this.setupEventListeners()
            
            // Cargar datos iniciales
            await this.loadData()
            
            console.log('✅ AdminPage inicializada correctamente')
            
        } catch (error) {
            console.error('Error inicializando AdminPage:', error)
            Utils.showError('Error al inicializar la aplicación')
        }
    }

    setupUI() {
        // Configurar tema oscuro/claro según preferencia
        this.setupTheme()
        
        // Configurar tooltips
        this.setupTooltips()
    }

    setupTheme() {
        const themeToggle = document.getElementById('themeToggle')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const savedTheme = localStorage.getItem('theme')
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark')
        }
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark')
                localStorage.setItem('theme', 
                    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                )
            })
        }
    }

    setupTooltips() {
        // Implementar tooltips con Tippy.js o similar
        const elements = document.querySelectorAll('[data-tooltip]')
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                const tooltip = document.createElement('div')
                tooltip.className = 'tooltip'
                tooltip.textContent = el.dataset.tooltip
                document.body.appendChild(tooltip)
                
                // Posicionamiento básico (mejorar con librería)
                const rect = el.getBoundingClientRect()
                tooltip.style.top = `${rect.bottom + 5}px`
                tooltip.style.left = `${rect.left}px`
                
                el._tooltip = tooltip
            })
            
            el.addEventListener('mouseleave', () => {
                if (el._tooltip) {
                    el._tooltip.remove()
                    delete el._tooltip
                }
            })
        })
    }

    async loadData() {
        try {
            Utils.showLoading('Cargando productos...')
            
            await Promise.all([
                productManager.loadProducts(1, this.currentFilters),
                this.loadStats()
            ])
            
            this.renderProducts()
            this.renderStats()
            this.renderCategoryFilters()
            
            Utils.hideLoading()
            
        } catch (error) {
            console.error('Error loading data:', error)
            Utils.showError('Error al cargar los datos')
            Utils.hideLoading()
        }
    }

    async loadStats() {
        const { success, stats } = await productManager.getStats()
        if (success) {
            this.stats = stats
        }
    }

    renderProducts() {
        const productsList = document.getElementById('adminProductsList')
        const productsCount = document.getElementById('productsCount')
        const emptyState = document.getElementById('emptyState')
        
        if (!productsList) return
        
        const products = productManager.getProducts()
        
        if (products.length === 0) {
            productsList.innerHTML = ''
            if (emptyState) emptyState.classList.remove('hidden')
            if (productsCount) productsCount.textContent = '0 productos'
            return
        }
        
        if (emptyState) emptyState.classList.add('hidden')
        
        // Actualizar contador
        if (productsCount) {
            productsCount.textContent = `${productManager.getTotalProducts()} productos`
        }
        
        // Renderizar productos
        productsList.innerHTML = products.map(product => 
            ProductCard.create(product, true)
        ).join('')
        
        // Configurar eventos
        this.setupProductEvents()
        
        // Renderizar paginación
        this.renderPagination()
    }

    setupProductEvents() {
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId
                this.editProduct(productId)
            })
        })
        
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
        pagination.innerHTML = this.createPaginationHTML(currentPage, totalPages)
        
        // Configurar eventos de paginación
        pagination.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page)
                this.changePage(page)
            })
        })
    }

    createPaginationHTML(currentPage, totalPages) {
        let html = `
            <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `
        
        // Mostrar máximo 5 páginas alrededor de la actual
        const startPage = Math.max(1, currentPage - 2)
        const endPage = Math.min(totalPages, startPage + 4)
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `
        }
        
        html += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `
        
        return html
    }

    async changePage(page) {
        Utils.showLoading(`Cargando página ${page}...`)
        await productManager.loadProducts(page, this.currentFilters)
        this.renderProducts()
        Utils.hideLoading()
        
        // Scroll suave al principio
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    renderCategoryFilters() {
        const filterSelect = document.getElementById('filterCategory')
        if (!filterSelect) return
        
        const categories = categoryManager.getCategories()
        
        // Mantener valor seleccionado actual
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
        if (!statsContainer || !this.stats) return
        
        statsContainer.innerHTML = `
            <div class="stats-card bg-gradient-to-br from-blue-50 to-blue-100">
                <div class="stats-icon bg-blue-500">
                    <i class="fas fa-box"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.totalProducts}</h3>
                    <p>Total Productos</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-green-50 to-green-100">
                <div class="stats-icon bg-green-500">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.categories?.length || 0}</h3>
                    <p>Categorías</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-purple-50 to-purple-100">
                <div class="stats-icon bg-purple-500">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.activeProducts || 0}</h3>
                    <p>Activos</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-orange-50 to-orange-100">
                <div class="stats-icon bg-orange-500">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.getTopCategory()}</h3>
                    <p>Categoría Principal</p>
                </div>
            </div>
        `
    }

    getTopCategory() {
        if (!this.stats?.categories) return 'N/A'
        
        const topCategory = this.stats.categories.reduce((prev, current) => 
            (prev.product_count > current.product_count) ? prev : current, 
        { product_count: 0 })
        
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
        
        // Botón recargar
        const reloadBtn = document.getElementById('reloadBtn')
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                this.loadData()
            })
        }
        
        // Botón exportar
        const exportBtn = document.getElementById('exportBtn')
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData()
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
        await productManager.loadProducts(1, this.currentFilters)
        this.renderProducts()
        Utils.hideLoading()
    }

    async editProduct(productId) {
        try {
            const product = productManager.getProductById(productId)
            if (product) {
                productModal.open(product)
            }
        } catch (error) {
            console.error('Error editing product:', error)
            Utils.showError('Error al cargar el producto')
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
                await productManager.deleteProduct(product.id)
                await this.loadData()
                Utils.showSuccess('Producto eliminado correctamente')
            } catch (error) {
                console.error('Error deleting product:', error)
                Utils.showError('Error al eliminar el producto')
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

    async exportData() {
        try {
            Utils.showLoading('Exportando datos...')
            
            const products = productManager.getProducts()
            const csvContent = this.convertToCSV(products)
            
            this.downloadCSV(csvContent, 'productos.csv')
            
            Utils.showSuccess('Datos exportados correctamente')
            
        } catch (error) {
            console.error('Error exporting data:', error)
            Utils.showError('Error al exportar datos')
        }
    }

    convertToCSV(products) {
        const headers = ['Nombre', 'Categoría', 'Descripción', 'Estado', 'Fecha Creación']
        const rows = products.map(product => [
            `"${product.name}"`,
            `"${product.category_name}"`,
            `"${product.description}"`,
            `"${product.status}"`,
            `"${new Date(product.created_at).toLocaleDateString()}"`
        ])
        
        return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AdminPage()
})

// Hacer disponible globalmente para acceso desde otros módulos
window.adminPage = new AdminPage()
