import { authManager } from '../core/auth.js'
import { ProductManager } from '../managers/product-manager.js'
import { categoryManager } from '../managers/category-manager.js'
import { modalManager, productModal } from '../components/modals.js'
import { ProductCard } from '../components/product-card.js'
import { Utils } from '../core/utils.js'

class AdminPage {
    constructor() {
        this.productManager = new ProductManager();
        this.currentFilters = {
            search: '',
            category: '',
            sort: 'newest'
        };
        
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!authManager.requireAuth()) return;
        
        try {
            // Inicializar managers
            await authManager.initialize();
            await categoryManager.loadCategories();
            await this.productManager.initialize();
            
            // Configurar UI
            this.setupUI();
            this.setupEventListeners();
            
            // Cargar datos iniciales
            await this.loadData();
            
            console.log('✅ AdminPage inicializada correctamente');
            
        } catch (error) {
            console.error('Error inicializando AdminPage:', error);
            Utils.showError('Error al inicializar la aplicación');
        }
    }

    setupUI() {
        // Configurar tema oscuro/claro según preferencia
        this.setupTheme();
        
        // Configurar tooltips
        this.setupTooltips();
        
        // Configurar selects
        this.renderCategoryFilters();
        this.setupSortSelect();
    }

    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', 
                    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                );
            });
        }
    }

    setupTooltips() {
        // Implementar tooltips con Tippy.js o similar
        const elements = document.querySelectorAll('[data-tooltip]');
        elements.forEach(el => {
            const tooltipText = el.dataset.tooltip;
            
            el.addEventListener('mouseenter', (e) => {
                // Eliminar tooltip existente si hay uno
                const existingTooltip = document.querySelector('.custom-tooltip');
                if (existingTooltip) existingTooltip.remove();
                
                // Crear nuevo tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg';
                tooltip.textContent = tooltipText;
                document.body.appendChild(tooltip);
                
                // Posicionamiento
                const rect = e.target.getBoundingClientRect();
                tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                
                el._tooltip = tooltip;
            });
            
            el.addEventListener('mouseleave', () => {
                if (el._tooltip) {
                    el._tooltip.remove();
                    delete el._tooltip;
                }
            });
        });
    }

    setupSortSelect() {
        const sortSelect = document.getElementById('filterSort');
        if (!sortSelect) return;
        
        // Establecer valor actual
        sortSelect.value = this.currentFilters.sort;
    }

    async loadData() {
        try {
            Utils.showLoading('Cargando productos...');
            
            await Promise.all([
                this.productManager.loadProducts(1, this.currentFilters),
                this.loadStats()
            ]);
            
            this.renderProducts();
            this.renderStats();
            
            Utils.hideLoading();
            
        } catch (error) {
            console.error('Error loading data:', error);
            Utils.showError('Error al cargar los datos');
            Utils.hideLoading();
        }
    }

    async loadStats() {
        const { success, stats } = await this.productManager.getStats();
        if (success) {
            this.stats = stats;
        }
    }

    renderProducts() {
        const productsList = document.getElementById('adminProductsList');
        const productsCount = document.getElementById('productsCount');
        const emptyState = document.getElementById('emptyState');
        
        if (!productsList) return;
        
        const products = this.productManager.getProducts();
        
        if (products.length === 0) {
            productsList.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (productsCount) productsCount.textContent = '0 productos';
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        // Actualizar contador
        if (productsCount) {
            productsCount.textContent = `${this.productManager.getTotalProducts()} productos`;
        }
        
        // Renderizar productos
        productsList.innerHTML = products.map(product => 
            ProductCard.create(product, true)
        ).join('');
        
        // Configurar eventos
        this.setupProductEvents();
        
        // Renderizar paginación
        this.renderPagination();
    }

    setupProductEvents() {
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.editProduct(productId);
            });
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.confirmDeleteProduct(productId);
            });
        });
    }

    renderPagination() {
        const pagination = document.getElementById('productsPagination');
        if (!pagination) return;
        
        const totalPages = this.productManager.getTotalPages();
        const currentPage = this.productManager.getCurrentPage();
        
        if (totalPages <= 1) {
            pagination.classList.add('hidden');
            return;
        }
        
        pagination.classList.remove('hidden');
        pagination.innerHTML = this.createPaginationHTML(currentPage, totalPages);
        
        // Configurar eventos de paginación
        pagination.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.changePage(page);
            });
        });
    }

    createPaginationHTML(currentPage, totalPages) {
        let html = `
            <button class="pagination-btn ${currentPage === 1 ? 'disabled opacity-50 cursor-not-allowed' : ''}" 
                    ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Mostrar máximo 5 páginas alrededor de la actual
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active bg-blue-500 text-white' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        html += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled opacity-50 cursor-not-allowed' : ''}" 
                    ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        return html;
    }

    async changePage(page) {
        if (page < 1 || page > this.productManager.getTotalPages()) return;
        
        Utils.showLoading(`Cargando página ${page}...`);
        await this.productManager.loadProducts(page, this.currentFilters);
        this.renderProducts();
        Utils.hideLoading();
        
        // Scroll suave al principio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderCategoryFilters() {
        const filterSelect = document.getElementById('filterCategory');
        if (!filterSelect) return;
        
        const categories = categoryManager.getCategories();
        
        // Mantener valor seleccionado actual
        const currentValue = this.currentFilters.category;
        
        filterSelect.innerHTML = `
            <option value="">Todas las categorías</option>
            ${categories.map(cat => `
                <option value="${cat.id}" ${currentValue === cat.id ? 'selected' : ''}>
                    ${cat.name}
                </option>
            `).join('')}
        `;
    }

    renderStats() {
        const statsContainer = document.getElementById('statsSummary');
        if (!statsContainer || !this.stats) return;
        
        statsContainer.innerHTML = `
            <div class="stats-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                <div class="stats-icon bg-blue-500">
                    <i class="fas fa-box"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.totalProducts}</h3>
                    <p>Total Productos</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                <div class="stats-icon bg-green-500">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.categories?.length || 0}</h3>
                    <p>Categorías</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                <div class="stats-icon bg-purple-500">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.activeProducts || 0}</h3>
                    <p>Activos</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
                <div class="stats-icon bg-orange-500">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.getTopCategory()}</h3>
                    <p>Categoría Principal</p>
                </div>
            </div>
        `;
    }

    getTopCategory() {
        if (!this.stats?.categories || this.stats.categories.length === 0) return 'N/A';
        
        const topCategory = this.stats.categories.reduce((prev, current) => 
            (prev.product_count > current.product_count) ? prev : current
        );
        
        return topCategory.product_count > 0 ? topCategory.name : 'N/A';
    }

    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            // Usar debounce para evitar demasiadas solicitudes
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e);
                }, 500);
            });
        }
        
        // Filtros
        const categoryFilter = document.getElementById('filterCategory');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleFilterChange(e);
            });
        }
        
        // Ordenamiento
        const sortFilter = document.getElementById('filterSort');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.handleSortChange(e);
            });
        }
        
        // Botón agregar producto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                productModal.open();
            });
        }
        
        // Botón recargar
        const reloadBtn = document.getElementById('reloadBtn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                this.loadData();
            });
        }
        
        // Botón exportar
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Botón logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    async handleSearch(e) {
        this.currentFilters.search = e.target.value;
        await this.applyFilters();
    }

    async handleFilterChange(e) {
        this.currentFilters.category = e.target.value;
        await this.applyFilters();
    }

    async handleSortChange(e) {
        this.currentFilters.sort = e.target.value;
        await this.applyFilters();
    }

    async applyFilters() {
        Utils.showLoading('Aplicando filtros...');
        await this.productManager.loadProducts(1, this.currentFilters);
        this.renderProducts();
        Utils.hideLoading();
    }

    async editProduct(productId) {
        try {
            const { success, product, error } = await this.productManager.getProductById(productId);
            if (success && product) {
                productModal.open(product);
            } else {
                Utils.showError(error || 'Error al cargar el producto');
            }
        } catch (error) {
            console.error('Error editing product:', error);
            Utils.showError('Error al cargar el producto');
        }
    }

    async confirmDeleteProduct(productId) {
        const { success, product } = await this.productManager.getProductById(productId);
        
        if (!success || !product) {
            Utils.showError('No se pudo encontrar el producto');
            return;
        }
        
        const confirmed = await Utils.showConfirm(
            `Eliminar "${product.name}"`,
            `¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.`,
            'warning'
        );
        
        if (confirmed) {
            try {
                Utils.showLoading('Eliminando producto...');
                await this.productManager.deleteProduct(product.id);
                await this.loadData();
                Utils.showSuccess('Producto eliminado correctamente');
            } catch (error) {
                console.error('Error deleting product:', error);
                Utils.showError('Error al eliminar el producto');
            }
        }
    }

    async handleLogout() {
        const confirmed = await Utils.showConfirm(
            'Cerrar sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            'question'
        );
        
        if (confirmed) {
            await authManager.logout();
            window.location.href = 'login.html';
        }
    }

    async exportData() {
        try {
            Utils.showLoading('Exportando datos...');
            
            // Cargar todos los productos sin paginación
            const products = await this.loadAllProducts();
            const csvContent = this.convertToCSV(products);
            
            this.downloadCSV(csvContent, 'productos.csv');
            
            Utils.showSuccess('Datos exportados correctamente');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            Utils.showError('Error al exportar datos');
        }
    }

    async loadAllProducts() {
        try {
            // Obtener todos los productos sin paginación
            let query = supabase
                .from('products')
                .select('*, categories(name)');
            
            // Aplicar filtros actuales
            if (this.currentFilters.category) {
                query = query.eq('category_id', this.currentFilters.category);
            }
            
            if (this.currentFilters.search) {
                query = query.ilike('name', `%${this.currentFilters.search}%`);
            }
            
            // Aplicar ordenamiento
            switch (this.currentFilters.sort) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'name_asc':
                    query = query.order('name', { ascending: true });
                    break;
                case 'name_desc':
                    query = query.order('name', { ascending: false });
                    break;
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading all products:', error);
            return [];
        }
    }

    convertToCSV(products) {
        const headers = ['Nombre', 'Categoría', 'Descripción', 'Estado', 'Fecha Creación'];
        const rows = products.map(product => [
            `"${product.name?.replace(/"/g, '""')}"`,
            `"${product.categories?.name?.replace(/"/g, '""')}"`,
            `"${product.description?.replace(/"/g, '""')}"`,
            `"${product.status}"`,
            `"${new Date(product.created_at).toLocaleDateString()}"`
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AdminPage();
});
