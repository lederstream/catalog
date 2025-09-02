// scripts/utils.js - Utilidades avanzadas para el proyecto
import { 
  showNotification, 
  showError, 
  showSuccess, 
  showWarning, 
  showInfo 
} from './notifications.js';

/**
 * Módulo de utilidades generales para el proyecto
 * Incluye funciones para validación, formato, manipulación DOM, etc.
 */

// Constantes globales
export const CONSTANTS = {
  CURRENCY_FORMAT: {
    PEN: { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 },
    USD: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }
  },
  DATE_FORMAT: {
    SHORT: { year: 'numeric', month: 'short', day: 'numeric' },
    LONG: { year: 'numeric', month: 'long', day: 'numeric' },
    FULL: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  },
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
    PRICE: /^\d+(\.\d{1,2})?$/
  },
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280
  }
};

/**
 * DEBOUNCE & THROTTLE
 * Utilidades para controlar la frecuencia de ejecución de funciones
 */

/**
 * Debounce function para limitar ejecuciones frecuentes
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Ejecutar inmediatamente
 * @returns {Function} Función debounceada
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

/**
 * Throttle function para limitar ejecuciones a un intervalo
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Intervalo en ms
 * @returns {Function} Función throttleada
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * VALIDATION UTILITIES
 * Funciones para validación de datos
 */

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return CONSTANTS.REGEX.EMAIL.test(email.trim());
};

/**
 * Validar URL
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válido
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Asegurarse de que la URL tenga protocolo
  const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
  
  try {
    new URL(urlWithProtocol);
    return CONSTANTS.REGEX.URL.test(urlWithProtocol);
  } catch {
    return false;
  }
};

/**
 * Validar campo requerido
 * @param {*} value - Valor a validar
 * @returns {boolean} True si tiene valor
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Validar número
 * @param {*} value - Valor a validar
 * @param {Object} options - Opciones de validación
 * @returns {boolean} True si es un número válido
 */
export const validateNumber = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, integer = false } = options;
  
  if (value === null || value === undefined || value === '') return false;
  
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(value)) return false;
  if (integer && !Number.isInteger(num)) return false;
  
  return num >= min && num <= max;
};

/**
 * Validar teléfono
 * @param {string} phone - Número de teléfono
 * @returns {boolean} True si es válido
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return CONSTANTS.REGEX.PHONE.test(phone.replace(/\s/g, ''));
};

/**
 * Validar precio
 * @param {*} value - Valor a validar
 * @returns {boolean} True si es un precio válido
 */
export const validatePrice = (value) => {
  if (!validateNumber(value, { min: 0 })) return false;
  return CONSTANTS.REGEX.PRICE.test(value.toString());
};

/**
 * Validar formulario completo
 * @param {Object} formData - Datos del formulario
 * @param {Object} rules - Reglas de validación
 * @returns {Object} Objeto con errores y isValid
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, rule]) => {
    const value = formData[field];
    const fieldErrors = [];
    
    // Validar requerido
    if (rule.required && !validateRequired(value)) {
      fieldErrors.push(rule.requiredMessage || `${field} es requerido`);
    }
    
    // Validar email
    if (rule.email && value && !validateEmail(value)) {
      fieldErrors.push(rule.emailMessage || 'Email no válido');
    }
    
    // Validar URL
    if (rule.url && value && !validateUrl(value)) {
      fieldErrors.push(rule.urlMessage || 'URL no válida');
    }
    
    // Validar número
    if (rule.number && value && !validateNumber(value, rule.numberOptions)) {
      const { min, max } = rule.numberOptions || {};
      let message = 'Número no válido';
      
      if (min !== undefined && max !== undefined) {
        message = `Debe estar entre ${min} y ${max}`;
      } else if (min !== undefined) {
        message = `Debe ser al menos ${min}`;
      } else if (max !== undefined) {
        message = `No puede exceder ${max}`;
      }
      
      fieldErrors.push(rule.numberMessage || message);
    }
    
    // Validar longitud mínima
    if (rule.minLength && value && value.length < rule.minLength) {
      fieldErrors.push(rule.minLengthMessage || `Mínimo ${rule.minLength} caracteres`);
    }
    
    // Validar longitud máxima
    if (rule.maxLength && value && value.length > rule.maxLength) {
      fieldErrors.push(rule.maxLengthMessage || `Máximo ${rule.maxLength} caracteres`);
    }
    
    // Validación personalizada
    if (rule.custom && value) {
      const customResult = rule.custom(value, formData);
      if (customResult !== true) {
        fieldErrors.push(customResult || `Validación falló para ${field}`);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

/**
 * FORMATTING UTILITIES
 * Funciones para formateo de datos
 */

