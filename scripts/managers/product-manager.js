// scripts/managers/product-manager.js
import Utils from '../core/utils.js';
import { supabaseClient } from '../core/supabase.js';

class ProductManager {
    constructor() {
        this.products = [];
        this.isLoading = false;
    }
    
    static async init() {
        const instance = new ProductManager();
        await instance.loadProducts();
        return instance;
    }
    
    async loadProducts() {
        if (this.isLoading) return this.products;
        
        this.isLoading = true;
        
        try {
            const data = await supabaseClient.getProducts();
            this.products = this.processProducts(data);
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
    
    getProducts() {
        return this.products;
    }
    
    getProductById(id) {
        return this.products.find(product => product.id == id);
    }
    
    async addProduct(productData) {
        try {
            const result = await supabaseClient.addProduct(productData);
            
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
            const result = await supabaseClient.updateProduct(id, productData);
            
            if (result) {
                const updatedProduct = this.processProducts([result])[0];
                const index = this.products.findIndex(p => p.id === id);
                if (index !== -1) this.products[index] = updatedProduct;
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
            await supabaseClient.deleteProduct(id);
            this.products = this.products.filter(p => p.id !== id);
            Utils.showSuccess('✅ Producto eliminado correctamente');
            return true;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            Utils.showError('Error al eliminar producto');
            throw error;
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
    }
};

// Hacer disponible globalmente
window.productManager = productManager;
