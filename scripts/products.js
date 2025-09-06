// scripts/products.js
import { 
    addProductToSupabase, 
    updateProductInSupabase, 
    deleteProductFromSupabase, 
    loadProductsFromSupabase 
} from './supabase.js';
import { Utils } from './utils.js';
import { getCategoryManager } from './categories.js';

class ProductManager {
    constructor() {
        this.products = [];
        this.isLoading = false;
        this.currentProduct = null;
    }
    
    static async init() {
        const instance = new ProductManager();
        await instance.loadProducts();
        return instance;
    }
    
    async loadProducts() {
        if (this.isLoading) return this.products;
        
        this.isLoading = true;
        Utils.showInfo('📦 Cargando productos...');
        
        try {
            const data = await loadProductsFromSupabase();
            this.products = this.processProducts(data);
            Utils.showSuccess(`✅ ${this.products.length} productos cargados`);
            return this.products;
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            Utils.showError('Error al cargar productos');
            return [];
        } finally {
            this.isLoading = false;
        }
    }
    
    processProducts(products) {
        return products.map(product => ({
            ...product,
            plans: this.parsePlans(product.plans),
            category_name: product.categories?.name || 'Sin categoría',
            category_color: product.categories?.color || 'blue'
        }));
    }
    
    parsePlans(plans) {
        if (!plans) return [];
        
        try {
            if (typeof plans === 'string') {
                return JSON.parse(plans);
            } else if (Array.isArray(plans)) {
                return plans;
            } else if (typeof plans === 'object') {
                return [plans];
            }
            return [];
        } catch {
            return [];
        }
    }
    
    getProducts() {
        return this.products;
    }
    
    getProductById(id) {
        return this.products.find(product => product.id == id);
    }
    
