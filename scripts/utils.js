// scripts/utils.js
import { showNotification, showError, showSuccess, showWarning, showInfo } from './notifications.js';

// Utilidades generales mejoradas
export const debounce = (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

export const formatCurrency = (amount, currency = 'PEN') => {
    // Manejar valores nulos o undefined de forma más robusta
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
    }
    
    // Asegurar que es un número
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return 'S/ 0.00';
    }
    
    const formatter = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(numericAmount);
};

export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
};

export const validateUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    try {
        // Asegurarse de que la URL tenga protocolo
        let urlToTest = url.trim();
        if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
            urlToTest = 'https://' + urlToTest;
        }
        
        const parsedUrl = new URL(urlToTest);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

export const validateRequired = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
};

export const validateNumber = (value, options = {}) => {
    const { min = 0, max = Infinity, allowNegative = false } = options;
    
    if (value === null || value === undefined || value === '') return false;
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || !isFinite(numericValue)) return false;
    
    if (!allowNegative && numericValue < 0) return false;
    if (numericValue < min || numericValue > max) return false;
    
    return true;
};

export const slugify = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/\s+/g, '-')           // Reemplazar espacios con -
        .replace(/[^\w\-]+/g, '')       // Eliminar caracteres no alfanuméricos
        .replace(/\-\-+/g, '-')         // Reemplazar múltiples - con uno solo
        .replace(/^-+/, '')             // Eliminar - del inicio
        .replace(/-+$/, '');            // Eliminar - del final
};

export const capitalize = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const titleCase = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const truncateText = (text, maxLength = 100, ellipsis = '...') => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    
    // Truncar en el último espacio completo para evitar cortar palabras
    const truncated = text.substr(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.7) {
        return truncated.substr(0, lastSpaceIndex) + ellipsis;
    }
    
    return truncated + ellipsis;
};

export const parseJSONSafe = (jsonString, defaultValue = null) => {
    if (!jsonString || typeof jsonString !== 'string') return defaultValue;
    
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error parsing JSON:', error, 'Input:', jsonString);
        return defaultValue;
    }
};

export const stringifyJSONSafe = (data, defaultValue = '{}', space = 2) => {
    try {
        return JSON.stringify(data, null, space);
    } catch (error) {
        console.error('Error stringifying JSON:', error, 'Data:', data);
        return defaultValue;
    }
};

export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Manejar fechas
    if (obj instanceof Date) return new Date(obj.getTime());
    
    // Manejar arrays
    if (Array.isArray(obj)) return obj.map(item => deepClone(item));
    
    // Manejar objetos
    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    
    return clonedObj;
};

export const getRandomId = (prefix = '') => {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    
    return dateObj.toLocaleDateString('es-ES', defaultOptions);
};

export const formatDateTime = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };
    
    return dateObj.toLocaleDateString('es-ES', defaultOptions);
};

export const getRelativeTime = (date) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) return 'hace un momento';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `hace ${diffInMonths} mes${diffInMonths !== 1 ? 'es' : ''}`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `hace ${diffInYears} año${diffInYears !== 1 ? 's' : ''}`;
};

export const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    
    const parts = filename.split('.');
    if (parts.length === 1) return '';
    
    return parts.pop().toLowerCase();
};

export const isImageFile = (filename) => {
    const extension = getFileExtension(filename);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    return imageExtensions.includes(extension);
};

export const isDocumentFile = (filename) => {
    const extension = getFileExtension(filename);
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    return documentExtensions.includes(extension);
};