/**
 * Formatear currency
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (PEN, USD)
 * @param {Object} options - Opciones adicionales
 * @returns {string} Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'PEN', options = {}) => {
  // Manejar valores nulos o undefined
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  
  const formatter = new Intl.NumberFormat('es-PE', {
    ...CONSTANTS.CURRENCY_FORMAT[currency] || CONSTANTS.CURRENCY_FORMAT.PEN,
    ...options
  });
  
  return formatter.format(amount);
};

/**
 * Formatear fecha
 * @param {Date|string} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const formatOptions = {
    ...CONSTANTS.DATE_FORMAT.LONG,
    ...options
  };
  
  return dateObj.toLocaleDateString('es-ES', formatOptions);
};

/**
 * Formatear fecha y hora
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatear número
 * @param {number} number - Número a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Número formateado
 */
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined || isNaN(number)) {
    number = 0;
  }
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };
  
  return new Intl.NumberFormat('es-ES', defaultOptions).format(number);
};

/**
 * Formatear bytes a tamaño legible
 * @param {number} bytes - Bytes a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Tamaño formateado
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Slugify text
 * @param {string} text - Texto a convertir
 * @returns {string} Texto slugificado
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\s+/g, '-')           // Reemplazar espacios con -
    .replace(/[^\w\-]+/g, '')       // Eliminar caracteres no alfanuméricos
    .replace(/\-\-+/g, '-')         // Reemplazar múltiples - con uno solo
    .replace(/^-+/, '')             // Eliminar - del inicio
    .replace(/-+$/, '');            // Eliminar - del final
};

/**
 * Capitalizar texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalizar cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.replace(/\w\S*/g, (word) => 
    word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
  );
};

/**
 * Truncar texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo para texto truncado
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + suffix;
};

/**
 * DOM & UI UTILITIES
 * Utilidades para manipulación del DOM y UI
 */

/**
 * Crear elemento DOM con atributos y hijos
 * @param {string} tag - Etiqueta HTML
 * @param {Object} attributes - Atributos del elemento
 * @param {Array} children - Hijos del elemento
 * @returns {HTMLElement} Elemento creado
 */
export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  // Manejar atributos especiales
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Agregar hijos
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
};

/**
 * Esperar a que un elemento exista en el DOM
 * @param {string} selector - Selector del elemento
 * @param {number} timeout - Tiempo máximo de espera
 * @returns {Promise<HTMLElement>} Promesa con el elemento
 */
export const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    // Verificar si ya existe
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Observar cambios en el DOM
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} no encontrado en ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Agregar event listener global
 * @param {string} type - Tipo de evento
 * @param {string} selector - Selector del objetivo
 * @param {Function} callback - Función callback
 * @param {Object} options - Opciones del evento
 */
export const addGlobalEventListener = (type, selector, callback, options = {}) => {
  document.addEventListener(type, (e) => {
    if (e.target.matches(selector)) {
      callback(e);
    }
  }, options);
};

/**
 * Alternar clase en elemento
 * @param {HTMLElement} element - Elemento
 * @param {string} className - Clase a alternar
 * @param {boolean} force - Forzar estado
 */
export const toggleClass = (element, className, force) => {
  if (!element) return;
  
  if (force !== undefined) {
    element.classList.toggle(className, force);
    return;
  }
  
  element.classList.toggle(className);
};

/**
 * Verificar si elemento tiene clase
 * @param {HTMLElement} element - Elemento
 * @param {string} className - Clase a verificar
 * @returns {boolean} True si tiene la clase
 */
export const hasClass = (element, className) => {
  if (!element) return false;
  return element.classList.contains(className);
};

/**
 * Scroll suave a elemento
 * @param {HTMLElement} element - Elemento destino
 * @param {Object} options - Opciones de scroll
 */
export const scrollToElement = (element, options = {}) => {
  if (!element) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * Scroll suave a posición
 * @param {number} top - Posición vertical
 * @param {number} left - Posición horizontal
 * @param {Object} options - Opciones de scroll
 */
export const scrollToPosition = (top = 0, left = 0, options = {}) => {
  const { behavior = 'smooth' } = options;
  
  window.scrollTo({
    top,
    left,
    behavior
  });
};

/**
 * Obtener posición y dimensiones de elemento
 * @param {HTMLElement} element - Elemento
 * @returns {Object} Posición y dimensiones
 */
export const getElementOffset = (element) => {
  if (!element) return { top: 0, left: 0, width: 0, height: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  };
};

/**
 * Verificar si elemento está en viewport
 * @param {HTMLElement} element - Elemento a verificar
 * @param {number} offset - Offset en píxeles
 * @returns {boolean} True si está en viewport
 */
export const isElementInViewport = (element, offset = 0) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
};

