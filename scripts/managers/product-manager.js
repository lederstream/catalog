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
            
            // Construir consulta base - AJUSTADA para tu estructura
            let query = supabase
                .from('productos')
                .select('*', { count: 'exact' });
            
            // Aplicar filtros
            if (this.currentFilters.category && this.currentFilters.category !== '') {
                query = query.eq('categoria', this.currentFilters.category);
            }
            
            if (this.currentFilters.search && this.currentFilters.search !== '') {
                query = query.ilike('nombre', `%${this.currentFilters.search}%`);
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
                    query = query.order('nombre', { ascending: true });
                    break;
                case 'name_desc':
                    query = query.order('nombre', { ascending: false });
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
                .from('productos')
                .select('*')
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
                .from('productos')
                .insert([productData])
                .select()
                .single();
            
            if (error) throw error;
            
            // Recargar productos para mantener la sincronización
            await this.loadProducts(this.currentPage, this.currentFilters);
            
            return { success: true, product: data };
        } catch (error) {
            console.error('Error al crear producto:', error.message);
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
                .from('productos')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            // Recargar productos para mantener la sincronización
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
                .from('productos')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // Recargar productos para mantener la sincronización
            await this.loadProducts(
                this.currentPage > 1 && this.products.length === 1 ? 
                this.currentPage - 1 : this.currentPage, 
                this.currentFilters
            );
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            return { success: false, error: error.message };
        }
    }

    validateProduct(productData) {
        // Validaciones básicas según tu estructura
        if (!productData.nombre || productData.nombre.trim().length < 2) {
            return false;
        }
        
        if (!productData.descripcion || productData.descripcion.trim().length < 10) {
            return false;
        }
        
        if (!productData.categoria) {
            return false;
        }
        
        if (!productData.imagen) {
            return false;
        }
        
        try {
            // Validar que planes sea un JSON válido
            const planes = typeof productData.planes === 'string' ? 
                JSON.parse(productData.planes) : 
                productData.planes;
                
            if (!Array.isArray(planes) || planes.length === 0) {
                return false;
            }
            
            for (const plan of planes) {
                if (!plan.nombre || (!plan.precio_soles && !plan.precio_dolares)) {
                    return false;
                }
            }
        } catch (error) {
            return false;
        }
        
        return true;
    }

    // Métodos para estadísticas - AJUSTADO para tu estructura
    async getStats() {
        try {
            // Obtener conteo total de productos
            const { count: totalProducts, error: productsError } = await supabase
                .from('productos')
                .select('*', { count: 'exact' });
            
            if (productsError) throw productsError;
            
            // Obtener conteo por categoría
            const { data: products, error: productsError2 } = await supabase
                .from('productos')
                .select('categoria');
            
            if (productsError2) throw productsError2;
            
            // Contar productos por categoría manualmente
            const categoriasConteo = {};
            products.forEach(product => {
                const categoria = product.categoria || 'Sin categoría';
                categoriasConteo[categoria] = (categoriasConteo[categoria] || 0) + 1;
            });
            
            const categoriesWithCount = Object.entries(categoriasConteo).map(([name, count]) => ({
                name,
                product_count: count
            }));
            
            // Obtener productos recientes
            const { data: recentProducts, error: recentError } = await supabase
                .from('productos')
                .select('*')
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

// Instancia global para usar en toda la aplicación
export const productManager = new ProductManager();
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
                .select(`
                    *,
                    categories (*)
                `, { count: 'exact' });
            
            // Aplicar filtros
            if (this.currentFilters.category && this.currentFilters.category !== '') {
                query = query.eq('category_id', this.currentFilters.category);
            }
            
            if (this.currentFilters.search && this.currentFilters.search !== '') {
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
            
            return { success: true, product: data };
        } catch (error) {
            console.error('Error al crear producto:', error.message);
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
            
            // Recargar productos para mantener la sincronización
            await this.loadProducts(
                this.currentPage > 1 && this.products.length === 1 ? 
                this.currentPage - 1 : this.currentPage, 
                this.currentFilters
            );
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            return { success: false, error: error.message };
        }
    }

    validateProduct(productData) {
        // Validaciones básicas
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
            // Validar que plans sea un JSON válido
            const plans = typeof productData.plans === 'string' ? 
                JSON.parse(productData.plans) : 
                productData.plans;
                
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
                    activeProducts: totalProducts,
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