    filterProducts(category = 'all', search = '') {
        let filtered = [...this.products];
        
        if (category !== 'all') {
            filtered = filtered.filter(product => product.category_id == category);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchLower) ||
                (product.description && product.description.toLowerCase().includes(searchLower)) ||
                (product.categories && product.categories.name.toLowerCase().includes(searchLower))
            );
        }
        
        return filtered;
    }
    
    getProductMinPrice(product) {
        if (!product.plans || product.plans.length === 0) return 0;
        
        const prices = product.plans
            .filter(plan => plan && typeof plan === 'object')
            .map(plan => {
                const soles = parseFloat(plan.price_soles) || Infinity;
                const dollars = parseFloat(plan.price_dollars) || Infinity;
                return Math.min(soles, dollars);
            })
            .filter(price => price > 0 && isFinite(price));
        
        return prices.length > 0 ? Math.min(...prices) : 0;
    }
    
    async addProduct(productData) {
        try {
            const result = await addProductToSupabase(productData);
            
            if (result) {
                const newProduct = this.processProducts([result])[0];
                this.products.unshift(newProduct);
                Utils.showSuccess('✅ Producto agregado correctamente');
                return newProduct;
            }
            
            return null;
        } catch (error) {
            console.error('Error al agregar producto:', error);
            Utils.showError('Error al agregar producto');
            throw error;
        }
    }
    
    async updateProduct(id, productData) {
        try {
            const result = await updateProductInSupabase(id, productData);
            
            if (result) {
                const updatedProduct = this.processProducts([result])[0];
                const index = this.products.findIndex(p => p.id === id);
                if (index !== -1) {
                    this.products[index] = updatedProduct;
                }
                Utils.showSuccess('✅ Producto actualizado correctamente');
                return updatedProduct;
            }
            
            return null;
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            Utils.showError('Error al actualizar producto');
            throw error;
        }
    }
    
    async deleteProduct(id) {
        try {
            await deleteProductFromSupabase(id);
            this.products = this.products.filter(p => p.id !== id);
            Utils.showSuccess('✅ Producto eliminado correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            Utils.showError('Error al eliminar producto');
            throw error;
        }
    }
    
    renderProductsGrid(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = this.getEmptyProductsHTML();
            return;
        }
        
        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
        this.attachProductEventListeners(container);
    }
    
    createProductCard(product) {
        const minPrice = this.getProductMinPrice(product);
        
        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
                <div class="h-48 bg-gray-100 overflow-hidden relative">
                    <img src="${product.photo_url || 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                    <div class="absolute top-3 right-3">
                        <span class="bg-${product.category_color || 'blue'}-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            ${product.category_name}
                        </span>
                    </div>
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                </div>
                
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || 'Sin descripción'}</p>
                    
                    <div class="flex items-center justify-between mt-4">
                        <div class="text-blue-600 font-bold text-lg">
                            ${Utils.formatCurrency(minPrice)}
                        </div>
                        <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-all duration-200 transform hover:scale-105"
                                data-product-id="${product.id}">
                            <i class="fas fa-eye mr-1"></i>
                            Ver
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getEmptyProductsHTML() {
        return `
            <div class="col-span-full text-center py-16 animate-pulse">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500">Intenta con otros términos de búsqueda</p>
            </div>
        `;
    }
    
    attachProductEventListeners(container) {
        container.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.showProductDetails(productId);
            });
        });
    }
    
    showProductDetails(productId) {
        const product = this.getProductById(productId);
        if (product && typeof window.showProductModal === 'function') {
            window.showProductModal(product);
        }
    }
    
    // Métodos para admin panel
    renderAdminProductsList(products, container) {
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = this.getAdminEmptyStateHTML();
            return;
        }
        
        container.innerHTML = products.map((product, index) => `
            <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4 transition-all duration-300 hover:shadow-md fade-in-up" 
                 style="animation-delay: ${index * 50}ms">
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src="${product.photo_url || 'https://via.placeholder.com/64?text=Imagen'}" 
                                 alt="${product.name}" 
                                 class="w-full h-full object-cover"
                                 onerror="this.src='https://via.placeholder.com/64?text=Error'">
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${product.name}</h4>
                            <p class="text-sm text-gray-500 mt-1 line-clamp-2">${product.description || 'Sin descripción'}</p>
                            <div class="flex items-center mt-2 space-x-2">
                                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    ${product.categories ? product.categories.name : 'Sin categoría'}
                                </span>
                                <span class="text-xs text-gray-500">
                                    ${product.plans ? product.plans.length : 0} planes
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-product bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 transform hover:scale-105" 
                                data-id="${product.id}"
                                title="Editar producto">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-product bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors duration-200 transform hover:scale-105" 
                                data-id="${product.id}"
                                title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.attachAdminEventListeners(container, products);
    }
    
    getAdminEmptyStateHTML() {
        return `
            <div class="text-center py-12 fade-in-up">
                <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-500">No hay productos</h3>
                <p class="text-gray-400 mt-2">Agrega tu primer producto para comenzar</p>
            </div>
        `;
    }
    
    attachAdminEventListeners(container, products) {
        container.querySelectorAll('.edit-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                if (typeof window.editProduct === 'function') {
                    window.editProduct(productId);
                }
            });
        });
        
        container.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                const product = products.find(p => p.id == productId);
                
                if (product && typeof window.showConfirmationModal === 'function') {
                    window.showConfirmationModal({
                        title: 'Eliminar producto',
                        message: `¿Estás seguro de que deseas eliminar "${product.name}"?`,
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        type: 'danger',
                        onConfirm: () => {
                            this.deleteProduct(productId).then(success => {
                                if (success) {
                                    this.renderAdminProductsList(
                                        this.products.filter(p => p.id != productId), 
                                        container
                                    );
                                }
                            });
                        }
                    });
                }
            });
        });
    }
}

// Singleton instance
let productManagerInstance = null;

export async function getProductManager() {
    if (!productManagerInstance) {
        productManagerInstance = await ProductManager.init();
    }
    return productManagerInstance;
}

// Funciones de compatibilidad
export async function loadProducts() {
    const manager = await getProductManager();
    return manager.loadProducts();
}

export function getProducts() {
    return productManagerInstance ? productManagerInstance.getProducts() : [];
}

export function getProductById(id) {
    return productManagerInstance ? productManagerInstance.getProductById(id) : null;
}

export function filterProducts(category, search) {
    return productManagerInstance ? productManagerInstance.filterProducts(category, search) : [];
}

export async function addProduct(productData) {
    const manager = await getProductManager();
    return manager.addProduct(productData);
}

export async function updateProduct(id, productData) {
    const manager = await getProductManager();
    return manager.updateProduct(id, productData);
}

export async function deleteProduct(id) {
    const manager = await getProductManager();
    return manager.deleteProduct(id);
}

export function renderProductsGrid(products, containerId) {
    if (productManagerInstance) {
        productManagerInstance.renderProductsGrid(products, containerId);
    }
}

export function renderAdminProductsList(products, container) {
    if (productManagerInstance) {
        productManagerInstance.renderAdminProductsList(products, container);
    }
}

// Hacer disponible globalmente
window.ProductManager = ProductManager;
window.productManager = getProductManager;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    window.productManager = await getProductManager();
});
