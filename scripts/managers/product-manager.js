// scripts/managers/product-manager.js
import { supabaseClient } from '../supabase.js';
import { Utils } from '../core/utils.js';

class ProductManager {
  constructor() {
    this.products = [];
  }

  async loadProducts() {
    try {
      this.products = await supabaseClient.getProducts();
      return this.products;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  getProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find(product => product.id == id);
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

  async addProduct(productData) {
    try {
      const newProduct = await supabaseClient.addProduct(productData);
      if (newProduct) {
        this.products.unshift(newProduct);
        return newProduct;
      }
      return null;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(id, productData) {
    try {
      const updatedProduct = await supabaseClient.updateProduct(id, productData);
      if (updatedProduct) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }
        return updatedProduct;
      }
      return null;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const success = await supabaseClient.deleteProduct(id);
      if (success) {
        this.products = this.products.filter(p => p.id !== id);
      }
      return success;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
}

let productManagerInstance = null;

export async function getProductManager() {
  if (!productManagerInstance) {
    productManagerInstance = new ProductManager();
    await productManagerInstance.loadProducts();
  }
  return productManagerInstance;
}