export const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return 'Tamaño inválido';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async (fn, retries = 3, delay = 1000, onRetry = null) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        
        if (onRetry && typeof onRetry === 'function') {
            onRetry(error, retries);
        }
        
        await sleep(delay);
        return retry(fn, retries - 1, delay * 2, onRetry);
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
    if (!Array.isArray(array)) return {};
    
    return array.reduce((result, currentValue) => {
        const keyValue = currentValue[key];
        if (keyValue !== undefined && keyValue !== null) {
            (result[keyValue] = result[keyValue] || []).push(currentValue);
        }
        return result;
    }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
        let aValue = a[key];
        let bValue = b[key];
        
        // Manejar valores undefined/null
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

export const filterUnique = (array, key = null) => {
    if (!Array.isArray(array)) return [];
    
    if (key) {
        return array.filter((item, index, self) =>
            index === self.findIndex(t => (
                t[key] === item[key] && 
                t[key] !== undefined && 
                t[key] !== null
            ))
        );
    }
    return [...new Set(array)];
};

export const calculateTotal = (items, key) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (parseFloat(item[key]) || 0), 0);
};

export const getPercentage = (value, total) => {
    if (total === 0 || typeof value !== 'number' || typeof total !== 'number') return 0;
    return (value / total) * 100;
};

export const clamp = (value, min, max) => {
    if (typeof value !== 'number' || isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
};

export const randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomItem = (array) => {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
};

export const shuffleArray = (array) => {
    if (!Array.isArray(array)) return [];
    
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const createRange = (start, end, step = 1) => {
    if (typeof start !== 'number' || typeof end !== 'number' || typeof step !== 'number') return [];
    if (step <= 0) return [];
    
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
        tem = ua.match(/\b(OPR|Edge|Edg)\/(\d+)/);
        if (tem != null) return { 
            name: tem[1].replace('OPR', 'Opera').replace('Edg', 'Edge'), 
            version: tem[2] 
        };
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

export const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
};

export const copyToClipboard = async (text, showNotification = true) => {
    if (!text || typeof text !== 'string') {
        if (showNotification) showError('No hay texto para copiar');
        return false;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        if (showNotification) showSuccess('Texto copiado al portapapeles');
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
                if (showNotification) showSuccess('Texto copiado al portapapeles');
                return true;
            } else {
                if (showNotification) showError('Error al copiar el texto');
                return false;
            }
        } catch (fallbackError) {
            document.body.removeChild(textArea);
            if (showNotification) showError('Error al copiar el texto');
            return false;
        }
    }
};

export const downloadFile = (content, fileName, contentType = 'text/plain') => {
    if (!content || !fileName) {
        showError('Contenido o nombre de archivo no válido');
        return false;
    }
    
    try {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Limpiar después de un tiempo
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Error downloading file:', error);
        showError('Error al descargar el archivo');
        return false;
    }
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
        time: end - start,
        timestamp: new Date().toISOString()
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
    if (!element || !eventName) return null;
    
    const event = createEvent(eventName, detail);
    element.dispatchEvent(event);
    return event;
};

export const observeElement = (element, callback, options = {}) => {
    if (!element || typeof callback !== 'function') return null;
    
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
    if (!type || !selector || typeof callback !== 'function') return;
    
    document.addEventListener(type, (e) => {
        if (e.target.matches(selector)) {
            callback(e);
        }
    }, options);
};

export const getElementOffset = (element) => {
    if (!element || !(element instanceof Element)) {
        return { top: 0, left: 0, width: 0, height: 0 };
    }
    
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

export const isElementInViewport = (element, partial = false) => {
    if (!element || !(element instanceof Element)) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    if (partial) {
        // Elemento parcialmente visible
        return (
            rect.top <= windowHeight &&
            rect.left <= windowWidth &&
            rect.bottom >= 0 &&
            rect.right >= 0
        );
    } else {
        // Elemento completamente visible
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= windowHeight &&
            rect.right <= windowWidth
        );
    }
};

export const scrollToElement = (element, options = {}) => {
    if (!element || !(element instanceof Element)) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
        offset: 0
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    const { offset, ...scrollOptions } = finalOptions;
    
    if (offset) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: scrollOptions.behavior
        });
    } else {
        element.scrollIntoView(scrollOptions);
    }
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
    if (!tag || typeof tag !== 'string') return null;
    
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
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(element.dataset, value);
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
    if (!element || !(element instanceof Node)) return;
    
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

