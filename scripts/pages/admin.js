// scripts/pages/admin.js
import { authManager } from '../core/auth.js';
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';
import { modalManager, productModal, categoriesModal } from '../components/modals.js';
import { Utils } from '../core/utils.js';

class AdminPage {
    constructor() {
        this.currentFilters = {
            search: '',
            category: '',
            sort: 'newest'
        };
        this.stats = null;
        this.currentPage = 1;
        this.isAuthenticated = false;
        this.managersInitialized = false;
        this.eventListenersAttached = false;
    }

    async init() {
        try {
            console.log('🔄 Inicializando AdminPage...');
            
            // VERIFICAR AUTENTICACIÓN
            const isAuth = await this.checkAuthentication();
            if (!isAuth) {
                return false;
            }
            
            // Inicializar managers
            if (!this.managersInitialized) {
                await this.initializeManagers();
                this.managersInitialized = true;
            }
            
            this.setupUI();
            
            // Configurar eventos
            if (!this.eventListenersAttached) {
                this.setupEventListeners();
                this.eventListenersAttached = true;
            }
            
            await this.loadData();
            
            console.log('✅ AdminPage initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing AdminPage:', error);
            Utils.showError('Error initializing application');
            return false;
        }
    }

    async checkAuthentication() {
        try {
            await authManager.initialize();
            
            if (!authManager.isAuthenticated()) {
                console.log('🔐 Usuario no autenticado, redirigiendo a login');
                window.location.href = 'login.html';
                return false;
            }
            
            this.isAuthenticated = true;
            return true;
            
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            window.location.href = 'login.html';
            return false;
        }
    }
    
    async initializeManagers() {
        try {
            console.log('🔄 Initializing managers...');
            
            await authManager.initialize();
            
            // Inicializar categoryManager primero ya que productManager lo necesita
            const categoryResult = await categoryManager.initialize();
            if (!categoryResult.success) {
                console.error('Failed to initialize category manager');
            }
            
            const productResult = await productManager.initialize();
            if (!productResult.success) {
                console.error('Failed to initialize product manager');
            }
            
            console.log('✅ Managers initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing managers:', error);
            throw error;
        }
    }

