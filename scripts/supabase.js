// scripts/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { Utils } from './core/utils.js';

// Configuración directa
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';
const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/300x200?text=Sin+imagen';

// Crear cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: {
    headers: {
      'X-Application-Name': 'catalog-app',
      'X-Client-Type': 'browser',
      'X-Client-Version': '1.0.0'
    },
  },
  db: { schema: 'public' }
});

// Cache unificado
const cache = {
  categories: null,
  products: null,
  lastUpdated: null,
  CACHE_DURATION: 5 * 60 * 1000,
};

// Manejo de errores centralizado
const handleError = (error, context, showNotification = true) => {
  console.error(`Error en ${context}:`, error);
  
  if (showNotification) {
    let errorMessage = `Error en ${context}`;
    if (error.message.includes('JWT')) errorMessage = 'Error de autenticación';
    else if (error.message.includes('network')) errorMessage = 'Error de conexión';
    
    Utils.showError(errorMessage);
  }
  
  throw error;
};

const isCacheValid = (cacheKey) => {
  return cache[cacheKey] && cache.lastUpdated && 
         (Date.now() - cache.lastUpdated) < cache.CACHE_DURATION;
};

// Funciones de Supabase optimizadas
export const supabaseClient = {
  // Categorías
  async getCategories(forceRefresh = false) {
    try {
      if (isCacheValid('categories') && !forceRefresh) return cache.categories;
      
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      
      cache.categories = data || [];
      cache.lastUpdated = Date.now();
      return cache.categories;
    } catch (error) {
      return handleError(error, 'getCategories');
    }
  },

  async getCategory(id) {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'getCategory', false);
    }
  },

  async addCategory(categoryData) {
    try {
      const { data, error } = await supabase.from('categories').insert([{
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon || 'fas fa-tag',
        color: categoryData.color || 'blue',
        created_at: new Date().toISOString()
      }]).select();
      
      if (error) throw error;
      cache.categories = null;
      return data?.[0] || null;
    } catch (error) {
      return handleError(error, 'addCategory');
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const { data, error } = await supabase.from('categories').update({
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        updated_at: new Date().toISOString()
      }).eq('id', id).select();
      
      if (error) throw error;
      cache.categories = null;
      return data?.[0] || null;
    } catch (error) {
      return handleError(error, 'updateCategory');
    }
  },

  async deleteCategory(id) {
    try {
      // Verificar productos asociados
      const { data: products, error: checkError } = await supabase
        .from('products').select('id').eq('category_id', id).limit(1);
      
      if (checkError) throw checkError;
      if (products?.length > 0) throw new Error('Categoría tiene productos asociados');
      
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      
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
      if (isCacheValid('products') && !forceRefresh && !options.category_id && !options.search) {
        return cache.products;
      }
      
      let query = supabase.from('products').select('*, categories(*)');
      
      if (options.category_id) query = query.eq('category_id', options.category_id);
      if (options.search) query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      
      const orderBy = options.orderBy || 'created_at';
      const ascending = options.ascending !== undefined ? options.ascending : false;
      query = query.order(orderBy, { ascending });
      
      if (options.limit) query = query.limit(options.limit);
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!options.category_id && !options.search && !options.limit) {
        cache.products = data || [];
        cache.lastUpdated = Date.now();
      }
      
      return data;
    } catch (error) {
      return handleError(error, 'getProducts');
    }
  },

  async getProduct(id) {
    try {
      const { data, error } = await supabase
        .from('products').select('*, categories(*)').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'getProduct', false);
    }
  },

  async addProduct(productData) {
    try {
      const plans = typeof productData.plans === 'string' 
        ? productData.plans 
        : JSON.stringify(productData.plans || []);
      
      const { data, error } = await supabase.from('products').insert([{
        name: productData.name,
        description: productData.description,
        category_id: productData.category_id,
        photo_url: productData.photo_url || IMAGE_PLACEHOLDER, // Usamos constante directa
        plans: plans,
        created_at: new Date().toISOString()
      }]).select('*, categories(*)');
      
      if (error) throw error;
      cache.products = null;
      return data?.[0] || null;
    } catch (error) {
      return handleError(error, 'addProduct');
    }
  },

  async updateProduct(id, productData) {
    try {
      const plans = typeof productData.plans === 'string' 
        ? productData.plans 
        : JSON.stringify(productData.plans || []);
      
      const { data, error } = await supabase.from('products').update({
        name: productData.name,
        description: productData.description,
        category_id: productData.category_id,
        photo_url: productData.photo_url || IMAGE_PLACEHOLDER, // Usamos constante directa
        plans: plans,
        updated_at: new Date().toISOString()
      }).eq('id', id).select('*, categories(*)');
      
      if (error) throw error;
      cache.products = null;
      return data?.[0] || null;
    } catch (error) {
      return handleError(error, 'updateProduct');
    }
  },

  async deleteProduct(id) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      cache.products = null;
      return true;
    } catch (error) {
      return handleError(error, 'deleteProduct');
    }
  },

  async searchProducts(query, categoryId = null, limit = 50) {
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*, categories(*)')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);
      
      if (categoryId) queryBuilder = queryBuilder.eq('category_id', categoryId);
      
      const { data, error } = await queryBuilder.order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, 'searchProducts');
    }
  },

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
  
  async uploadFile(file, path, bucket = 'products') {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      return publicUrl;
    } catch (error) {
      return handleError(error, 'uploadFile');
    }
  },
  
  async deleteFile(path, bucket = 'products') {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch (error) {
      return handleError(error, 'deleteFile', false);
    }
  }
};

// Utilidades de conexión
export const checkSupabaseConnection = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.from('products').select('count').limit(1);
      if (!error) {
        console.log('✅ Supabase conectado correctamente');
        return true;
      }
      
      if (attempt < maxRetries) {
        console.warn(`⚠️ Intento ${attempt} fallido, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}:`, error.message);
      if (attempt === maxRetries) return false;
    }
  }
};

export const initSupabase = async () => {
  try {
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      console.log('✅ Supabase inicializado correctamente');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error inicializando Supabase:', error);
    return false;
  }
};

export const clearCache = () => {
  cache.categories = null;
  cache.products = null;
  cache.lastUpdated = null;
  console.log('🗑️ Caché limpiada');
};

// Inicialización diferida
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

// Inicialización automática
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(ensureInitialized, 1000));
  } else {
    setTimeout(ensureInitialized, 1000);
  }
}

// Globales
window.supabaseClient = supabaseClient;
window.initSupabase = initSupabase;
window.clearCache = clearCache;

export default supabase;