export const toggleClass = (element, className, force) => {
    if (!element || !className || typeof className !== 'string') return;
    
    if (force !== undefined) {
        element.classList.toggle(className, force);
    } else {
        element.classList.toggle(className);
    }
};

export const hasClass = (element, className) => {
    if (!element || !className || typeof className !== 'string') return false;
    return element.classList.contains(className);
};

export const addClass = (element, className) => {
    if (!element || !className || typeof className !== 'string') return;
    element.classList.add(className);
};

export const removeClass = (element, className) => {
    if (!element || !className || typeof className !== 'string') return;
    element.classList.remove(className);
};

export const setAttributes = (element, attributes) => {
    if (!element || typeof attributes !== 'object') return;
    
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
};

export const getComputedStyleValue = (element, property) => {
    if (!element || !property || typeof property !== 'string') return '';
    return window.getComputedStyle(element).getPropertyValue(property);
};

export const animateValue = (element, property, start, end, duration = 1000, easing = 'easeInOut', unit = '') => {
    if (!element || !property) return;
    
    const startTime = performance.now();
    const easingFunctions = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1
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
    if (!Array.isArray(imageUrls)) return Promise.resolve();
    
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
                    
                    // Cargar imagen
                    if (lazyImage.dataset.src) {
                        lazyImage.src = lazyImage.dataset.src;
                    }
                    
                    if (lazyImage.dataset.srcset) {
                        lazyImage.srcset = lazyImage.dataset.srcset;
                    }
                    
                    // Eliminar clase lazy y dejar de observar
                    lazyImage.classList.remove('lazy');
                    lazyImageObserver.unobserve(lazyImage);
                    
                    // Disparar evento personalizado
                    dispatchCustomEvent(lazyImage, 'lazyloaded');
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px' // Cargar 200px antes de que sea visible
        });
        
        lazyImages.forEach(lazyImage => {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback para navegadores que no soportan IntersectionObserver
        lazyImages.forEach(lazyImage => {
            if (lazyImage.dataset.src) {
                lazyImage.src = lazyImage.dataset.src;
            }
            lazyImage.classList.remove('lazy');
            dispatchCustomEvent(lazyImage, 'lazyloaded');
        });
    }
};

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return 'Tamaño inválido';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatNumber = (number, options = {}) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    
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
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    
    // Comparar arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => isEqual(item, b[index]));
    }
    
    // Comparar objetos
    if (typeof a === 'object' && a !== null && b !== null) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => isEqual(a[key], b[key]));
    }
    
    return false;
};

export const difference = (a, b) => {
    if (!Array.isArray(a)) return [];
    if (!Array.isArray(b)) return a;
    return a.filter(x => !b.includes(x));
};

export const intersection = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return [];
    return a.filter(x => b.includes(x));
};

export const union = (a, b) => {
    return [...new Set([...(a || []), ...(b || [])])];
};