/**
 * DATA UTILITIES
 * Utilidades para manipulación de datos
 */

/**
 * Parsear JSON de forma segura
 * @param {string} jsonString - String JSON
 * @param {*} defaultValue - Valor por defecto en caso de error
 * @returns {*} Objeto parseado o valor por defecto
 */
export const parseJSONSafe = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

/**
 * Convertir objeto a JSON de forma segura
 * @param {*} data - Datos a convertir
 * @param {*} defaultValue - Valor por defecto en caso de error
 * @returns {string} JSON string o valor por defecto
 */
export const stringifyJSONSafe = (data, defaultValue = '{}') => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    return defaultValue;
  }
};

/**
 * Clonado profundo de objeto
 * @param {*} obj - Objeto a clonar
 * @returns {*} Clon del objeto
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * Generar UUID v4
 * @returns {string} UUID
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generar ID único
 * @returns {string} ID único
 */
export const getRandomId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

/**
 * Filtrar array por propiedad única
 * @param {Array} array - Array a filtrar
 * @param {string} key - Key para unique
 * @returns {Array} Array filtrado
 */
export const filterUnique = (array, key = null) => {
  if (!array) return [];
  
  if (key) {
    return array.filter((item, index, self) =>
      index === self.findIndex(t => t[key] === item[key])
    );
  }
  
  return [...new Set(array)];
};

/**
 * Agrupar array por propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Key para agrupar
 * @returns {Object} Objeto agrupado
 */
export const groupBy = (array, key) => {
  if (!array) return {};
  
  return array.reduce((result, currentValue) => {
    const keyValue = currentValue[key];
    if (keyValue !== undefined && keyValue !== null) {
      (result[keyValue] = result[keyValue] || []).push(currentValue);
    }
    return result;
  }, {});
};

/**
 * Ordenar array por propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Key para ordenar
 * @param {string} direction - Dirección (asc/desc)
 * @returns {Array} Array ordenado
 */
