// scripts/products.js - Gestión avanzada de productos
import { supabase } from './supabase.js';
import { 
  showNotification, 
  formatCurrency, 
  validateUrl, 
  validateRequired, 
  validateNumber,
  debounce,
  generateUUID,
  sanitizeInput
} from './utils.js';

/**
 * @typedef {Object} ProductPlan
 * @property {string} name - Nombre del plan
 * @property {number} price_soles - Precio en soles
 * @property {number} price_dollars - Precio en dólares
 */

/**
 * @typedef {Object} Product
 * @property {string} id - ID único del producto
 * @property {string} name - Nombre del producto
 * @property {string} description - Descripción del producto
 * @property {string} photo_url - URL de la imagen del producto
 * @property {number} category_id - ID de la categoría
 * @property {ProductPlan[]} plans - Array de planes del producto
 * @property {string} created_at - Fecha de creación
 * @property {string} updated_at - Fecha de actualización
 * @property {Object} categories - Información de la categoría
 */

// Estado global de productos
let products = [];
let productsLoaded = false;
let productsLoading = false;

// Cache para mejorar rendimiento
const productCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Eventos personalizados para notificar cambios
const PRODUCTS_UPDATED_EVENT = 'products:updated';
const PRODUCT_ADDED_EVENT = 'product:added';
const PRODUCT_UPDATED_EVENT = 'product:updated';
const PRODUCT_DELETED_EVENT = 'product:deleted';

/**
 * Servicio de gestión de productos
 */
