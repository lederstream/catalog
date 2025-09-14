// scripts/pages/admin.js
import { Utils } from '../core/utils.js';
import { AuthManagerFunctions } from '../core/auth.js';
import { getProductManager } from '../managers/product-manager.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { openProductModal, showDeleteConfirm, openCategoriesModal, openStatsModal } from '../components/modals.js';
import { setupAllEventListeners } from '../event-listeners.js';

class AdminPage {
    constructor() {
        this.currentFilter = {
            search: '',
            category: '',
            sort: 'newest'
        };
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.products = [];
        this.categories = [];
    }

    async init() {
        try {
            // Verificar autenticación
            const isAuthenticated = await AuthManagerFunctions.isAuthenticated();
            if (!isAuthenticated) {
                window.location.href = 'login.html';
                return;
            }

            // Cargar datos
            await this.loadData();

            // Configurar event listeners
            this.setupEventListeners();

            // Configurar listeners globales
            setupAllEventListeners(this);

            console.log('✅ AdminPage inicializada correctamente');
        } catch (error) {
            console.error('Error inicializando AdminPage:', error);
            Utils.showError('Error al cargar el panel de administración');
        }
    }

    async loadData() {
        try {
            // Mostrar estado de carga
            document.getElementById('adminProductsList').innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="loading-spinner mx-auto mb-3"></div>
                    <p>Cargando productos...</p>
                </div>
            `;

            // Cargar productos y categorías
            const [productManager, categoryManager] = await Promise.all([
                getProductManager(),
                getCategoryManager()
            ]);

            this.products = productManager.getProducts();
            this.categories = categoryManager.getCategories();

            // Actualizar interfaz
            this.updateCategoriesFilter();
            this.renderProducts();
            this.updateStatsSummary();
            this.updateProductsCount();

        } catch (error) {
            console.error('Error loading data:', error);
            document.getElementById('adminProductsList').innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                    <p>Error al cargar los productos</p>
                    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="window.adminPage.loadData()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    updateCategoriesFilter() {
        const filterCategory = document.getElementById('filterCategory');
        if (!filterCategory) return;

        // Limpiar opciones excepto la primera
        while (filterCategory.options.length > 1) {
            filterCategory.remove(1);
        }

        // Añadir categorías
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterCategory.appendChild(option);
        });
    }

    renderProducts() {
        const container = document.getElementById('adminProductsList');
        if (!container) return;

        // Filtrar productos
        let filteredProducts = [...this.products];
        
        // Aplicar filtro de búsqueda
        if (this.currentFilter.search) {
            const searchTerm = this.currentFilter.search.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) || 
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Aplicar filtro de categoría
        if (this.currentFilter.category) {
            filteredProducts = filteredProducts.filter(product => 
                product.category_id == this.currentFilter.category
            );
        }
        
        // Aplicar ordenamiento
        filteredProducts = this.sortProducts(filteredProducts, this.currentFilter.sort);

        // Mostrar mensaje si no hay productos
        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-search text-3xl mb-3"></i>
                    <p>No se encontraron productos</p>
                    <p class="text-sm mt-1">Intenta con otros filtros o crea un nuevo producto</p>
                </div>
            `;
            return;
        }

        // Renderizar productos
        container.innerHTML = filteredProducts.map(product => this.createProductCard(product)).join('');
        
        // Configurar event listeners para los botones
        this.setupProductCardEventListeners();
    }