export const sortBy = (array, key, direction = 'asc') => {
  if (!array) return [];
  
  return [...array].sort((a, b) => {
    let aValue = a[key];
    let bValue = b[key];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Paginar array
 * @param {Array} array - Array a paginar
 * @param {number} page - Página actual
 * @param {number} perPage - Elementos por página
 * @returns {Object} Objeto con items y metadata
 */
export const paginate = (array, page = 1, perPage = 10) => {
  if (!array) return { items: [], total: 0, pages: 0, page, perPage };
  
  const total = array.length;
  const pages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const items = array.slice(start, end);
  
  return {
    items,
    total,
    pages,
    page,
    perPage,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

/**
 * BUSINESSS UTILITIES
 * Utilidades específicas para el negocio
 */

/**
 * Validar formulario de producto
 * @param {Object} formData - Datos del formulario
 * @returns {string[]} Array de errores
 */
export const validateProductForm = (formData) => {
  const errors = [];
  
  if (!validateRequired(formData.name)) {
    errors.push('El nombre del producto es requerido');
  } else if (formData.name.length > 100) {
    errors.push('El nombre no puede exceder los 100 caracteres');
  }
  
  if (!validateRequired(formData.description)) {
    errors.push('La descripción es requerida');
  } else if (formData.description.length > 500) {
    errors.push('La descripción no puede exceder los 500 caracteres');
  }
  
  if (!validateUrl(formData.photo_url)) {
    errors.push('La URL de la imagen no es válida');
  }
  
  if (!formData.category_id) {
    errors.push('Debe seleccionar una categoría');
  }
  
  if (!formData.plans || formData.plans.length === 0) {
    errors.push('Debe agregar al menos un plan');
  } else {
    formData.plans.forEach((plan, index) => {
      if (!validateRequired(plan.name)) {
        errors.push(`El nombre del plan ${index + 1} es requerido`);
      }
      
      if (!validateNumber(plan.price_soles, { min: 0 }) || !validateNumber(plan.price_dollars, { min: 0 })) {
        errors.push(`Los precios del plan ${index + 1} deben ser números válidos`);
      }
      
      const hasSoles = validateNumber(plan.price_soles, { min: 0 });
      const hasDollars = validateNumber(plan.price_dollars, { min: 0 });
      
      if (!hasSoles && !hasDollars) {
        errors.push(`El plan ${index + 1} debe tener al menos un precio (soles o dólares)`);
      }
    });
  }
  
  return errors;
};

/**
 * Formatear precios de planes
 * @param {Array} plans - Array de planes
 * @returns {Array} Planes formateados
 */
export const formatPlanPrices = (plans) => {
  if (!plans) return [];
  
  return plans.map(plan => ({
    ...plan,
    price_soles: plan.price_soles ? parseFloat(plan.price_soles) : 0,
    price_dollars: plan.price_dollars ? parseFloat(plan.price_dollars) : 0,
    formatted_soles: formatCurrency(plan.price_soles, 'PEN'),
    formatted_dollars: formatCurrency(plan.price_dollars, 'USD')
  }));
};

/**
 * Sanitizar input para prevenir XSS
 * @param {string} input - Input a sanitizar
 * @returns {string} Input sanitizado
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Eliminar scripts y etiquetas potencialmente peligrosas
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/on\w+=\w+/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

/**
 * Escape HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=\/]/g, function(m) { return map[m]; });
};

/**
 * BROWSER & DEVICE UTILITIES
 * Utilidades para detectar navegador y dispositivo
 */

/**
 * Detectar si es dispositivo móvil
 * @returns {boolean} True si es móvil
 */
export const isMobileDevice = () => {
  return window.innerWidth <= CONSTANTS.BREAKPOINTS.MOBILE || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detectar si es dispositivo táctil
 * @returns {boolean} True si es táctil
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
};

/**
 * Obtener información del navegador
 * @returns {Object} Información del navegador
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let tem;
  let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: (tem[1] || '') };
  }
  
  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
  }
  
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  
  return { 
    name: M[0], 
    version: M[1],
    isMobile: isMobileDevice(),
    isTouch: isTouchDevice()
  };
};

/**
 * Obtener tipo de dispositivo
 * @returns {string} Tipo de dispositivo
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < CONSTANTS.BREAKPOINTS.MOBILE) return 'mobile';
  if (width < CONSTANTS.BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
};

/**
 * PERFORMANCE UTILITIES
 * Utilidades para medición de rendimiento
 */

/**
 * Medir tiempo de ejecución de función
 * @param {Function} fn - Función a medir
 * @param {...*} args - Argumentos de la función
 * @returns {Object} Resultado y tiempo de ejecución
 */
export const measurePerformance = (fn, ...args) => {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  return {
    result,
    time: end - start,
    timestamp: new Date().toISOString()
  };
};

/**
 * Función sleep para esperar
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promesa que se resuelve después del tiempo
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Reintentar función con backoff exponencial
 * @param {Function} fn - Función a reintentar
 * @param {number} retries - Intentos máximos
 * @param {number} delay - Delay inicial
 * @returns {Promise} Promesa con el resultado
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * OTHER UTILITIES
 * Otras utilidades varias
 */

/**
 * Copiar texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió correctamente
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Texto copiado al portapapeles');
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    
    // Fallback para navegadores más antiguos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showSuccess('Texto copiado al portapapeles');
        return true;
      } else {
        showError('Error al copiar el texto');
        return false;
      }
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      showError('Error al copiar el texto');
      return false;
    }
  }
};

/**
 * Descargar archivo
 * @param {*} content - Contenido del archivo
 * @param {string} fileName - Nombre del archivo
 * @param {string} contentType - Tipo de contenido
 */
export const downloadFile = (content, fileName, contentType = 'text/plain') => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Cargar script dinámicamente
 * @param {string} src - URL del script
 * @param {boolean} async - Cargar async
 * @param {boolean} defer - Cargar defer
 * @returns {Promise} Promesa que se resuelve cuando se carga
 */
export const loadScript = (src, async = true, defer = true) => {
  return new Promise((resolve, reject) => {
    // Verificar si el script ya está cargado
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

/**
 * Cargar estilo dinámicamente
 * @param {string} href - URL del estilo
 * @returns {Promise} Promesa que se resuelve cuando se carga
 */
export const loadStyle = (href) => {
  return new Promise((resolve, reject) => {
    // Verificar si el estilo ya está cargado
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
    document.head.appendChild(link);
  });
};

// Exportar funciones de notificación para uso conveniente
export { showNotification, showError, showSuccess, showWarning, showInfo };

// Hacer utilidades disponibles globalmente
if (typeof window !== 'undefined') {
  window.utils = {
    debounce,
    throttle,
    validateEmail,
    validateUrl,
    validateRequired,
    validateNumber,
    validateForm,
    formatCurrency,
    formatDate,
    formatNumber,
    slugify,
    capitalize,
    truncateText,
    createElement,
    waitForElement,
    scrollToElement,
    scrollToPosition,
    parseJSONSafe,
    deepClone,
    generateUUID,
    filterUnique,
    groupBy,
    sortBy,
    paginate,
    isMobileDevice,
    isTouchDevice,
    getBrowserInfo,
    measurePerformance,
    sleep,
    retry,
    copyToClipboard,
    downloadFile,
    loadScript,
    loadStyle,
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
}