export const chunkArray = (array, size) => {
    if (!Array.isArray(array) || typeof size !== 'number' || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

export const flattenArray = (array) => {
    if (!Array.isArray(array)) return [];
    
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
    if (!plans || !Array.isArray(plans)) return [];
    
    return plans.map(plan => ({
        ...plan,
        price_soles: plan.price_soles ? parseFloat(plan.price_soles) : 0,
        price_dollars: plan.price_dollars ? parseFloat(plan.price_dollars) : 0,
        formatted_soles: formatCurrency(plan.price_soles, 'PEN'),
        formatted_dollars: formatCurrency(plan.price_dollars, 'USD')
    }));
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
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
};

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

// Función para crear un efecto de "shake" en elementos
export const shakeElement = (element, duration = 600) => {
    if (!element) return;
    
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = `shake ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = 'none';
        }, duration);
    }, 10);
};

// Función para crear un efecto de fade in/out
export const fadeElement = (element, type = 'in', duration = 300) => {
    if (!element) return;
    
    if (type === 'in') {
        element.style.opacity = '0';
        element.style.display = 'block';
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '1';
        }, 10);
    } else {
        element.style.opacity = '1';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }
};

// Función para crear tooltips
export const createTooltip = (text, options = {}) => {
    const {
        position = 'top',
        className = 'custom-tooltip',
        delay = 100
    } = options;
    
    const tooltip = document.createElement('div');
    tooltip.className = `${className} tooltip-${position}`;
    tooltip.textContent = text;
    tooltip.style.opacity = '0';
    
    document.body.appendChild(tooltip);
    
    return {
        show: (element) => {
            if (!element) return;
            
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            let top, left;
            
            switch (position) {
                case 'top':
                    top = rect.top + scrollTop - tooltip.offsetHeight - 5;
                    left = rect.left + scrollLeft + (rect.width - tooltip.offsetWidth) / 2;
                    break;
                case 'bottom':
                    top = rect.top + scrollTop + rect.height + 5;
                    left = rect.left + scrollLeft + (rect.width - tooltip.offsetWidth) / 2;
                    break;
                case 'left':
                    top = rect.top + scrollTop + (rect.height - tooltip.offsetHeight) / 2;
                    left = rect.left + scrollLeft - tooltip.offsetWidth - 5;
                    break;
                case 'right':
                    top = rect.top + scrollTop + (rect.height - tooltip.offsetHeight) / 2;
                    left = rect.left + scrollLeft + rect.width + 5;
                    break;
                default:
                    top = rect.top + scrollTop - tooltip.offsetHeight - 5;
                    left = rect.left + scrollLeft + (rect.width - tooltip.offsetWidth) / 2;
            }
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.style.opacity = '1';
        },
        hide: () => {
            tooltip.style.opacity = '0';
        },
        destroy: () => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }
    };
};

// Función para crear un modal de confirmación
export const confirmDialog = (message, options = {}) => {
    return new Promise((resolve) => {
        const {
            title = 'Confirmar',
            confirmText = 'Aceptar',
            cancelText = 'Cancelar',
            className = 'custom-confirm-dialog'
        } = options;
        
        const overlay = document.createElement('div');
        overlay.className = `${className}-overlay`;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const dialog = document.createElement('div');
        dialog.className = className;
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #333;">${title}</h3>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">${message}</p>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">${cancelText}</button>
                <button class="confirm-btn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Animar entrada
        setTimeout(() => {
            overlay.style.opacity = '1';
            dialog.style.transform = 'scale(1)';
        }, 10);
        
        // Event listeners
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        
        const cleanUp = () => {
            overlay.style.opacity = '0';
            dialog.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        };
        
        confirmBtn.addEventListener('click', () => {
            cleanUp();
            resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanUp();
            resolve(false);
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanUp();
                resolve(false);
            }
        });
    });
};

// Exportar funciones de notificación para uso conveniente
export { showNotification, showError, showSuccess, showWarning, showInfo };

// Añadir estilos para las utilidades visuales
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .custom-tooltip {
            position: absolute;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 1000;
            max-width: 200px;
            word-wrap: break-word;
        }
        
        .custom-tooltip::after {
            content: '';
            position: absolute;
            border-width: 5px;
            border-style: solid;
        }
        
        .tooltip-top::after {
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-color: #333 transparent transparent transparent;
        }
        
        .tooltip-bottom::after {
            bottom: 100%;
            left: 50%;
            margin-left: -5px;
            border-color: transparent transparent #333 transparent;
        }
        
        .tooltip-left::after {
            top: 50%;
            left: 100%;
            margin-top: -5px;
            border-color: transparent transparent transparent #333;
        }
        
        .tooltip-right::after {
            top: 50%;
            right: 100%;
            margin-top: -5px;
            border-color: transparent #333 transparent transparent;
        }
    `;
    document.head.appendChild(style);
}

if (typeof window !== 'undefined') {
    window.showNotification = showNotification;
    window.showError = showError;
    window.showSuccess = showSuccess;
    window.showWarning = showWarning;
    window.showInfo = showInfo;
}
