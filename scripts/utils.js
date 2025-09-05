// scripts/utils.js
// Estado global de utilidades
const UtilsState = {
    debugMode: localStorage.getItem('debug') === 'true',
    performanceMetrics: new Map()
};

// ===== FUNCIONES BÁSICAS =====
export const debounce = (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

export const catalogDebounce = debounce;

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

// ===== FUNCIONES DE NOTIFICACIÓN =====
const showNotification = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Eliminar notificaciones existentes
    document.querySelectorAll('.app-notification').forEach(el => el.remove());
    
    // Implementación de notificación
    const notification = document.createElement('div');
    notification.className = `app-notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-100 border-green-500 text-green-700' :
        type === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
        type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
        'bg-blue-100 border-blue-500 text-blue-700'
    } border-l-4`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${
                type === 'success' ? '✅' :
                type === 'error' ? '❌' :
                type === 'warning' ? '⚠️' : 'ℹ️'
            }</span>
            <span>${message}</span>
            <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
};

const showError = (message) => showNotification(message, 'error');
const showSuccess = (message) => showNotification(message, 'success');
const showWarning = (message) => showNotification(message, 'warning');
const showInfo = (message) => showNotification(message, 'info');

// ===== VALIDACIONES =====
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
};

export const validateUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
        const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
        new URL(urlWithProtocol);
        return true;
    } catch {
        return false;
    }
};

export const validateRequired = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
};

export const validateNumber = (value, min = 0, max = Infinity) => {
    if (value === null || value === undefined || value === '') return false;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= min && num <= max;
};

// ===== FORMATEO Y MANIPULACIÓN =====
export const formatCurrency = (amount, currency = 'PEN', locale = 'es-PE') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
    }
    
    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
};

export const slugify = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export const capitalize = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength = 100, suffix = '...') => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + suffix;
};

// ===== MANEJO DE FECHAS =====
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    
    try {
        return new Date(date).toLocaleDateString('es-ES', defaultOptions);
    } catch {
        return 'Fecha inválida';
    }
};

export const formatDateTime = (date) => {
    if (!date) return '';
    
    try {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Fecha/hora inválida';
    }
};

// ===== MANEJO DE ARCHIVOS =====
export const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    return filename.split('.').pop().toLowerCase();
};

export const isImageFile = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const extension = getFileExtension(filename);
    return imageExtensions.includes(extension);
};

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const lazyLoadImages = (images) => {
    if (!images || images.length === 0) return;
    
    const lazyImages = [...images];
    
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src || lazyImage.src;
                    
                    if (lazyImage.dataset.srcset) {
                        lazyImage.srcset = lazyImage.dataset.srcset;
                    }
                    
                    lazyImage.classList.remove('lazy');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });
        
        lazyImages.forEach(lazyImage => {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback para navegadores que no soportan IntersectionObserver
        lazyImages.forEach(lazyImage => {
            lazyImage.src = lazyImage.dataset.src || lazyImage.src;
        });
    }
};

// ===== MANIPULACIÓN DEL DOM =====
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
            Object.assign(element.dataset, value);
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

export const removeAllChildren = (element) => {
    if (!element || !element.parentNode) return;
    
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

export const toggleClass = (element, className, force) => {
    if (!element) return;
    
    if (force !== undefined) {
        element.classList.toggle(className, force);
    } else {
        element.classList.toggle(className);
    }
};

export const addClass = (element, ...classNames) => {
    if (!element) return;
    element.classList.add(...classNames);
};

export const removeClass = (element, ...classNames) => {
    if (!element) return;
    element.classList.remove(...classNames);
};

// ===== ANIMACIONES Y TRANSICIONES =====
export const fadeIn = (element, duration = 300, display = 'block') => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.style.opacity = '0';
        element.style.display = display;
        
        let start = null;
        
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
};

export const fadeOut = (element, duration = 300) => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        let start = null;
        
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(startOpacity - (progress / duration), 0);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration && opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
};

export const slideDown = (element, duration = 300) => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.style.display = 'block';
        const height = element.scrollHeight;
        
        element.style.overflow = 'hidden';
        element.style.height = '0px';
        element.style.transition = `height ${duration}ms ease`;
        
        // Forzar reflow
        element.offsetHeight;
        
        element.style.height = `${height}px`;
        
        setTimeout(() => {
            element.style.overflow = '';
            element.style.height = '';
            element.style.transition = '';
            resolve();
        }, duration);
    });
};

export const slideUp = (element, duration = 300) => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        const height = element.scrollHeight;
        
        element.style.overflow = 'hidden';
        element.style.height = `${height}px`;
        element.style.transition = `height ${duration}ms ease`;
        
        // Forzar reflow
        element.offsetHeight;
        
        element.style.height = '0px';
        
        setTimeout(() => {
            element.style.display = 'none';
            element.style.overflow = '';
            element.style.height = '';
            element.style.transition = '';
            resolve();
        }, duration);
    });
};

// ===== MANEJO DE EVENTOS =====
export const addGlobalEventListener = (type, selector, callback, options = {}) => {
    document.addEventListener(type, (e) => {
        if (e.target.matches(selector) || e.target.closest(selector)) {
            callback(e);
        }
    }, options);
};

export const delegateEvent = (container, type, selector, callback) => {
    if (!container) return;
    
    container.addEventListener(type, (e) => {
        if (e.target.matches(selector) || e.target.closest(selector)) {
            callback(e);
        }
    });
};