export const ProductService = {
  /**
   * Cargar productos desde Supabase con caché y reintentos
   * @param {boolean} force - Forzar recarga ignorando caché
   * @returns {Promise<Product[]>} Array de productos
   */
  async loadProducts(force = false) {
    // Si ya está cargando, retornar la promesa existente
    if (productsLoading && !force) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (productsLoaded) resolve(products);
          else setTimeout(checkLoaded, 100);
        };
        checkLoaded();
      });
    }

    // Si ya están cargados y no se fuerza, retornar desde caché
    if (productsLoaded && !force) {
      return products;
    }

    productsLoading = true;
    
    try {
      console.log('📦 Cargando productos desde Supabase...');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (id, name, description, color, icon)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      products = data || [];
      productsLoaded = true;
      
      // Actualizar caché
      productCache.clear();
      products.forEach(product => {
        productCache.set(product.id, {
          data: product,
          timestamp: Date.now()
        });
      });

      console.log(`✅ ${products.length} productos cargados correctamente`);
      
      // Disparar evento de productos actualizados
      dispatchProductsEvent(PRODUCTS_UPDATED_EVENT, { products });
      
      return products;
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
      showNotification('Error al cargar los productos. Intentando nuevamente...', 'error');
      
      // Reintento automático después de 3 segundos
      setTimeout(() => this.loadProducts(true), 3000);
      
      return [];
    } finally {
      productsLoading = false;
    }
  },

  /**
   * Obtener todos los productos
   * @returns {Product[]} Array de productos
   */
  getProducts() {
    return [...products]; // Devolver copia para evitar mutaciones
  },

  /**
   * Filtrar productos por categoría y término de búsqueda
   * @param {string|number} categoryId - ID de categoría o 'all'
   * @param {string} searchTerm - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Product[]} Productos filtrados
   */
  filterProducts(categoryId = 'all', searchTerm = '', filters = {}) {
    let filtered = [...products];

    // Filtrar por categoría
    if (categoryId !== 'all') {
      filtered = filtered.filter(product => {
        return product.category_id == categoryId;
      });
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const searchableText = `
          ${product.name || ''} 
          ${product.description || ''}
          ${product.plans?.map(plan => plan.name).join(' ') || ''}
        `.toLowerCase();
        
        return searchableText.includes(term);
      });
    }

    // Filtrar por rango de precios si se especifica
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(product => {
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        
        return product.plans?.some(plan => {
          const price = plan.price_soles || plan.price_dollars * 3.8; // Conversión aproximada
          return price >= minPrice && price <= maxPrice;
        });
      });
    }

    // Ordenar resultados
    if (filters.sortBy) {
      filtered = this.sortProducts(filtered, filters.sortBy, filters.sortOrder);
    }

    return filtered;
  },

  /**
   * Ordenar productos por criterio
   * @param {Product[]} products - Productos a ordenar
   * @param {string} sortBy - Campo por el que ordenar
   * @param {string} sortOrder - Orden (asc/desc)
   * @returns {Product[]} Productos ordenados
   */
  sortProducts(products, sortBy = 'name', sortOrder = 'asc') {
    return [...products].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'price':
          aValue = Math.min(...(a.plans?.map(plan => plan.price_soles) || [0]));
          bValue = Math.min(...(b.plans?.map(plan => plan.price_soles) || [0]));
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'name':
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Obtener producto por ID con caché
   * @param {string} id - ID del producto
   * @returns {Product|null} Producto encontrado o null
   */
  getProductById(id) {
    // Verificar en caché primero
    const cached = productCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }

    // Buscar en array local
    const product = products.find(p => p.id == id);
    if (product) {
      productCache.set(id, {
        data: product,
        timestamp: Date.now()
      });
    }
    
    return product || null;
  },

  /**
   * Buscar productos por término
   * @param {string} term - Término de búsqueda
   * @returns {Product[]} Productos que coinciden
   */
  searchProducts(term) {
    if (!term) return products;
    
    return products.filter(product => {
      const searchText = `
        ${product.name} 
        ${product.description}
        ${product.plans?.map(plan => plan.name).join(' ')}
      `.toLowerCase();
      
      return searchText.includes(term.toLowerCase());
    });
  },

  /**
   * Validar datos del producto
   * @param {Object} productData - Datos del producto a validar
   * @returns {string[]} Array de errores, vacío si es válido
   */
  validateProductData(productData) {
    const errors = [];
    
    // Validar nombre
    if (!validateRequired(productData.name)) {
      errors.push('El nombre del producto es requerido');
    } else if (productData.name.length > 100) {
      errors.push('El nombre no puede exceder los 100 caracteres');
    }
    
    // Validar descripción
    if (!validateRequired(productData.description)) {
      errors.push('La descripción es requerida');
    } else if (productData.description.length > 500) {
      errors.push('La descripción no puede exceder los 500 caracteres');
    }
    
    // Validar URL de imagen
    if (!validateUrl(productData.photo_url)) {
      errors.push('La URL de la imagen no es válida');
    }
    
    // Validar categoría
    if (!productData.category_id) {
      errors.push('Debe seleccionar una categoría');
    }
    
    // Validar planes
    if (!productData.plans || productData.plans.length === 0) {
      errors.push('Debe agregar al menos un plan');
    } else {
      productData.plans.forEach((plan, index) => {
        if (!validateRequired(plan.name)) {
          errors.push(`El nombre del plan ${index + 1} es requerido`);
        }
        
        const hasSoles = validateNumber(plan.price_soles) && parseFloat(plan.price_soles) >= 0;
        const hasDollars = validateNumber(plan.price_dollars) && parseFloat(plan.price_dollars) >= 0;
        
        if (!hasSoles && !hasDollars) {
          errors.push(`El plan ${index + 1} debe tener al menos un precio (soles o dólares)`);
        }
        
        if (hasSoles && parseFloat(plan.price_soles) > 100000) {
          errors.push(`El precio en soles del plan ${index + 1} no puede exceder S/ 100,000`);
        }
        
        if (hasDollars && parseFloat(plan.price_dollars) > 25000) {
          errors.push(`El precio en dólares del plan ${index + 1} no puede exceder $ 25,000`);
        }
      });
    }
    
    return errors;
  },

  /**
   * Agregar un nuevo producto
   * @param {Object} productData - Datos del producto
   * @returns {Promise<Product|null>} Producto creado o null en caso de error
   */
  async addProduct(productData) {
    try {
      // Validar datos
      const validationErrors = this.validateProductData(productData);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => showNotification(error, 'error'));
        return null;
      }

      // Preparar datos para inserción
      const productToInsert = {
        name: sanitizeInput(productData.name.trim()),
        description: sanitizeInput(productData.description.trim()),
        photo_url: productData.photo_url.trim(),
        plans: productData.plans.map(plan => ({
          id: generateUUID(),
          name: sanitizeInput(plan.name.trim()),
          price_soles: plan.price_soles ? parseFloat(plan.price_soles) : null,
          price_dollars: plan.price_dollars ? parseFloat(plan.price_dollars) : null,
          features: plan.features || []
        })),
        category_id: parseInt(productData.category_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('products')
        .insert([productToInsert])
        .select(`
          *,
          categories:category_id (id, name, description, color, icon)
        `);

      if (error) {
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      if (data && data.length > 0) {
        const newProduct = data[0];
        
        // Actualizar estado local
        products.unshift(newProduct);
        productCache.set(newProduct.id, {
          data: newProduct,
          timestamp: Date.now()
        });
        
        // Disparar evento
        dispatchProductsEvent(PRODUCT_ADDED_EVENT, { product: newProduct });
        
        showNotification('✅ Producto agregado correctamente', 'success');
        return newProduct;
      }

      return null;
    } catch (error) {
      console.error('❌ Error al agregar producto:', error);
      showNotification(`Error al agregar producto: ${error.message}`, 'error');
      return null;
    }
  },

  /**
   * Actualizar un producto existente
   * @param {string} id - ID del producto
   * @param {Object} productData - Nuevos datos del producto
   * @returns {Promise<Product|null>} Producto actualizado o null en caso de error
   */
  async updateProduct(id, productData) {
    try {
      // Validar datos
      const validationErrors = this.validateProductData(productData);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => showNotification(error, 'error'));
        return null;
      }

      // Preparar datos para actualización
      const updateData = {
        name: sanitizeInput(productData.name.trim()),
        description: sanitizeInput(productData.description.trim()),
        photo_url: productData.photo_url.trim(),
        plans: productData.plans.map(plan => ({
          id: plan.id || generateUUID(),
          name: sanitizeInput(plan.name.trim()),
          price_soles: plan.price_soles ? parseFloat(plan.price_soles) : null,
          price_dollars: plan.price_dollars ? parseFloat(plan.price_dollars) : null,
          features: plan.features || []
        })),
        category_id: parseInt(productData.category_id),
        updated_at: new Date().toISOString()
      };

      // Actualizar en Supabase
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          categories:category_id (id, name, description, color, icon)
        `);

      if (error) {
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      if (data && data.length > 0) {
        const updatedProduct = data[0];
        
        // Actualizar estado local
        const index = products.findIndex(product => product.id === id);
        if (index !== -1) {
          products[index] = updatedProduct;
        }
        
        // Actualizar caché
        productCache.set(id, {
          data: updatedProduct,
          timestamp: Date.now()
        });
        
        // Disparar evento
        dispatchProductsEvent(PRODUCT_UPDATED_EVENT, { product: updatedProduct });
        
        showNotification('✅ Producto actualizado correctamente', 'success');
        return updatedProduct;
      }

      return null;
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      showNotification(`Error al actualizar producto: ${error.message}`, 'error');
      return null;
    }
  },

  /**
   * Eliminar un producto
   * @param {string} id - ID del producto
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteProduct(id) {
    try {
      if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return false;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      // Actualizar estado local
      products = products.filter(product => product.id !== id);
      productCache.delete(id);
      
      // Disparar evento
      dispatchProductsEvent(PRODUCT_DELETED_EVENT, { productId: id });
      
      showNotification('✅ Producto eliminado correctamente', 'success');
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      showNotification(`Error al eliminar producto: ${error.message}`, 'error');
      return false;
    }
  },

  /**
   * Obtener productos por categoría
   * @param {number} categoryId - ID de la categoría
   * @returns {Product[]} Productos de la categoría
   */
  getProductsByCategory(categoryId) {
    return products.filter(product => product.category_id == categoryId);
  },

  /**
   * Obtener productos destacados
   * @param {number} limit - Límite de productos
   * @returns {Product[]} Productos destacados
   */
  getFeaturedProducts(limit = 6) {
    // Implementar lógica para productos destacados
    // Por ahora, devolver los más recientes
    return [...products]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  /**
   * Obtener productos relacionados
   * @param {Product} currentProduct - Producto actual
   * @param {number} limit - Límite de productos
   * @returns {Product[]} Productos relacionados
   */
  getRelatedProducts(currentProduct, limit = 4) {
    return products
      .filter(product => 
        product.id !== currentProduct.id && 
        product.category_id === currentProduct.category_id
      )
      .slice(0, limit);
  },

  /**
   * Limpiar caché de productos
   */
  clearCache() {
    productCache.clear();
    productsLoaded = false;
  },

  /**
   * Estado de carga de productos
   * @returns {boolean} True si los productos están cargados
   */
  isLoaded() {
    return productsLoaded;
  },

  /**
   * Estado de carga en proceso
   * @returns {boolean} True si se están cargando productos
   */
  isLoading() {
    return productsLoading;
  }
};

/**
 * Disparar evento personalizado para productos
 * @param {string} eventName - Nombre del evento
 * @param {Object} detail - Detalles del evento
 */
function dispatchProductsEvent(eventName, detail = {}) {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(event);
}

/**
 * Renderizar productos en un grid con efectos visuales avanzados
 * @param {Product[]} productsToRender - Productos a renderizar
 * @param {string} containerId - ID del contenedor
 * @param {Object} options - Opciones de renderizado
 */
export function renderProductsGrid(productsToRender, containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor con ID ${containerId} no encontrado`);
    return;
  }

  const {
    emptyMessage = 'No se encontraron productos',
    emptySubmessage = 'Agrega productos desde el panel de administración',
    showCategory = true,
    showDescription = true,
    showPrices = true,
    animation = true
  } = options;

  if (!productsToRender || productsToRender.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 animate-fade-in">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <i class="fas fa-box-open text-2xl text-gray-400"></i>
        </div>
        <p class="text-gray-600 font-medium">${emptyMessage}</p>
        <p class="text-sm text-gray-500 mt-1">${emptySubmessage}</p>
      </div>
    `;
    return;
  }

  // Renderizar productos
  container.innerHTML = productsToRender.map((product, index) => {
    const categoryName = getCategoryName(product);
    const categoryColor = getCategoryColor(product);
    const cheapestPlan = getCheapestPlan(product.plans);
    
    return `
      <div class="product-card bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 group relative"
           data-product-id="${product.id}"
           style="animation-delay: ${index * 50}ms">
        
        <!-- Badge de destacado/nuevo -->
        ${isNewProduct(product) ? `
          <div class="absolute top-4 left-4 z-10">
            <span class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Nuevo</span>
          </div>
        ` : ''}
        
        <div class="h-56 bg-gray-100 overflow-hidden relative">
          <!-- Imagen del producto -->
          <div class="image-container w-full h-full relative overflow-hidden">
            <img src="${product.photo_url || 'https://via.placeholder.com/400x300?text=Sin+imagen'}" 
                 alt="${product.name}" 
                 class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Error+imagen'">
            
            <!-- Overlay con gradiente y información -->
            <div class="image-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
              <div class="p-5 w-full text-white transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                ${showCategory ? `
                  <span class="inline-block ${categoryColor} text-white text-xs px-3 py-1 rounded-full mb-2">
                    ${categoryName}
                  </span>
                ` : ''}
                
                <h3 class="text-xl font-bold mb-2 line-clamp-2">${product.name}</h3>
                
                ${showDescription && product.description ? `
                  <p class="text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 line-clamp-2">
                    ${product.description}
                  </p>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <!-- Información principal -->
          <div class="mb-4">
            ${showCategory ? `
              <div class="flex items-center justify-between mb-2">
                <span class="${categoryColor} text-xs font-medium px-2 py-1 rounded">
                  ${categoryName}
                </span>
                ${productRating(product)}
              </div>
            ` : ''}
            
            <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
              ${product.name}
            </h3>
            
            ${showDescription && product.description ? `
              <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
            ` : ''}
          </div>
          
          <!-- Precios y planes -->
          ${showPrices ? `
            <div class="mb-5">
              ${cheapestPlan ? `
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-2xl font-bold text-gray-900">
                    Desde ${formatCurrency(cheapestPlan.price_soles || cheapestPlan.price_dollars * 3.8)}
                  </span>
                </div>
              ` : ''}
              
              ${product.plans && product.plans.length > 0 ? `
                <div class="space-y-2">
                  ${product.plans.slice(0, 2).map(plan => `
                    <div class="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span class="font-medium text-gray-800">${plan.name}</span>
                      <div class="flex flex-col items-end">
                        ${plan.price_soles ? `
                          <span class="text-green-600 font-bold flex items-center">
                            <span class="text-xs mr-1">S/</span>${formatCurrency(plan.price_soles)}
                          </span>
                        ` : ''}
                        ${plan.price_dollars ? `
                          <span class="text-blue-600 text-sm flex items-center">
                            <span class="text-xs mr-1">$</span>${formatCurrency(plan.price_dollars)}
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                ${product.plans.length > 2 ? `
                  <div class="text-xs text-gray-500 mt-2 text-center">
                    +${product.plans.length - 2} plan(s) más disponibles
                  </div>
                ` : ''}
              ` : `
                <div class="text-center text-gray-500 text-sm py-3">
                  No hay planes disponibles
                </div>
              `}
            </div>
          ` : ''}
          
          <!-- Botón de acción -->
          <button class="view-details-btn w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center group/btn" 
                  data-product-id="${product.id}">
            <i class="fas fa-eye mr-2 group-hover/btn:animate-pulse"></i>
            Ver detalles
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Agregar event listeners
  container.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.currentTarget.dataset.productId;
      if (productId) {
        // Disparar evento personalizado para mostrar detalles
        const event = new CustomEvent('product:view-details', {
          detail: { productId },
          bubbles: true
        });
        e.currentTarget.dispatchEvent(event);
      }
    });
  });
  
  // Animaciones de entrada
  if (animation) {
    animateProductCards(container);
  }
}

