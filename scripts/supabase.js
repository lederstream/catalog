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
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Actualizar caché solo si no hay filtros aplicados
      if (!options.category_id && !options.search && !options.limit) {
        cache.products = data || [];
        cache.lastUpdated = Date.now();
      }
      
      // Precargar imágenes
      const imageUrls = data.map(p => p.photo_url).filter(url => url);
      Utils.preloadImages(imageUrls);
      
      return data;
    } catch (error) {
      return handleError(error, 'getProducts');
    }
  },

  async getProduct(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'getProduct', false);
    }
  },

  async addProduct(productData) {
    try {
      // Asegurar que los planes estén en formato correcto
      const plans = typeof productData.plans === 'string' 
        ? productData.plans 
        : JSON.stringify(productData.plans || []);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          category_id: productData.category_id,
          photo_url: productData.photo_url || CONFIG.IMAGE_PLACEHOLDER,
          plans: plans,
          created_at: new Date().toISOString()
        }])
        .select('*, categories(*)');
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.products = null;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      return handleError(error, 'addProduct');
    }
  },

  async updateProduct(id, productData) {
    try {
      // Asegurar que los planes estén en formato correcto
      const plans = typeof productData.plans === 'string' 
        ? productData.plans 
        : JSON.stringify(productData.plans || []);
      
      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          category_id: productData.category_id,
          photo_url: productData.photo_url || CONFIG.IMAGE_PLACEHOLDER,
          plans: plans,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, categories(*)');
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.products = null;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      return handleError(error, 'updateProduct');
    }
  },

  async deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.products = null;
      
      return true;
    } catch (error) {
      return handleError(error, 'deleteProduct');
    }
  },

  // Búsqueda avanzada de productos
  async searchProducts(query, categoryId = null, limit = 50) {
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*, categories(*)')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);
      
      if (categoryId) {
        queryBuilder = queryBuilder.eq('category_id', categoryId);
      }
      
      const { data, error } = await queryBuilder.order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, 'searchProducts');
    }
  },

  // Obtener productos por categoría
  async getProductsByCategory(categoryId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('category_id', categoryId)
        .order('name')
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, 'getProductsByCategory');
    }
  },
  
  // Subir archivo a storage
  async uploadFile(file, path, bucket = 'products') {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return publicUrl;
    } catch (error) {
      return handleError(error, 'uploadFile');
    }
  },
  
  // Eliminar archivo de storage
  async deleteFile(path, bucket = 'products') {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return handleError(error, 'deleteFile', false);
    }
  }
};

// Verificar conexión con reintentos
export const checkSupabaseConnection = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.from('products').select('count').limit(1);
      
      if (!error) {
        console.log('✅ Supabase conectado correctamente');
        return true;
      }
      
      if (attempt < maxRetries) {
        console.warn(`⚠️ Intento ${attempt} fallido, reintentando en 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}:`, error.message);
      if (attempt === maxRetries) {
        console.error('❌ Error conectando con Supabase después de varios intentos');
        return false;
      }
    }
  }
};

// Inicializar Supabase con manejo de errores mejorado
export const initSupabase = async () => {
  try {
    const isConnected = await checkSupabaseConnection();
    
    if (isConnected) {
      console.log('✅ Supabase inicializado correctamente');
      
      // Escuchar cambios en tiempo real
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          console.log('🔄 Cambio en la base de datos:', payload);
          // Invalidar caché cuando hay cambios en la base de datos
          cache.categories = null;
          cache.products = null;
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Suscrito a cambios en tiempo real');
          }
        });
      
      return true;
    } else {
      console.error('❌ Error conectando con Supabase');
      return false;
    }
  } catch (error) {
    console.error('Error inicializando Supabase:', error);
    return false;
  }
};

// Utilidad para limpiar caché
export const clearCache = () => {
  cache.categories = null;
  cache.products = null;
  cache.lastUpdated = null;
  console.log('🗑️ Caché limpiada');
};

// Inicializar automáticamente pero de forma no bloqueante
let initializationPromise = null;
export const ensureInitialized = async () => {
  if (!initializationPromise) {
    initializationPromise = initSupabase().catch(error => {
      console.error('Error en inicialización de Supabase:', error);
      return false;
    });
  }
  return initializationPromise;
};

// Inicialización diferida para mejor performance
if (typeof window !== 'undefined') {
  // Esperar a que la página cargue antes de inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(ensureInitialized, 1000); // Inicializar después de 1 segundo
    });
  } else {
    setTimeout(ensureInitialized, 1000);
  }
}

// Hacer funciones disponibles globalmente
window.supabaseClient = supabaseClient;
window.initSupabase = initSupabase;
window.clearCache = clearCache;

export default supabase;
