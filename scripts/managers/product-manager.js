// scripts/managers/product-manager.js
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
            
            console.log('🔄 Cargando productos con filtros:', this.currentFilters);
            
            // Construir consulta CORREGIDA
            let query = supabase
                .from('products')
                .select(`
                    *,
                    categories (*)
                `, { count: 'exact' });
            
            // Aplicar filtros
            if (this.currentFilters.category && this.currentFilters.category !== '') {
                query = query.eq('category_id', this.currentFilters.category);
                console.log('🔍 Filtrando por categoría:', this.currentFilters.category);
            }
            
            if (this.currentFilters.search && this.currentFilters.search !== '') {
                query = query.or(`name.ilike.%${this.currentFilters.search}%,description.ilike.%${this.currentFilters.search}%`);
                console.log('🔍 Filtrando por búsqueda:', this.currentFilters.search);
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
            console.error('Error al obtener producto:', error.message);
            return { success: false, error: error.message };
        }
    }

    async createProduct(productData) {
        try {
            // Validar datos del producto
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Datos del producto inválidos' };
            }
            
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();
            
            if (error) throw error;
            
            // Recargar productos para mantener la sincronización
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            Utils.showNotification('Producto creado exitosamente', 'success');
            return { success: true, product: data };
        } catch (error) {
            console.error('Error al crear producto:', error.message);
            Utils.showNotification('Error al crear producto: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    async updateProduct(id, productData) {
        try {
            // Validar datos del producto
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
            
            // Recargar productos para mantener la sincronización
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            Utils.showNotification('Producto actualizado exitosamente', 'success');
            return { success: true, product: data };
        } catch (error) {
            console.error('Error al actualizar producto:', error.message);
            Utils.showNotification('Error al actualizar producto: ' + error.message, 'error');
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
            
            // Recargar productos para mantener la sincronización
            await this.loadProducts(
                this.currentPage > 1 && this.products.length === 1 ? 
                this.currentPage - 1 : this.currentPage, 
                this.currentFilters
            );
            
            Utils.showNotification('Producto eliminado exitosamente', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            Utils.showNotification('Error al eliminar producto: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    validateProduct(productData) {
        // Validaciones básicas
        if (!productData.name || productData.name.trim().length < 2) {
            Utils.showNotification('El nombre debe tener al menos 2 caracteres', 'error');
            return false;
        }
        
        if (!productData.description || productData.description.trim().length < 10) {
            Utils.showNotification('La descripción debe tener al menos 10 caracteres', 'error');
            return false;
        }
        
        if (!productData.category_id) {
            Utils.showNotification('Debe seleccionar una categoría', 'error');
            return false;
        }
        
        if (!productData.photo_url) {
            Utils.showNotification('Debe proporcionar una URL de imagen', 'error');
            return false;
        }
        
        // Validar planes y precios
        if (!productData.plans || !Array.isArray(productData.plans) || productData.plans.length === 0) {
            Utils.showNotification('Debe agregar al menos un plan', 'error');
            return false;
        }
        
        for (const plan of productData.plans) {
            if (!plan.name || !plan.price_pen || !plan.price_usd) {
                Utils.showNotification('Todos los planes deben tener nombre y precios', 'error');
                return false;
            }
        }
        
        return true;
    }

    // Métodos para estadísticas
    async getStats() {
        try {
            // Obtener conteo total de productos
            const { count: totalProducts, error: productsError } = await supabase
                .from('products')
                .select('*', { count: 'exact' });
            
            if (productsError) throw productsError;
            
            // Obtener conteo por categoría
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
            
            // Obtener productos recientes
            const { data: recentProducts, error: recentError } = await supabase
                .from('products')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (recentError) throw recentError;
            
            // Obtener productos activos
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
            console.error('Error al obtener estadísticas:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Instancia global para usar en toda la aplicación
export const productManager = new ProductManager();