/**
 * Renderizar lista de productos para administración
 * @param {Product[]} productsToRender - Productos a renderizar
 * @param {HTMLElement} container - Contenedor donde renderizar
 * @param {Object} options - Opciones de renderizado
 */
export function renderAdminProductsList(productsToRender, container, options = {}) {
  if (!container) return;

  const {
    emptyMessage = 'No hay productos registrados',
    emptySubmessage = 'Agrega tu primer producto usando el formulario'
  } = options;

  if (!productsToRender || productsToRender.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <i class="fas fa-box-open text-2xl text-gray-400"></i>
          </div>
          <p class="text-gray-500 font-medium">${emptyMessage}</p>
          <p class="text-sm text-gray-400 mt-1">${emptySubmessage}</p>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = productsToRender.map(product => {
    const categoryName = getCategoryName(product);
    const categoryColor = getCategoryColor(product);
    
    return `
      <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition-colors duration-150 group"
          data-product-id="${product.id}">
        <!-- Imagen -->
        <td class="py-4 px-4">
          <div class="w-14 h-14 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-200 border border-gray-200">
            <img src="${product.photo_url || 'https://via.placeholder.com/56x56?text=Imagen'}" 
                 alt="${product.name}" 
                 class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                 onerror="this.src='https://via.placeholder.com/56x56?text=Error'">
          </div>
        </td>
        
        <!-- Nombre -->
        <td class="py-4 px-4">
          <div class="flex flex-col">
            <span class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              ${product.name || 'Sin nombre'}
            </span>
            <span class="text-sm text-gray-500 mt-1 line-clamp-2">
              ${product.description || 'Sin descripción'}
            </span>
          </div>
        </td>
        
        <!-- Categoría -->
        <td class="py-4 px-4">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryColor}">
            ${categoryName}
          </span>
        </td>
        
        <!-- Planes y precios -->
        <td class="py-4 px-4">
          <div class="space-y-2">
            ${product.plans ? product.plans.slice(0, 2).map(plan => `
              <div class="text-sm">
                <div class="font-medium text-gray-800">${plan.name}</div>
                <div class="flex gap-3 mt-1">
                  ${plan.price_soles ? `
                    <span class="text-green-600 font-bold flex items-center text-xs">
                      <span class="mr-1">S/</span>${formatCurrency(plan.price_soles)}
                    </span>
                  ` : ''}
                  ${plan.price_dollars ? `
                    <span class="text-blue-600 flex items-center text-xs">
                      <span class="mr-1">$</span>${formatCurrency(plan.price_dollars)}
                    </span>
                  ` : ''}
                </div>
              </div>
            `).join('') : 'Sin planes'}
            
            ${product.plans && product.plans.length > 2 ? `
              <div class="text-xs text-gray-500 mt-1">
                +${product.plans.length - 2} plan(s) más
              </div>
            ` : ''}
          </div>
        </td>
        
        <!-- Fecha de creación -->
        <td class="py-4 px-4">
          <span class="text-sm text-gray-500" title="${new Date(product.created_at).toLocaleString()}">
            ${new Date(product.created_at).toLocaleDateString()}
          </span>
        </td>
        
        <!-- Acciones -->
        <td class="py-4 px-4">
          <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button class="edit-product p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-all duration-200 transform hover:scale-110" 
                    data-id="${product.id}" 
                    title="Editar producto">
              <i class="fas fa-edit fa-sm"></i>
            </button>
            <button class="delete-product p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-all duration-200 transform hover:scale-110" 
                    data-id="${product.id}" 
                    title="Eliminar producto">
              <i class="fas fa-trash fa-sm"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Agregar event listeners para acciones
  addAdminProductEventListeners(container);
}

/**
 * Animación de tarjetas de productos
 * @param {HTMLElement} container - Contenedor de tarjetas
 */
function animateProductCards(container) {
  const productCards = container.querySelectorAll('.product-card');
  
  productCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px) scale(0.95)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
    }, index * 80);
  });
}

/**
 * Agregar event listeners para acciones de administración
 * @param {HTMLElement} container - Contenedor de la lista
 */
function addAdminProductEventListeners(container) {
  // Botones de editar
  container.querySelectorAll('.edit-product').forEach(button => {
    button.addEventListener('click', debounce((e) => {
      const id = e.currentTarget.dataset.id;
      e.currentTarget.classList.add('scale-95');
      
      setTimeout(() => {
        e.currentTarget.classList.remove('scale-95');
        if (typeof window.editProduct === 'function') {
          window.editProduct(id);
        }
      }, 150);
    }, 200));
  });

  // Botones de eliminar
  container.querySelectorAll('.delete-product').forEach(button => {
    button.addEventListener('click', debounce((e) => {
      const id = e.currentTarget.dataset.id;
      e.currentTarget.classList.add('scale-95');
      
      setTimeout(() => {
        e.currentTarget.classList.remove('scale-95');
        
        // Mostrar confirmación elegante
        showDeleteConfirmation(id);
      }, 150);
    }, 200));
  });
}

/**
 * Mostrar diálogo de confirmación de eliminación
 * @param {string} productId - ID del producto a eliminar
 */
function showDeleteConfirmation(productId) {
  const product = ProductService.getProductById(productId);
  if (!product) return;

  // Crear modal de confirmación
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
      <div class="text-center mb-5">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">¿Eliminar producto?</h3>
        <p class="text-gray-600">Estás a punto de eliminar <span class="font-medium">"${product.name}"</span>. Esta acción no se puede deshacer.</p>
      </div>
      
      <div class="flex gap-3">
        <button class="cancel-delete flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
          Cancelar
        </button>
        <button class="confirm-delete flex-1 py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 flex items-center justify-center">
          <i class="fas fa-trash mr-2"></i>
          Eliminar
        </button>
      </div>
    </div>
  `;

  // Event listeners para los botones
  modal.querySelector('.cancel-delete').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.confirm-delete').addEventListener('click', async () => {
    modal.querySelector('.confirm-delete').disabled = true;
    modal.querySelector('.confirm-delete').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Eliminando...';
    
    const success = await ProductService.deleteProduct(productId);
    if (success) {
      modal.remove();
    } else {
      modal.querySelector('.confirm-delete').disabled = false;
      modal.querySelector('.confirm-delete').innerHTML = '<i class="fas fa-trash mr-2"></i> Eliminar';
    }
  });

  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

/**
 * Obtener nombre de categoría para un producto
 * @param {Product} product - Producto
 * @returns {string} Nombre de la categoría
 */
function getCategoryName(product) {
  if (product.categories && product.categories.name) {
    return product.categories.name;
  }
  
  if (product.category_id && typeof window.getCategoryName === 'function') {
    try {
      return window.getCategoryName(product.category_id) || `Categoría ${product.category_id}`;
    } catch (error) {
      console.error('Error obteniendo nombre de categoría:', error);
    }
  }
  
  return 'Sin categoría';
}

/**
 * Obtener color de categoría para estilos
 * @param {Product} product - Producto
 * @returns {string} Clases CSS para el color
 */
function getCategoryColor(product) {
  if (product.categories && product.categories.color) {
    return `bg-${product.categories.color}-100 text-${product.categories.color}-800`;
  }
  
  // Colores por defecto basados en el ID de categoría
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800'
  ];
  
  const index = product.category_id ? product.category_id % colors.length : 0;
  return colors[index];
}

/**
 * Obtener el plan más económico
 * @param {ProductPlan[]} plans - Array de planes
 * @returns {ProductPlan|null} Plan más económico
 */
function getCheapestPlan(plans) {
  if (!plans || plans.length === 0) return null;
  
  return plans.reduce((cheapest, plan) => {
    const price = plan.price_soles || (plan.price_dollars * 3.8); // Conversión aproximada
    const cheapestPrice = cheapest.price_soles || (cheapest.price_dollars * 3.8);
    
    return price < cheapestPrice ? plan : cheapest;
  });
}

/**
 * Determinar si un producto es nuevo (menos de 7 días)
 * @param {Product} product - Producto a verificar
 * @returns {boolean} True si es nuevo
 */
function isNewProduct(product) {
  if (!product.created_at) return false;
  
  const createdDate = new Date(product.created_at);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  return createdDate > weekAgo;
}

/**
 * Generar rating visual para un producto
 * @param {Product} product - Producto
 * @returns {string} HTML del rating
 */
function productRating(product) {
  // Simular rating (en una implementación real vendría de la base de datos)
  const rating = Math.random() * 2 + 3; // 3-5 stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  let stars = '';
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-yellow-400 text-xs"></i>';
  }
  
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt text-yellow-400 text-xs"></i>';
  }
  
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-yellow-400 text-xs"></i>';
  }
  
  return `<div class="flex items-center gap-1">${stars}</div>`;
}

// Hacer funciones disponibles globalmente
window.ProductService = ProductService;
window.renderProductsGrid = renderProductsGrid;
window.renderAdminProductsList = renderAdminProductsList;