    setupUI() {
        this.setupTheme();
    }

    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
        
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', 
                document.documentElement.classList.contains('dark') ? 'dark' : 'light'
            );
        });
    }

    async loadData(forceRefresh = false) {
        try {
            console.log('🔄 Loading data...');
            Utils.showLoading('Loading products...');
            
            const [categoriesResult, productsResult] = await Promise.all([
                categoryManager.loadCategories(),
                productManager.loadProducts(this.currentPage, this.currentFilters)
            ]);
            
            if (!categoriesResult.success || !productsResult.success) {
                throw new Error('Failed to load data');
            }
            
            await this.loadStats();
            this.renderProducts();
            this.renderStats();
            this.renderCategoryFilters();
            
            console.log('✅ Data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            Utils.showError('Error loading data');
        } finally {
            Utils.hideLoading();
        }
    }

    async loadStats() {
        const { success, stats } = await productManager.getStats();
        if (success) {
            this.stats = stats;
        }
    }

    renderProducts() {
        const productsList = document.getElementById('adminProductsList');
        const productsCount = document.getElementById('productsCount');
        
        if (!productsList) return;
        
        const products = productManager.getProducts();
        
        if (products.length === 0) {
            productsList.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-box-open text-3xl mb-3"></i>
                    <p>No hay productos</p>
                    <button id="addFirstProduct" class="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        <i class="fas fa-plus-circle mr-2"></i> Agregar primer producto
                    </button>
                </div>
            `;
            
            const addFirstProductBtn = document.getElementById('addFirstProduct');
            if (addFirstProductBtn) {
                addFirstProductBtn.addEventListener('click', () => {
                    productModal.open();
                });
            }
            
            if (productsCount) productsCount.textContent = '0 productos';
            return;
        }
        
        if (productsCount) {
            productsCount.textContent = `${productManager.getTotalProducts()} productos`;
        }
        
        productsList.innerHTML = products.map(product => this.createProductCard(product)).join('');
        this.setupProductEvents();
        this.renderPagination();
    }

    createProductCard(product) {
        const category = product.categories || {};
        let plans = [];
        
        try {
            plans = typeof product.plans === 'string' ? 
                JSON.parse(product.plans) : 
                (product.plans || []);
        } catch (error) {
            console.error('Error parsing plans:', error);
            plans = [];
        }
        
        return `
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200 product-card" data-product-id="${product.id}">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="w-full md:w-48 h-32 flex-shrink-0">
                        <img src="${Utils.getSafeImageUrl(product.photo_url)}" alt="${product.name}" 
                             class="w-full h-full object-cover rounded-lg">
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-lg font-semibold">${product.name}</h3>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full text-white" 
                                  style="background-color: ${category.color || '#3B82F6'}">
                                ${category.name || 'Sin categoría'}
                            </span>
                        </div>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                        
                        <div class="mb-3">
                            <h4 class="text-sm font-medium mb-1">Planes:</h4>
                            <div class="space-y-1">
                                ${plans.slice(0, 2).map(plan => `
                                    <div class="flex justify-between text-xs">
                                        <span>${plan.name}</span>
                                        <span>${Utils.formatCurrency(plan.price_soles || 0, 'PEN')}</span>
                                    </div>
                                `).join('')}
                                ${plans.length > 2 ? `<div class="text-xs text-gray-500">+${plans.length - 2} más</div>` : ''}
                            </div>
                        </div>
                        
                        <div class="flex space-x-2">
                            <button class="edit-product px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600" data-id="${product.id}">
                                <i class="fas fa-edit mr-1"></i> Editar
                            </button>
                            <button class="delete-product px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600" data-id="${product.id}">
                                <i class="fas fa-trash mr-1"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupProductEvents() {
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.editProduct(productId);
            });
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.confirmDeleteProduct(productId);
            });
        });
    }

    renderPagination() {
        const pagination = document.getElementById('productsPagination');
        if (!pagination) return;
        
        const totalPages = productManager.getTotalPages();
        const currentPage = productManager.getCurrentPage();
        
        if (totalPages <= 1) {
            pagination.classList.add('hidden');
            return;
        }
        
        pagination.classList.remove('hidden');
        pagination.innerHTML = this.createPaginationHTML(currentPage, totalPages);
        
        pagination.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.changePage(page);
            });
        });
    }

    createPaginationHTML(currentPage, totalPages) {
        let html = `
            <button class="pagination-btn px-3 py-1 rounded border ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}" 
                    ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn px-3 py-1 rounded border ${i === currentPage ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        html += `
            <button class="pagination-btn px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}" 
                    ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        return html;
    }

    async changePage(page) {
        this.currentPage = page;
        Utils.showLoading(`Loading page ${page}...`);
        await productManager.loadProducts(page, this.currentFilters);
        this.renderProducts();
        Utils.hideLoading();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderCategoryFilters() {
        const filterSelect = document.getElementById('filterCategory');
        if (!filterSelect) return;
        
        const categories = categoryManager.getCategories();
        const currentValue = filterSelect.value;
        
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
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 stat-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-box"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${this.stats.totalProducts || 0}</h3>
                        <p class="text-sm text-gray-600">Total Productos</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 stat-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-tags"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${this.stats.categories?.length || 0}</h3>
                        <p class="text-sm text-gray-600">Categorías</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 stat-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-star"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${this.stats.activeProducts || 0}</h3>
                        <p class="text-sm text-gray-600">Activos</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 stat-card">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">${this.getTopCategory()}</h3>
                        <p class="text-sm text-gray-600">Categoría Principal</p>
                    </div>
                </div>
            </div>
        `;
    }

    getTopCategory() {
        if (!this.stats?.categories) return 'N/A';
        
        const topCategory = this.stats.categories.reduce((prev, current) => 
            (prev.product_count > current.product_count) ? prev : current, 
        { product_count: 0, name: 'N/A' });
        
        return topCategory.product_count > 0 ? topCategory.name : 'N/A';
    }

    setupEventListeners() {
        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                productModal.open();
            });
        }
        
        // Filters
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.currentFilters.search = searchInput.value;
                this.applyFilters();
            }, 300));
        }
        
        const filterCategory = document.getElementById('filterCategory');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.currentFilters.category = filterCategory.value;
                this.applyFilters();
            });
        }
        
        const sortSelect = document.getElementById('sortProducts');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.currentFilters.sort = sortSelect.value;
                this.applyFilters();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Manage categories button
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', async () => {
                // Asegurar que el categoryManager esté inicializado
                if (!categoryManager.isInitialized) {
                    await categoryManager.initialize();
                }
                categoriesModal.open();
            });
        }

        // View stats button
        const viewStatsBtn = document.getElementById('viewStatsBtn');
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => {
                this.openStatsModal();
            });
        }
    }

    async applyFilters() {
        this.currentPage = 1;
        Utils.showLoading('Aplicando filtros...');
        await productManager.loadProducts(this.currentPage, this.currentFilters);
        this.renderProducts();
        Utils.hideLoading();
    }

    async editProduct(productId) {
        try {
            const { success, product } = await productManager.getProductById(productId);
            if (success) {
                productModal.open(product);
            } else {
                Utils.showError('Error al cargar producto');
            }
        } catch (error) {
            console.error('Error editing product:', error);
            Utils.showError('Error al cargar producto');
        }
    }

    async confirmDeleteProduct(productId) {
        try {
            const { success, product } = await productManager.getProductById(productId);
            if (!success) {
                Utils.showError('Producto no encontrado');
                return;
            }
            
            const confirmed = await Utils.showConfirm(
                `Eliminar "${product.name}"`,
                `¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.`,
                'warning'
            );
            
            if (confirmed) {
                Utils.showLoading('Eliminando producto...');
                const result = await productManager.deleteProduct(productId);
                
                if (result.success) {
                    await this.loadData(true);
                    Utils.showSuccess('Producto eliminado correctamente');
                } else {
                    Utils.showError(result.error);
                }
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            Utils.showError('Error al eliminar producto');
        }
    }

    async handleLogout() {
        const confirmed = await Utils.showConfirm(
            'Cerrar sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            'question'
        );
        
        if (confirmed) {
            await authManager.signOut();
            window.location.href = 'login.html';
        }
    }

    openStatsModal() {
        modalManager.showModal('statsModal');
        this.renderStatsModal();
    }

    renderStatsModal() {
        const statsContent = document.getElementById('statsContent');
        if (!statsContent || !this.stats) return;
        
        statsContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white p-4 rounded-lg shadow">
                    <h4 class="font-semibold mb-3">Productos por Categoría</h4>
                    <div class="space-y-3">
                        ${this.stats.categories.map(category => `
                            <div class="flex justify-between items-center">
                                <div class="flex items-center">
                                    <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${category.color || '#3B82F6'}"></span>
                                    <span>${category.name}</span>
                                </div>
                                <span class="font-semibold">${category.product_count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bg-white p-4 rounded-lg shadow">
                    <h4 class="font-semibold mb-3">Estadísticas Rápidas</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Total Productos</span>
                            <span class="font-semibold">${this.stats.totalProducts}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Productos Activos</span>
                            <span class="font-semibold">${this.stats.activeProducts}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Categorías</span>
                            <span class="font-semibold">${this.stats.categories.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow">
                <h4 class="font-semibold mb-3">Productos Recientes</h4>
                <div class="space-y-3">
                    ${this.stats.recentProducts.map(product => `
                        <div class="flex items-center justify-between py-2 border-b border-gray-100">
                            <div class="flex items-center">
                                <img src="${Utils.getSafeImageUrl(product.photo_url)}" alt="${product.name}" class="w-10 h-10 object-cover rounded mr-3">
                                <div>
                                    <div class="font-medium">${product.name}</div>
                                    <div class="text-sm text-gray-500">${product.categories?.name || 'Sin categoría'}</div>
                                </div>
                            </div>
                            <span class="text-sm text-gray-500">${new Date(product.created_at).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🟡 Initializing AdminPage...');
        window.adminPage = new AdminPage();
        
        const success = await window.adminPage.init();
        
        if (success) {
            console.log('✅ AdminPage initialized successfully');
        } else {
            console.error('❌ Failed to initialize AdminPage');
            Utils.showError('Error initializing admin panel');
        }
    } catch (error) {
        console.error('❌ Critical error initializing AdminPage:', error);
        Utils.showError('Critical error loading application');
    }
});
