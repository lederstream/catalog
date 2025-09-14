// scripts/pages/admin.js
import { Utils } from '../core/utils.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { getProductManager } from '../managers/product-manager.js';
import { AuthManagerFunctions } from '../core/auth.js';
import { initModals, openProductModal, showDeleteConfirm } from '../components/modals.js';

class AdminPage {
    constructor() {
        this.isInitialized = false;
        this.state = {
            products: [],
            categories: [],
            currentFilter: { category: '', search: '', sort: 'newest' }
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.showLoadingState(true);
            
            // Verificar autenticación
            await this.checkAuthentication();
            
            // Inicializar managers
            await this.initializeManagers();
            
            // Cargar datos
            await this.loadData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error inicializando panel admin:', error);
            this.handleInitializationError(error);
        } finally {
            this.showLoadingState(false);
        }
    }

    async checkAuthentication() {
        try {
            const isAuthenticated = await AuthManagerFunctions.isAuthenticated();
            if (!isAuthenticated) {
                throw new Error('Usuario no autenticado');
            }
        } catch (error) {
            console.error('Error en autenticación:', error);
            throw new Error('Error de autenticación');
        }
    }

    async initializeManagers() {
        this.categoryManager = await getCategoryManager();
        this.productManager = await getProductManager();
    }

    async loadData() {
        try {
            const [products, categories] = await Promise.all([
                this.productManager.loadProducts(),
                this.categoryManager.loadCategories()
            ]);

            this.state.products = products;
            this.state.categories = categories;
            
            this.renderCategoriesFilter();
            this.renderProductsList();
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            throw error;
        }
    }

    renderCategoriesFilter() {
        const filterCategory = document.getElementById('filterCategory');
        if (!filterCategory) return;
        
        filterCategory.innerHTML = `
            <option value="">Todas las categorías</option>
            ${this.state.categories.map(category => `
                <option value="${category.id}">${category.name}</option>
            `).join('')}
        `;
    }

    renderProductsList() {
        const productsList = document.getElementById('adminProductsList');
        if (!productsList) return;
        
        const filteredProducts = this.filterProducts();
        
        if (filteredProducts.length === 0) {
            productsList.innerHTML = this.getNoProductsHTML();
            return;
        }
        
        productsList.innerHTML = filteredProducts.map(product => this.renderProductCard(product)).join('');
        this.addProductCardEventListeners();
    }

    filterProducts() {
        let filtered = [...this.state.products];
        
        if (this.state.currentFilter.search) {
            const searchTerm = this.state.currentFilter.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        if (this.state.currentFilter.category) {
            filtered = filtered.filter(product => 
                product.category_id == this.state.currentFilter.category
            );
        }
        
        return filtered.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    renderProductCard(product) {
        return `
            <div class="product-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4 mb-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">${Utils.escapeHtml(product.name)}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        ${this.getCategoryName(product.category_id)}
                    </span>
                </div>
                <p class="text-gray-600 mt-2">${Utils.escapeHtml(product.description || 'Sin descripción')}</p>
                <div class="flex justify-end mt-4 space-x-2">
                    <button class="edit-product px-3 py-1 bg-blue-500 text-white rounded" data-id="${product.id}">
                        Editar
                    </button>
                    <button class="delete-product px-3 py-1 bg-red-500 text-white rounded" data-id="${product.id}">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }

    addProductCardEventListeners() {
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                this.editProduct(productId);
            });
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                this.deleteProduct(productId);
            });
        });
    }

    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.state.currentFilter.search = e.target.value;
                this.renderProductsList();
            }, 300));
        }
        
        // Filtro de categoría
        const filterCategory = document.getElementById('filterCategory');
        if (filterCategory) {
            filterCategory.addEventListener('change', (e) => {
                this.state.currentFilter.category = e.target.value;
                this.renderProductsList();
            });
        }
        
        // Botones principales
        this.setupActionButtons();
    }

    setupActionButtons() {
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => openProductModal());
        }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogout() {
        try {
            await AuthManagerFunctions.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    showLoadingState(show) {
        const loader = document.getElementById('loadingIndicator');
        const content = document.getElementById('adminContent');
        
        if (loader) loader.classList.toggle('hidden', !show);
        if (content) content.style.opacity = show ? '0.5' : '1';
    }

    handleInitializationError(error) {
        if (error.message.includes('autenticación') || error.message.includes('autenticado')) {
            setTimeout(() => window.location.href = 'login.html', 1000);
        }
    }

    getCategoryName(categoryId) {
        const category = this.state.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sin categoría';
    }

    async editProduct(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (product) {
            openProductModal(product);
        }
    }

    async deleteProduct(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (product) {
            showDeleteConfirm(productId, product.name);
        }
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    const adminPage = new AdminPage();
    await adminPage.initialize();
});
