// scripts/managers/product-manager.js
import { Utils } from '../core/utils.js';
import { supabaseClient } from '../supabase.js';

class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.isLoading = false;
        this.listeners = new Set();
    }
    
    static async init() {
        const instance = new ProductManager();
        await instance.loadProducts();
        return instance;
    }
    
    async loadProducts() {
        if (this.isLoading) return this.products;
        
        this.isLoading = true;
        this.notifyListeners('loadingStart');
        
        try {
            const data = await supabaseClient.getProducts();
            this.products = this.processProducts(data);
            this.filteredProducts = [...this.products];
            
            this.notifyListeners('productsLoaded', this.products);
            return this.products;
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            Utils.showError('Error al cargar productos');
            this.notifyListeners('loadError', error);
            return [];
        } finally {
            this.isLoading = false;
            this.notifyListeners('loadingEnd');
        }
    }
    
    processProducts(products) {
        if (!products) return [];
        
        return products.map(product => ({
            ...product,
            plans: this.parsePlans(product.plans),
            category_name: product.categories?.name || 'Sin categoría',
            min_price: this.calculateMinPrice(product.plans)
        }));
    }
    
    parsePlans(plans) {
        if (!plans) return [];
        
        try {
            if (Array.isArray(plans)) return plans;
            if (typeof plans === 'string') return JSON.parse(plans);
            if (typeof plans === 'object') return [plans];
            return [];
        } catch {
            return [];
        }
    }
    
    calculateMinPrice(plans) {
        if (!plans?.length) return 0;
        
        const prices = plans.flatMap(plan => [
            plan.price_soles || Infinity,
            plan.price_dollars || Infinity
        ]).filter(price => price > 0 && price !== Infinity);
        
        return prices.length ? Math.min(...prices) : 0;
    }
    
    getProducts() {
        return this.products;
    }
    
    getFilteredProducts() {
        return this.filteredProducts;
    }
    
    getProductById(id) {
        return this.products.find(product => product.id == id);
    }
    
    async addProduct(productData) {
        try {
            // Validar datos antes de enviar
            if (!productData.name || !productData.category_id) {
                throw new Error('Nombre y categoría son obligatorios');
            }
            
            // Procesar planes si es necesario
            if (productData.plans && typeof productData.plans === 'string') {
                try {
                    productData.plans = JSON.parse(productData.plans);
                } catch (e) {
                    console.warn('Los planes no están en formato JSON válido', e);
                }
            }
            
            const result = await supabaseClient.addProduct(productData);
            
            if (result) {
                const newProduct = this.processProducts([result])[0];
                this.products.unshift(newProduct);
                this.filteredProducts.unshift(newProduct);
                
                this.notifyListeners('productAdded', newProduct);
                Utils.showSuccess('✅ Producto agregado correctamente');
                return newProduct;
            }
            
            return null;
        } catch (error) {
            console.error('Error al agregar producto:', error);
            Utils.showError(error.message || 'Error al agregar producto');
            throw error;
        }
    }
    
    async updateProduct(id, productData) {
        try {
            const result = await supabaseClient.updateProduct(id, productData);
            
            if (result) {
                const updatedProduct = this.processProducts([result])[0];
                const index = this.products.findIndex(p => p.id === id);
                
                if (index !== -1) {
                    this.products[index] = updatedProduct;
                    // Actualizar también en filteredProducts si existe
                    const filteredIndex = this.filteredProducts.findIndex(p => p.id === id);
                    if (filteredIndex !== -1) {
                        this.filteredProducts[filteredIndex] = updatedProduct;
                    }
                    
                    this.notifyListeners('productUpdated', updatedProduct);
                    Utils.showSuccess('✅ Producto actualizado correctamente');
                    return updatedProduct;
                }
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
            await supabaseClient.deleteProduct(id);
            
            this.products = this.products.filter(p => p.id !== id);
            this.filteredProducts = this.filteredProducts.filter(p => p.id !== id);
            
            this.notifyListeners('productDeleted', id);
            Utils.showSuccess('✅ Producto eliminado correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            Utils.showError('Error al eliminar producto');
            throw error;
        }
    }
    
    filterProducts(category = 'all', search = '', sortBy = 'name', sortOrder = 'asc') {
        let filtered = [...this.products];
        
        // Filtrar por categoría
        if (category !== 'all') {
            filtered = filtered.filter(product => product.category_id == category);
        }
        
        // Filtrar por búsqueda
        if (search) {
            const searchTerm = search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.category_name && product.category_name.toLowerCase().includes(searchTerm))
            );
        }
        
        // Ordenar
        filtered = this.sortProducts(filtered, sortBy, sortOrder);
        
        this.filteredProducts = filtered;
        this.notifyListeners('productsFiltered', filtered);
        
        return filtered;
    }
    
    sortProducts(products, field, order = 'asc') {
        return [...products].sort((a, b) => {
            let aValue, bValue;
            
            switch (field) {
                case 'name':
                    aValue = a.name?.toLowerCase() || '';
                    bValue = b.name?.toLowerCase() || '';
                    break;
                case 'price':
                    aValue = a.min_price || 0;
                    bValue = b.min_price || 0;
                    break;
                case 'category':
                    aValue = a.category_name?.toLowerCase() || '';
                    bValue = b.category_name?.toLowerCase() || '';
                    break;
                case 'date':
                    aValue = new Date(a.created_at || 0).getTime();
                    bValue = new Date(b.created_at || 0).getTime();
                    break;
                default:
                    aValue = a[field] || '';
                    bValue = b[field] || '';
            }
            
            if (aValue === bValue) return 0;
            
            const comparison = aValue < bValue ? -1 : 1;
            return order === 'asc' ? comparison : -comparison;
        });
    }
    
    // Sistema de eventos
    addListener(event, callback) {
        this.listeners.add({ event, callback });
    }
    
    removeListener(event, callback) {
        for (const listener of this.listeners) {
            if (listener.event === event && listener.callback === callback) {
                this.listeners.delete(listener);
                break;
            }
        }
    }
    
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            if (listener.event === event) {
                try {
                    listener.callback(data);
                } catch (error) {
                    console.error(`Error en listener para evento ${event}:`, error);
                }
            }
        }
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
export const productManager = {
    async loadProducts() {
        const manager = await getProductManager();
        return manager.loadProducts();
    },

    getProducts() {
        return productManagerInstance ? productManagerInstance.getProducts() : [];
    },
    
    getFilteredProducts() {
        return productManagerInstance ? productManagerInstance.getFilteredProducts() : [];
    },

    getProductById(id) {
        return productManagerInstance ? productManagerInstance.getProductById(id) : null;
    },

    async addProduct(productData) {
        const manager = await getProductManager();
        return manager.addProduct(productData);
    },

    async updateProduct(id, productData) {
        const manager = await getProductManager();
        return manager.updateProduct(id, productData);
    },

    async deleteProduct(id) {
        const manager = await getProductManager();
        return manager.deleteProduct(id);
    },
    
    filterProducts(category, search, sortBy, sortOrder) {
        return productManagerInstance ? 
            productManagerInstance.filterProducts(category, search, sortBy, sortOrder) : [];
    },
    
    addListener(event, callback) {
        if (productManagerInstance) {
            productManagerInstance.addListener(event, callback);
        }
    },
    
    removeListener(event, callback) {
        if (productManagerInstance) {
            productManagerInstance.removeListener(event, callback);
        }
    }
};

// Hacer disponible globalmente
window.productManager = productManager;
