// scripts/managers/product-manager.js
import { supabase } from '../supabase.js';
import { Utils } from '../core/utils.js';

class ProductManager {
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
            
            console.log('🔄 Cargando productos con filtros:', this.currentFilters);
            
            // Construir consulta base
            let query = supabase
                .from('products')
                .select('*, categories(*)', { count: 'exact' });
            
            // Aplicar filtros
            if (this.currentFilters.category) {
                query = query.eq('category_id', this.currentFilters.category);
            }
            
            if (this.currentFilters.search) {
                query = query.ilike('name', `%${this.currentFilters.search}%`);
            }
            
            // Aplicar ordenamiento
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
            
            // Aplicar paginación
            const from = (page - 1) * this.itemsPerPage;
            const to = from + this.itemsPerPage - 1;
            query = query.range(from, to);
            
            // Ejecutar consulta
            const { data, error, count } = await query;
            
            if (error) {
                console.error('❌ Error en consulta Supabase:', error);
                throw error;
            }
            
            console.log('✅ Productos cargados:', data?.length || 0);
            this.products = data || [];
            this.totalProducts = count || 0;
            
            return { success: true, products: this.products, total: this.totalProducts };
        } catch (error) {
            console.error('❌ Error al cargar productos:', error.message);
            return { success: false, error: error.message };
        }
    }

    async initialize() {
        try {
            const result = await this.loadProducts(1, this.currentFilters);
            this.isInitialized = result.success;
            return result;
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
            console.error('Error al obtener producto:', error.message);
            return { success: false, error: error.message };
        }
    }

    async createProduct(productData) {
        try {
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Datos del producto inválidos' };
            }
            
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();
            
            if (error) throw error;
            
            // Recargar productos
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            return { success: true, product: data };
        } catch (error) {
            console.error('Error al crear producto:', error.message);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, productData) {
        try {
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Datos del producto inválidos' };
            }
            
            const { data, error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            // Recargar productos
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            return { success: true, product: data };
        } catch (error) {
            console.error('Error al actualizar producto:', error.message);
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
            
            // Recargar productos
            const newPage = this.currentPage > 1 && this.products.length === 1 ? 
                this.currentPage - 1 : this.currentPage;
            await this.loadProducts(newPage, this.currentFilters);
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            return { success: false, error: error.message };
        }
    }

    validateProduct(productData) {
        if (!productData.name || productData.name.trim().length < 2) {
            return false;
        }
        
        if (!productData.description || productData.description.trim().length < 10) {
            return false;
        }
        
        if (!productData.category_id) {
            return false;
        }
        
        if (!productData.photo_url) {
            return false;
        }
        
        try {
            const plans = typeof productData.plans === 'string' ? 
                JSON.parse(productData.plans) : productData.plans;
                
            if (!Array.isArray(plans) || plans.length === 0) {
                return false;
            }
            
            for (const plan of plans) {
                if (!plan.name || (!plan.price_soles && !plan.price_dollars)) {
                    return false;
                }
            }
        } catch (error) {
            return false;
        }
        
        return true;
    }

    async getStats() {
        try {
            // Obtener conteo total de productos
            const { count: totalProducts, error: productsError } = await supabase
                .from('products')
                .select('*', { count: 'exact' });
            
            if (productsError) throw productsError;
            
            // Obtener categorías
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('id, name, color');
            
            if (categoriesError) throw categoriesError;
            
            // Obtener conteo por categoría
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
            
            // Obtener productos recientes
            const { data: recentProducts, error: recentError } = await supabase
                .from('products')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (recentError) throw recentError;
            
            return {
                success: true,
                stats: {
                    totalProducts,
                    categories: categoriesWithCount,
                    recentProducts
                }
            };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Instancia global
const productManager = new ProductManager();
export { productManager, ProductManager };
