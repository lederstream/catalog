// scripts/managers/product-manager.js
import { supabase } from '../supabase.js'
import { Utils } from '../core/utils.js'

export class ProductManager {
    constructor() {
        this.products = []
        this.currentPage = 1
        this.itemsPerPage = 12
        this.totalProducts = 0
        this.currentFilters = {
            category: '',
            search: '',
            sort: 'newest'
        }
    }

    async loadProducts(page = 1, filters = {}) {
        try {
            this.currentPage = page
            this.currentFilters = { ...this.currentFilters, ...filters }
            
            // Construir consulta
            let query = supabase
                .from('products')
                .select('*, categories(name, color)', { count: 'exact' })
            
            // Aplicar filtros
            if (filters.category) {
                query = query.eq('category_id', filters.category)
            }
            
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`)
            }
            
            // Aplicar ordenamiento
            switch (filters.sort || this.currentFilters.sort) {
                case 'newest':
                    query = query.order('created_at', { ascending: false })
                    break
                case 'oldest':
                    query = query.order('created_at', { ascending: true })
                    break
                case 'name_asc':
                    query = query.order('name', { ascending: true })
                    break
                case 'name_desc':
                    query = query.order('name', { ascending: false })
                    break
            }
            
            // Aplicar paginación
            const from = (page - 1) * this.itemsPerPage
            const to = from + this.itemsPerPage - 1
            query = query.range(from, to)
            
            // Ejecutar consulta
            const { data, error, count } = await query
            
            if (error) throw error
            
            this.products = data || []
            this.totalProducts = count || 0
            
            return { success: true, products: this.products, total: this.totalProducts }
        } catch (error) {
            console.error('Error al cargar productos:', error.message)
            return { success: false, error: error.message }
        }
    }

    async getProductById(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name, color)')
                .eq('id', id)
                .single()
            
            if (error) throw error
            return { success: true, product: data }
        } catch (error) {
            console.error('Error al obtener producto:', error.message)
            return { success: false, error: error.message }
        }
    }

    async createProduct(productData) {
        try {
            // Validar datos del producto
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Datos del producto inválidos' }
            }
            
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single()
            
            if (error) throw error
            
            Utils.showNotification('Producto creado exitosamente', 'success')
            return { success: true, product: data }
        } catch (error) {
            console.error('Error al crear producto:', error.message)
            Utils.showNotification('Error al crear producto: ' + error.message, 'error')
            return { success: false, error: error.message }
        }
    }

    async updateProduct(id, productData) {
        try {
            // Validar datos del producto
            if (!this.validateProduct(productData)) {
                return { success: false, error: 'Datos del producto inválidos' }
            }
            
            const { data, error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            Utils.showNotification('Producto actualizado exitosamente', 'success')
            return { success: true, product: data }
        } catch (error) {
            console.error('Error al actualizar producto:', error.message)
            Utils.showNotification('Error al actualizar producto: ' + error.message, 'error')
            return { success: false, error: error.message }
        }
    }

    async deleteProduct(id) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            Utils.showNotification('Producto eliminado exitosamente', 'success')
            return { success: true }
        } catch (error) {
            console.error('Error al eliminar producto:', error.message)
            Utils.showNotification('Error al eliminar producto: ' + error.message, 'error')
            return { success: false, error: error.message }
        }
    }

    validateProduct(productData) {
        // Validaciones básicas
        if (!productData.name || productData.name.trim().length < 2) {
            return false
        }
        
        if (!productData.description || productData.description.trim().length < 10) {
            return false
        }
        
        if (!productData.category_id) {
            return false
        }
        
        if (!productData.photo_url) {
            return false
        }
        
        // Validar planes y precios
        if (!productData.plans || !Array.isArray(productData.plans) || productData.plans.length === 0) {
            return false
        }
        
        for (const plan of productData.plans) {
            if (!plan.name || !plan.price_pen || !plan.price_usd) {
                return false
            }
        }
        
        return true
    }

    getTotalPages() {
        return Math.ceil(this.totalProducts / this.itemsPerPage)
    }

    // Métodos para estadísticas
    async getStats() {
        try {
            // Obtener conteo total de productos
            const { count: totalProducts, error: productsError } = await supabase
                .from('products')
                .select('*', { count: 'exact' })
            
            if (productsError) throw productsError
            
            // Obtener conteo por categoría
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('id, name, color')
            
            if (categoriesError) throw categoriesError
            
            const categoriesWithCount = await Promise.all(
                categoriesData.map(async category => {
                    const { count, error } = await supabase
                        .from('products')
                        .select('*', { count: 'exact' })
                        .eq('category_id', category.id)
                    
                    if (error) throw error
                    
                    return {
                        ...category,
                        product_count: count || 0
                    }
                })
            )
            
            // Obtener productos recientes
            const { data: recentProducts, error: recentError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (recentError) throw recentError
            
            return {
                success: true,
                stats: {
                    totalProducts,
                    categories: categoriesWithCount,
                    recentProducts
                }
            }
        } catch (error) {
            console.error('Error al obtener estadísticas:', error.message)
            return { success: false, error: error.message }
        }
    }
}s
