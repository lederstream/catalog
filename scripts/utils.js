// scripts/utils.js
import { showNotification, showError, showSuccess, showWarning, showInfo } from './notifications.js';

// Utilidades generales
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

export const formatCurrency = (amount, currency = 'PEN') => {
    // Manejar valores nulos o undefined
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
    }
    
    const formatter = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
};

export const validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
};

export const validateUrl = (url) => {
    if (!url) return false;
    try {
        // Asegurarse de que la URL tenga protocolo
        const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
        new URL(urlWithProtocol);
        return true;
    } catch (_) {
        return false;
    }
};

export const validateRequired = (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
};

export const validateNumber = (value) => {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) >= 0;
};

export const slugify = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

export const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
};

export const parseJSONSafe = (jsonString, defaultValue = null) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return defaultValue;
    }
};

export const stringifyJSONSafe = (data, defaultValue = '{}') => {
    try {
        return JSON.stringify(data);
    } catch (error) {
        console.error('Error stringifying JSON:', error);
        return defaultValue;
    }
};

export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
};

export const getRandomId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    
    return new Date(date).toLocaleDateString('es-ES', defaultOptions);
};

export const formatDateTime = (date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
};

export const isImageFile = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const extension = getFileExtension(filename);
    return imageExtensions.includes(extension);
};

export const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await sleep(delay);
        return retry(fn, retries - 1, delay * 2);
    }
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

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

export const filterUnique = (array, key = null) => {
    if (!array) return [];
    
    if (key) {
        return array.filter((item, index, self) =>
            index === self.findIndex(t => t[key] === item[key])
        );
    }
    return [...new Set(array)];
};

export const calculateTotal = (items, key) => {
    if (!items) return 0;
    return items.reduce((total, item) => total + (parseFloat(item[key]) || 0), 0);
};

export const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
};

export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomItem = (array) => {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
};

export const shuffleArray = (array) => {
    if (!array) return [];
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const createRange = (start, end, step = 1) => {
    const range = [];
    for (let i = start; i <= end; i += step) {
        range.push(i);
    }
    return range;
};

export const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

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
    
    return { name: M[0], version: M[1] };
};

export const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
};

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

export const measurePerformance = (fn, ...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    return {
        result,
        time: end - start
    };
};

export const createEvent = (name, detail = {}) => {
    return new CustomEvent(name, {
        detail,
        bubbles: true,
        cancelable: true
    });
};

export const dispatchCustomEvent = (element, eventName, detail = {}) => {
    const event = createEvent(eventName, detail);
    element.dispatchEvent(event);
    return event;
};

export const observeElement = (element, callback, options = {}) => {
    const observer = new MutationObserver(callback);
    observer.observe(element, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
        ...options
    });
    return observer;
};

export const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

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

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
};

export const addGlobalEventListener = (type, selector, callback, options = {}) => {
    document.addEventListener(type, (e) => {
        if (e.target.matches(selector)) {
            callback(e);
        }
    }, options);
};

export const getElementOffset = (element) => {
    if (!element) return { top: 0, left: 0, width: 0, height: 0 };
    
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
        width: rect.width,
        height: rect.height
    };
};

export const isElementInViewport = (element) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

export const scrollToElement = (element, options = {}) => {
    if (!element) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
};

export const disableScroll = () => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
};

export const enableScroll = () => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
};

export const lockBodyScroll = (lock = true) => {
    if (lock) {
        disableScroll();
    } else {
        enableScroll();
    }
};

export const createElement = (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    
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
        } else {
            element.setAttribute(key, value);
        }
    });
    
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
    if (!element) return;
    
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

export const hasClass = (element, className) => {
    if (!element) return false;
    return element.classList.contains(className);
};

export const addClass = (element, className) => {
    if (!element) return;
    element.classList.add(className);
};

export const removeClass = (element, className) => {
    if (!element) return;
    element.classList.remove(className);
};

export const setAttributes = (element, attributes) => {
    if (!element) return;
    
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
};

export const getComputedStyleValue = (element, property) => {
    if (!element) return '';
    return window.getComputedStyle(element).getPropertyValue(property);
};

export const animateValue = (element, property, start, end, duration = 1000, easing = 'easeInOut', unit = '') => {
    if (!element) return;
    
    const startTime = performance.now();
    const easingFunctions = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    };
    
    const ease = easingFunctions[easing] || easingFunctions.easeInOut;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = ease(progress);
        const value = start + (end - start) * easedProgress;
        
        element.style[property] = value + unit;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
};

export const preloadImages = (imageUrls) => {
    return Promise.all(
        imageUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });
        })
    );
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

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatNumber = (number, options = {}) => {
    const defaultOptions = {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options
    };
    
    return new Intl.NumberFormat('es-ES', defaultOptions).format(number);
};

export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const isEqual = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
};

export const difference = (a, b) => {
    if (!a) return [];
    if (!b) return a;
    return a.filter(x => !b.includes(x));
};

export const intersection = (a, b) => {
    if (!a || !b) return [];
    return a.filter(x => b.includes(x));
};

export const union = (a, b) => {
    return [...new Set([...(a || []), ...(b || [])])];
};

export const chunkArray = (array, size) => {
    if (!array) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

export const flattenArray = (array) => {
    if (!array) return [];
    
    return array.reduce((flat, next) => {
        return flat.concat(Array.isArray(next) ? flattenArray(next) : next);
    }, []);
};

export const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
};

export const pipe = (...fns) => {
    return (x) => fns.reduce((v, f) => f(v), x);
};

export const compose = (...fns) => {
    return (x) => fns.reduceRight((v, f) => f(v), x);
};

export const curry = (fn) => {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        } else {
            return function(...args2) {
                return curried.apply(this, args.concat(args2));
            };
        }
    };
};

export const once = (fn) => {
    let called = false;
    let result;
    return function(...args) {
        if (!called) {
            called = true;
            result = fn.apply(this, args);
        }
        return result;
    };
};

export const createDebouncedFunction = (fn, delay) => {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
};

export const createThrottledFunction = (fn, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Utilidades específicas para el catálogo
export const validateProductForm = (formData) => {
    const errors = [];
    
    if (!validateRequired(formData.name)) {
        errors.push('El nombre del producto es requerido');
    }
    
    if (!validateRequired(formData.category)) {
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
            
            if (!validateNumber(plan.price_soles) || parseFloat(plan.price_soles) < 0) {
                errors.push(`El precio en soles del plan ${index + 1} no es válido`);
            }
            
            if (!validateNumber(plan.price_dollars) || parseFloat(plan.price_dollars) < 0) {
                errors.push(`El precio en dólares del plan ${index + 1} no es válido`);
            }
        });
    }
    
    return errors;
};

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

export const escapeHtml = (text) => {
    if (!text) return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Eliminar scripts y etiquetas potencialmente peligrosas
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/g, '')
                .replace(/on\w+='[^']*'/g, '')
                .replace(/on\w+=\w+/g, '')
                .trim();
};

// Exportar funciones de notificación para uso conveniente
export { showNotification, showError, showSuccess, showWarning, showInfo };

if (typeof window !== 'undefined') {
    window.showNotification = showNotification;
    window.showError = showError;
    window.showSuccess = showSuccess;
    window.showWarning = showWarning;
    window.showInfo = showInfo;
}
