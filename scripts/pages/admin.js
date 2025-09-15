// scripts/pages/admin.js
import { authManager } from '../core/auth.js';
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';
import { modalManager, productModal } from '../components/modals.js';
import { ProductCard } from '../components/product-card.js';
import { Utils } from '../core/utils.js';

class AdminPage {
    constructor() {
        this.currentFilters = {
            search: '',
            category: '',
            sort: 'newest'
        };
    }

    async init() {
        try {
            console.log('🔄 Inicializando AdminPage...');
            
            // Check authentication
            if (!authManager.requireAuth()) {
                console.error('❌ Authentication required');
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
            if (!authResult.success) {
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
                productManager.loadProducts(1, this.currentFilters)
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
            if (emptyState) emptyState.classList.remove('hidden');
            if (productsCount) productsCount.textContent = '0 products';
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        // Update counter
        if (productsCount) {
            productsCount.textContent = `${productManager.getTotalProducts()} products`;
        }
        
        // Render products
        productsList.innerHTML = products.map(product => 
            ProductCard.create(product, true)
        ).join('');
        
        // Setup events
        this.setupProductEvents();
        
        // Render pagination
        this.renderPagination();
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
            <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Show max 5 pages around current
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        html += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        return html;
    }

    async changePage(page) {
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
            <div class="stats-card bg-gradient-to-br from-blue-50 to-blue-100">
                <div class="stats-icon bg-blue-500">
                    <i class="fas fa-box"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.totalProducts}</h3>
                    <p>Total Products</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-green-50 to-green-100">
                <div class="stats-icon bg-green-500">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.categories?.length || 0}</h3>
                    <p>Categories</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-purple-50 to-purple-100">
                <div class="stats-icon bg-purple-500">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.stats.activeProducts || 0}</h3>
                    <p>Active</p>
                </div>
            </div>
            
            <div class="stats-card bg-gradient-to-br from-orange-50 to-orange-100">
                <div class="stats-icon bg-orange-500">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stats-content">
                    <h3>${this.getTopCategory()}</h3>
                    <p>Top Category</p>
                </div>
            </div>
        `;
    }

    getTopCategory() {
        if (!this.stats?.categories) return 'N/A';
        
        const topCategory = this.stats.categories.reduce((prev, current) => 
            (prev.product_count > current.product_count) ? prev : current, 
        { product_count: 0 });
        
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
    }

    async applyFilters() {
        Utils.showLoading('Applying filters...');
        await productManager.loadProducts(1, this.currentFilters);
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
            await authManager.logout();
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
