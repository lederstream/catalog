// scripts/pages/admin.js
import { authManager } from '../core/auth.js';
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';
import { modalManager, productModal } from '../components/modals.js';
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
    }

    async init() {
        try {
            console.log('🔄 Inicializando AdminPage...');
            
            // Check authentication
            const isAuth = await this.checkAuthentication();
            if (!isAuth) {
                console.log('❌ Acceso no autorizado al panel admin');
                return false;
            }
                        
            // Initialize managers
            await this.initializeManagers();
            
            // Setup UI and event listeners
            this.setupUI();
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            console.log('✅ AdminPage initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing AdminPage:', error);
            Utils.showError('Error initializing application');
            return false;
        }
    }

    async initializeManagers() {
        try {
            console.log('🔄 Initializing managers...');
            
            // Initialize auth first
            const authResult = await authManager.initialize();
            if (!authResult) {
                throw new Error('Auth initialization failed');
            }
            
            // Initialize category and product managers
            const [categoryResult, productResult] = await Promise.all([
                categoryManager.initialize(),
                productManager.initialize()
            ]);
            
            if (!categoryResult.success || !productResult.success) {
                throw new Error('Managers initialization failed');
            }
            
            console.log('✅ Managers initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing managers:', error);
            throw error;
        }
    }

    setupUI() {
        this.setupTheme();
        this.setupTooltips();
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

    setupTooltips() {
        // Simple tooltip implementation
        const elements = document.querySelectorAll('[data-tooltip]');
        elements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'fixed z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg';
                tooltip.textContent = el.dataset.tooltip;
                tooltip.style.top = `${e.clientY + 15}px`;
                tooltip.style.left = `${e.clientX}px`;
                tooltip.id = 'current-tooltip';
                
                document.body.appendChild(tooltip);
            });
            
            el.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('current-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }

    async loadData() {
        try {
            console.log('🔄 Loading data...');
            Utils.showLoading('Loading products...');
            
            // Load categories and products
            const [categoriesResult, productsResult] = await Promise.all([
                categoryManager.loadCategories(),
                productManager.loadProducts(this.currentPage, this.currentFilters)
            ]);
            
            if (!categoriesResult.success || !productsResult.success) {
                throw new Error('Failed to load data');
            }
            
            // Load stats and render everything
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
        const emptyState = document.getElementById('emptyState');
        
        if (!productsList) return;
        
        const products = productManager.getProducts();
        
        if (products.length === 0) {
            productsList.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
                productsList.appendChild(emptyState);
            }
            if (productsCount) productsCount.textContent = '0 products';
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        // Update counter
        if (productsCount) {
            productsCount.textContent = `${productManager.getTotalProducts()} products`;
        }
        
        // Render products
        productsList.innerHTML = products.map(product => this.createProductCard(product)).join('');
        
        // Setup events
        this.setupProductEvents();
        
        // Render pagination
        this.renderPagination();
    }

    createProductCard(product) {
        const category = product.categories || {};
        const plans = typeof product.plans === 'string' ? JSON.parse(product.plans) : (product.plans || []);
        
        return `
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="w-full md:w-48 h-32 flex-shrink-0">
                        <img src="${product.photo_url}" alt="${product.name}" 
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
        
        // Setup pagination events
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
        
        // Show max 5 pages around current
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
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderCategoryFilters() {
        const filterSelect = document.getElementById('filterCategory');
        if (!filterSelect) return;
        
        const categories = categoryManager.getCategories();
        
        // Keep current selected value
        const currentValue = filterSelect.value;
        
        filterSelect.innerHTML = `
            <option value="">All categories</option>
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
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-box"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${this.stats.totalProducts || 0}</h3>
                        <p class="text-sm text-gray-600">Total Products</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-tags"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${this.stats.categories?.length || 0}</h3>
                        <p class="text-sm text-gray-600">Categories</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-star"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${this.stats.activeProducts || 0}</h3>
                        <p class="text-sm text-gray-600">Active</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white mr-3">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">${this.getTopCategory()}</h3>
                        <p class="text-sm text-gray-600">Top Category</p>
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
        
        // Reload button
        const reloadBtn = document.getElementById('reloadBtn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                this.loadData();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
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
            manageCategoriesBtn.addEventListener('click', () => {
                this.openCategoriesModal();
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
        Utils.showLoading('Applying filters...');
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
                Utils.showError('Error loading product');
            }
        } catch (error) {
            console.error('Error editing product:', error);
            Utils.showError('Error loading product');
        }
    }

    async confirmDeleteProduct(productId) {
        try {
            const { success, product } = await productManager.getProductById(productId);
            if (!success) {
                Utils.showError('Product not found');
                return;
            }
            
            const confirmed = await Utils.showConfirm(
                `Delete "${product.name}"`,
                `Are you sure you want to delete this product? This action cannot be undone.`,
                'warning'
            );
            
            if (confirmed) {
                Utils.showLoading('Deleting product...');
                await productManager.deleteProduct(productId);
                await this.loadData();
                Utils.showSuccess('Product deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            Utils.showError('Error deleting product');
        }
    }

    async handleLogout() {
        const confirmed = await Utils.showConfirm(
            'Logout',
            'Are you sure you want to logout?',
            'question'
        );
        
        if (confirmed) {
            await authManager.signOut();
            window.location.href = 'login.html';
        }
    }

    async exportData() {
        try {
            Utils.showLoading('Exporting data...');
            
            const products = productManager.getProducts();
            const csvContent = this.convertToCSV(products);
            
            this.downloadCSV(csvContent, 'products.csv');
            
            Utils.showSuccess('Data exported successfully');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            Utils.showError('Error exporting data');
        }
    }

    convertToCSV(products) {
        const headers = ['Name', 'Category', 'Description', 'Status', 'Creation Date'];
        const rows = products.map(product => [
            `"${product.name}"`,
            `"${product.categories?.name || 'No category'}"`,
            `"${product.description}"`,
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

    openCategoriesModal() {
        modalManager.showModal('categoriesModal');
        this.renderCategoriesList();
    }

    renderCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        const categories = categoryManager.getCategories();
        
        if (categories.length === 0) {
            categoriesList.innerHTML = '<p class="text-gray-500 text-center py-4">No categories found</p>';
            return;
        }
        
        categoriesList.innerHTML = categories.map(category => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <span class="w-4 h-4 rounded-full mr-3" style="background-color: ${category.color || '#3B82F6'}"></span>
                    <span>${category.name}</span>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-category text-blue-600 hover:text-blue-800" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-category text-red-600 hover:text-red-800" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        categoriesList.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                this.confirmDeleteCategory(categoryId);
            });
        });
    }

    async confirmDeleteCategory(categoryId) {
        const category = categoryManager.getCategoryById(categoryId);
        if (!category) return;
        
        const confirmed = await Utils.showConfirm(
            `Delete "${category.name}"`,
            `Are you sure you want to delete this category? Products in this category will not be deleted but will lose their category association.`,
            'warning'
        );
        
        if (confirmed) {
            Utils.showLoading('Deleting category...');
            const result = await categoryManager.deleteCategory(categoryId);
            
            if (result.success) {
                this.renderCategoriesList();
                this.renderCategoryFilters();
                Utils.showSuccess('Category deleted successfully');
            } else {
                Utils.showError(result.error);
            }
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
                    <h4 class="font-semibold mb-3">Products by Category</h4>
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
                    <h4 class="font-semibold mb-3">Quick Stats</h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Total Products</span>
                            <span class="font-semibold">${this.stats.totalProducts}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Active Products</span>
                            <span class="font-semibold">${this.stats.activeProducts}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Categories</span>
                            <span class="font-semibold">${this.stats.categories.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow">
                <h4 class="font-semibold mb-3">Recent Products</h4>
                <div class="space-y-3">
                    ${this.stats.recentProducts.map(product => `
                        <div class="flex items-center justify-between py-2 border-b border-gray-100">
                            <div class="flex items-center">
                                <img src="${product.photo_url}" alt="${product.name}" class="w-10 h-10 object-cover rounded mr-3">
                                <div>
                                    <div class="font-medium">${product.name}</div>
                                    <div class="text-sm text-gray-500">${product.categories?.name || 'No category'}</div>
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