// ===== SCROLL Y VISIBILIDAD =====
export const smoothScrollTo = (target, offset = 0, duration = 800) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        const startPosition = window.pageYOffset;
        const targetPosition = element.getBoundingClientRect().top + startPosition - offset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
            
            window.scrollTo(0, run);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            } else {
                resolve();
            }
        }
        
        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    });
};

export const isElementInViewport = (element, threshold = 0) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const vertInView = (rect.top <= windowHeight - threshold) && 
                      (rect.top + rect.height >= threshold);
    const horInView = (rect.left <= windowWidth - threshold) && 
                     (rect.left + rect.width >= threshold);
    
    return vertInView && horInView;
};

export const observeElementIntersection = (element, callback, options = {}) => {
    if (!element || !('IntersectionObserver' in window)) return null;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px',
        ...options
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            callback(entry.isIntersecting, entry);
        });
    }, observerOptions);
    
    observer.observe(element);
    return observer;
};

// ===== ALMACENAMIENTO Y DATOS =====
export const safeJSONParse = (jsonString, defaultValue = null) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        if (UtilsState.debugMode) {
            console.error('Error parsing JSON:', error, jsonString);
        }
        return defaultValue;
    }
};

export const safeJSONStringify = (data, defaultValue = '{}') => {
    try {
        return JSON.stringify(data);
    } catch (error) {
        if (UtilsState.debugMode) {
            console.error('Error stringifying JSON:', error, data);
        }
        return defaultValue;
    }
};

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

// ===== RENDIMIENTO Y DEBUGGING =====
export const measurePerformance = (name, fn) => {
    if (!UtilsState.debugMode) return fn();
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    UtilsState.performanceMetrics.set(name, end - start);
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    
    return result;
};

export const getPerformanceMetrics = () => {
    return Array.from(UtilsState.performanceMetrics.entries());
};

export const enableDebugMode = (enable = true) => {
    UtilsState.debugMode = enable;
    localStorage.setItem('debug', enable.toString());
    console.log(`🔧 Debug mode ${enable ? 'enabled' : 'disabled'}`);
};

// ===== UTILIDADES ESPECÍFICAS DEL CATÁLOGO =====
export const validateProductForm = (formData) => {
    const errors = [];
    
    if (!validateRequired(formData.name)) {
        errors.push('El nombre del producto es requerido');
    }
    
    if (!validateRequired(formData.category_id)) {
        errors.push('La categoría es requerida');
    }
    
    if (!validateRequired(formData.description)) {
        errors.push('La descripción es requerida');
    }
    
    if (!validateUrl(formData.photo_url)) {
        errors.push('La URL de la imagen no es válida');
    }
    
    if (!formData.plans || formData.plans.length === 0) {
        errors.push('Debe agregar al menos un plan');
    } else {
        formData.plans.forEach((plan, index) => {
            if (!validateRequired(plan.name)) {
                errors.push(`El nombre del plan ${index + 1} es requerido`);
            }
            
            const hasSoles = validateNumber(plan.price_soles) && parseFloat(plan.price_soles) >= 0;
            const hasDollars = validateNumber(plan.price_dollars) && parseFloat(plan.price_dollars) >= 0;
            
            if (!hasSoles && !hasDollars) {
                errors.push(`El plan ${index + 1} debe tener al menos un precio válido (soles o dólares)`);
            }
        });
    }
    
    return errors;
};

export const formatPlanPrices = (plans) => {
    if (!plans || !Array.isArray(plans)) return [];
    
    return plans.map(plan => {
        const priceSoles = plan.price_soles ? parseFloat(plan.price_soles) : 0;
        const priceDollars = plan.price_dollars ? parseFloat(plan.price_dollars) : 0;
        
        return {
            ...plan,
            price_soles: priceSoles,
            price_dollars: priceDollars,
            formatted_soles: formatCurrency(priceSoles, 'PEN'),
            formatted_dollars: formatCurrency(priceDollars, 'USD')
        };
    });
};

export const escapeHtml = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/on\w+=\w+/g, '')
        .trim();
};

// ===== INICIALIZACIÓN =====
export const initUtils = () => {
    // Configurar modo debug si está en localStorage
    if (localStorage.getItem('debug') === 'true') {
        enableDebugMode(true);
    }
    
    console.log('✅ Utilidades inicializadas');
};

export function debugLog(message, data = null) {
    if (window.location.search.includes('debug=true')) {
        console.log(`🔍 ${message}`, data || '');
    }
}

export function errorHandler(error, context = '') {
    console.error(`❌ Error en ${context}:`, error);
    showNotification(`Error en ${context}: ${error.message}`, 'error');
    return null;
}

class Logger {
    static debug(message, data = null) {
        if (localStorage.getItem('debug') === 'true') {
            console.log(`🔍 ${message}`, data || '');
        }
    }
    
    static error(context, error) {
        console.error(`❌ Error en ${context}:`, error);
        showNotification(`Error en ${context}: ${error.message}`, 'error');
    }
    
    static performance(name, duration) {
        if (localStorage.getItem('debug') === 'true') {
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        }
    }
}

// Exportar funciones de notificación
export { 
    showNotification, 
    showError, 
    showSuccess, 
    showWarning, 
    showInfo 
};

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.utils = {
        debounce,
        throttle,
        validateEmail,
        validateUrl,
        validateRequired,
        validateNumber,
        formatCurrency,
        slugify,
        capitalize,
        truncateText,
        formatDate,
        formatDateTime,
        fadeIn,
        fadeOut,
        slideDown,
        slideUp,
        smoothScrollTo,
        isElementInViewport,
        measurePerformance,
        enableDebugMode,
        debugLog,
        errorHandler
    };
}

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUtils);
} else {
    setTimeout(initUtils, 0);
}
