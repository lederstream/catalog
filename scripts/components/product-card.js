// scripts/components/product-card.js
import { supabase } from '../supabase.js';
import { Utils } from '../core/utils.js';

export class ProductManager {
    constructor() {
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalProducts = 0;
        this.currentFilters = {
            category: '',
            search: '',
            sort: 'newest'
        };
        this.isInitialized = false;
    }

    async loadProducts(page = 1, filters = {}) {
        try {
            this.currentPage = page;
            this.currentFilters = { ...this.currentFilters, ...filters };
            
            // Build query
            let query = supabase
                .from('products')
                .select('*, categories(name, color)', { count: 'exact' });
            
            // Apply filters
            if (this.currentFilters.category) {
                query = query.eq('category_id', this.currentFilters.category);
            }
            
            if (this.currentFilters.search) {
                query = query.ilike('name', `%${this.currentFilters.search}%`);
            }
            
            // Apply sorting
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
                default:
                    query = query.order('created_at', { ascending: false });
            }
            
            // Apply pagination
            const from = (page - 1) * this.itemsPerPage;
            const to = from + this.itemsPerPage - 1;
            query = query.range(from, to);
            
            // Execute query
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            this.products = data || [];
            this.totalProducts = count || 0;
            
            return { success: true, products: this.products, total: this.totalProducts };
        } catch (error) {
            console.error('Error loading products:', error.message);
            return { success: false, error: error.message };
        }
    }

    async initialize() {
        try {
            await this.loadProducts(1, this.currentFilters);
            this.isInitialized = true;
            return { success: true };
        } catch (error) {
            console.error('Error initializing ProductManager:', error);
            return { success: false, error: error.message };
        }
    }

    getProducts() {
        return this.products;
    }

    getTotalProducts() {
        return this.totalProducts;
    }

    getTotalPages() {
        return Math.ceil(this.totalProducts / this.itemsPerPage);
    }

    getCurrentPage() {
        return this.currentPage;
    }
    
    async getProductById(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name, color)')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, product: data };
        } catch (error) {
            console.error('Error getting product:', error.message);
            return { success: false, error: error.message };
        }
    }

    async createProduct(productData) {
        try {
            // Validate product data
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Invalid product data' };
            }
            
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();
            
            if (error) throw error;
            
            // Reload products to maintain synchronization
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            Utils.showNotification('Product created successfully', 'success');
            return { success: true, product: data };
        } catch (error) {
            console.error('Error creating product:', error.message);
            Utils.showNotification('Error creating product: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, productData) {
        try {
            // Validate product data
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Invalid product data' };
            }
            
            const { data, error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            // Reload products to maintain synchronization
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            Utils.showNotification('Product updated successfully', 'success');
            return { success: true, product: data };
        } catch (error) {
            console.error('Error updating product:', error.message);
            Utils.showNotification('Error updating product: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // Reload products to maintain synchronization
            await this.loadProducts(
                this.currentPage > 1 && this.products.length === 1 ? 
                this.currentPage - 1 : this.currentPage, 
                this.currentFilters
            );
            
            Utils.showNotification('Product deleted successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error.message);
            Utils.showNotification('Error deleting product: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    validateProduct(productData) {
        // Basic validations
        if (!productData.name || productData.name.trim().length < 2) {
            Utils.showNotification('Name must be at least 2 characters long', 'error');
            return false;
        }
        
        if (!productData.description || productData.description.trim().length < 10) {
            Utils.showNotification('Description must be at least 10 characters long', 'error');
            return false;
        }
        
        if (!productData.category_id) {
            Utils.showNotification('Please select a category', 'error');
            return false;
        }
        
        if (!productData.photo_url) {
            Utils.showNotification('Please provide an image URL', 'error');
            return false;
        }
        
        // Validate plans and prices
        if (!productData.plans || !Array.isArray(productData.plans) || productData.plans.length === 0) {
            Utils.showNotification('Please add at least one plan', 'error');
            return false;
        }
        
        for (const plan of productData.plans) {
            if (!plan.name || !plan.price_soles || !plan.price_dollars) {
                Utils.showNotification('All plans must have a name and prices', 'error');
                return false;
            }
        }
        
        return true;
    }

    // Methods for statistics
    async getStats() {
        try {
            // Get total product count
            const { count: totalProducts, error: productsError } = await supabase
                .from('products')
                .select('*', { count: 'exact' });
            
            if (productsError) throw productsError;
            
            // Get count by category
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('id, name, color');
            
            if (categoriesError) throw categoriesError;
            
            const categoriesWithCount = await Promise.all(
                categoriesData.map(async category => {
                    const { count, error } = await supabase
                        .from('products')
                        .select('*', { count: 'exact' })
                        .eq('category_id', category.id);
                    
                    if (error) throw error;
                    
                    return {
                        ...category,
                        product_count: count || 0
                    };
                })
            );
            
            // Get recent products
            const { data: recentProducts, error: recentError } = await supabase
                .from('products')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (recentError) throw recentError;
            
            // Get active products
            const { count: activeProducts, error: activeError } = await supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('status', 'active');
            
            if (activeError) throw activeError;
            
            return {
                success: true,
                stats: {
                    totalProducts,
                    activeProducts,
                    categories: categoriesWithCount,
                    recentProducts
                }
            };
        } catch (error) {
            console.error('Error getting statistics:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Global instance for use throughout the application
export const productManager = new ProductManager();
