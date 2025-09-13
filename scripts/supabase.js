// scripts/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { Utils } from './core/utils.js';

// Configuración de Supabase
const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';

// Crear cliente Supabase con configuración mejorada
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Application-Name': 'catalog-app',
      'X-Client-Type': 'browser'
    },
  },
});

// Cache para mejorar el rendimiento
const cache = {
  categories: null,
  products: null,
  lastUpdated: null,
  CACHE_DURATION: 2 * 60 * 1000, // 2 minutos
};

// Utilidad para manejar errores
const handleError = (error, context) => {
  console.error(`Error en ${context}:`, error);
  
  // Mostrar notificación al usuario en entornos de desarrollo
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    Utils.showError(`Error en ${context}: ${error.message}`);
  }
  
  throw error;
};

// Utilidad para verificar si la caché es válida
const isCacheValid = () => {
  return cache.lastUpdated && (Date.now() - cache.lastUpdated) < cache.CACHE_DURATION;
};

// Funciones básicas de Supabase
export const supabaseClient = {
  // Categorías
  async getCategories(forceRefresh = false) {
    try {
      // Usar caché si está disponible y no se fuerza refresco
      if (cache.categories && !forceRefresh && isCacheValid()) {
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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidar caché después de una modificación
      cache.categories = null;
      cache.products = null; // También invalidar productos porque pueden depender de categorías
      
      return true;
    } catch (error) {
      return handleError(error, 'deleteCategory');
    }
  },

  // Productos
  async getProducts(forceRefresh = false) {
    try {
      // Usar caché si está disponible y no se fuerza refresco
      if (cache.products && !forceRefresh && isCacheValid()) {
        return cache.products;
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Actualizar caché
      cache.products = data || [];
      cache.lastUpdated = Date.now();
      
      return cache.products;
    } catch (error) {
      return handleError(error, 'getProducts');
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
          photo_url: productData.photo_url,
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
          photo_url: productData.photo_url,
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
  async searchProducts(query, categoryId = null) {
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*, categories(*)')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      
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
  async getProductsByCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('category_id', categoryId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError(error, 'getProductsByCategory');
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
      supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          // Invalidar caché cuando hay cambios en la base de datos
          cache.categories = null;
          cache.products = null;
          console.log('🔄 Datos invalidados por cambios en la base de datos');
        })
        .subscribe();
      
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
    initializationPromise = initSupabase();
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
