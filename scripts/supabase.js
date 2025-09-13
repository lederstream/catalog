// scripts/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { Utils, CONFIG } from './core/utils.js';

// Crear cliente Supabase con configuración mejorada
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Application-Name': 'catalog-app',
      'X-Client-Type': 'browser',
      'X-Client-Version': '1.0.0'
    },
  },
  db: {
    schema: 'public'
  }
});

// Cache para mejorar el rendimiento
const cache = {
  categories: null,
  products: null,
  lastUpdated: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
};

// Utilidad para manejar errores
const handleError = (error, context, showNotification = true) => {
  console.error(`Error en ${context}:`, error);
  
  // Mostrar notificación al usuario
  if (showNotification) {
    let errorMessage = `Error en ${context}`;
    
    if (error.message.includes('JWT')) {
      errorMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    }
    
    Utils.showError(errorMessage);
  }
  
  throw error;
};

// Utilidad para verificar si la caché es válida
const isCacheValid = (cacheKey) => {
  return cache[cacheKey] && cache.lastUpdated && (Date.now() - cache.lastUpdated) < cache.CACHE_DURATION;
};

// Funciones básicas de Supabase
export const supabaseClient = {
  // Categorías
  async getCategories(forceRefresh = false) {
    try {
      // Usar caché si está disponible y no se fuerza refresco
      if (isCacheValid('categories') && !forceRefresh) {
        return cache.categories;
      }
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Actualizar caché
      cache.categories = data || [];
      cache.lastUpdated = Date.now();
      
      return cache.categories;
    } catch (error) {
      return handleError(error, 'getCategories');
    }
  },

  async getCategory(id) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'getCategory', false);
    }
  },

  async addCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon || 'fas fa-tag',
          color: categoryData.color || 'blue',
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.categories = null;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      return handleError(error, 'addCategory');
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
          color: categoryData.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.categories = null;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      return handleError(error, 'updateCategory');
    }
  },

  async deleteCategory(id) {
    try {
      // Primero verificar si hay productos asociados a esta categoría
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (products && products.length > 0) {
        throw new Error('No se puede eliminar la categoría porque tiene productos asociados');
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.categories = null;
      cache.products = null;
      
      return true;
    } catch (error) {
      return handleError(error, 'deleteCategory');
    }
  },

  // Productos
  async getProducts(forceRefresh = false, options = {}) {
    try {
      // Usar caché si está disponible y no se fuerza refresco
      if (isCacheValid('products') && !forceRefresh && !options.category_id && !options.search) {
        return cache.products;
      }
      
      let query = supabase
        .from('products')
        .select('*, categories(*)');
      
      // Filtrar por categoría si se especifica
      if (options.category_id) {
        query = query.eq('category_id', options.category_id);
      }
      
      // Búsqueda si se especifica
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }
      
      // Ordenar
      const orderBy = options.orderBy || 'created_at';
      const ascending = options.ascending !== undefined ? options.ascending : false;
      
      query = query.order(orderBy, { ascending: ascending });
      
      // Límite si se especifica
      if (options