    sortProducts(products, sortBy) {
        const sorted = [...products];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'name_asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name_desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return sorted;
        }
    }

    createProductCard(product) {
        const category = this.categories.find(c => c.id === product.category_id);
        const categoryName = category ? category.name : 'Sin categoría';
        const plans = Utils.safeParseJSON(product.plans);
        const minPrice = this.getProductMinPrice(product);
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4" data-id="${product.id}">
                <div class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    <img src="${product.photo_url || 'https://via.placeholder.com/80x80?text=Sin+imagen'}" 
                         alt="${Utils.escapeHtml(product.name)}" 
                         class="w-full h-full object-cover"
                         onerror="this.src='https://via.placeholder.com/80x80?text=Error'">
                </div>
                
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-800 truncate">${Utils.escapeHtml(product.name)}</h4>
                    <p class="text-sm text-gray-500 mt-1">${categoryName}</p>
                    <p class="text-sm text-gray-600 mt-2 line-clamp-2">${Utils.escapeHtml(product.description || 'Sin descripción')}</p>
                </div>
                
                <div class="flex flex-col md:flex-row items-start md:items-center gap-2">
                    <div class="text-right">
                        <span class="font-bold text-blue-600">${Utils.formatCurrency(minPrice)}</span>
                        ${plans && plans.length > 1 ? 
                            `<span class="text-xs text-gray-500 block mt-1">${plans.length} planes</span>` : ''}
                    </div>
                    
                    <div class="flex gap-2 mt-2 md:mt-0">
                        <button class="edit-product px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200" data-id="${product.id}">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button class="delete-product px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200" data-id="${product.id}">
                            <i class="fas fa-trash mr-1"></i>Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getProductMinPrice(product) {
        const plans = Utils.safeParseJSON(product.plans);
        if (!plans || !plans.length) return Infinity;
        
        const validPrices = plans.flatMap(plan => [
            plan.price_soles || Infinity,
            plan.price_dollars ? plan.price_dollars * 3.7 : Infinity
        ]).filter(price => price > 0 && price !== Infinity);
        
        return validPrices.length ? Math.min(...validPrices) : Infinity;
    }

    setupProductCardEventListeners() {
        // Botones de editar
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                const product = this.products.find(p => p.id == productId);
                if (product) {
                    openProductModal(product);
                }
            });
        });
        
        // Botones de eliminar
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                const product = this.products.find(p => p.id == productId);
                if (product) {
                    showDeleteConfirm(product);
                }
            });
        });
    }

    updateStatsSummary() {
        const statsContainer = document.getElementById('statsSummary');
        if (!statsContainer) return;
        
        const totalProducts = this.products.length;
        const totalCategories = this.categories.length;
        
        // Calcular productos recientes (últimos 7 días)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentProducts = this.products.filter(p => 
            new Date(p.created_at) >= weekAgo
        ).length;
        
        // Calcular productos con imagen
        const productsWithImage = this.products.filter(p => 
            p.photo_url && p.photo_url.startsWith('http')
        ).length;
        
        statsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <i class="fas fa-box text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold">${totalProducts}</p>
                        <p class="text-gray-500">Productos totales</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <i class="fas fa-tags text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold">${totalCategories}</p>
                        <p class="text-gray-500">Categorías</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                        <i class="fas fa-clock text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold">${recentProducts}</p>
                        <p class="text-gray-500">Recientes (7 días)</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                        <i class="fas fa-image text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold">${productsWithImage}</p>
                        <p class="text-gray-500">Con imagen</p>
                    </div>
                </div>
            </div>
        `;
    }

    updateProductsCount() {
        const countElement = document.getElementById('productsCount');
        if (countElement) {
            countElement.textContent = `${this.products.length} producto${this.products.length !== 1 ? 's' : ''}`;
        }
    }

    setupEventListeners() {
        // Botón para agregar producto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => openProductModal());
        }
        
        // Botón para gestionar categorías
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', () => openCategoriesModal());
        }
        
        // Botón para ver estadísticas
        const viewStatsBtn = document.getElementById('viewStatsBtn');
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => {
                openStatsModal({
                    totalProducts: this.products.length,
                    totalCategories: this.categories.length,
                    recentProducts: this.products.filter(p => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(p.created_at) >= weekAgo;
                    }).length,
                    activeProducts: this.products.length // Asumiendo que todos están activos
                });
            });
        }
    }

    // Handlers para event-listeners.js
    handleSearch(e) {
        this.currentFilter.search = e.target.value.toLowerCase();
        this.renderProducts();
    }

    handleFilterChange(e) {
        this.currentFilter.category = e.target.value;
        this.renderProducts();
    }

    handleSortChange(e) {
        this.currentFilter.sort = e.target.value;
        this.renderProducts();
    }

    async handleLogout() {
        try {
            const success = await AuthManagerFunctions.signOut();
            if (success) {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error during logout:', error);
            Utils.showError('Error al cerrar sesión');
        }
    }

    handleAuthenticationChange(event, user) {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.adminPage = new AdminPage();
    await window.adminPage.init();
});
