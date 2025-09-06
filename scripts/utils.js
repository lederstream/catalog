// scripts/utils.js
// Sistema de utilidades con estructura POO mejorada
class Utils {
    static debugMode = localStorage.getItem('debug') === 'true';
    static performanceMetrics = new Map();
    static notificationContainer = null;
    
    // ===== INICIALIZACIÓN =====
    static init() {
        if (localStorage.getItem('debug') === 'true') {
            this.enableDebugMode(true);
        }
        this.createNotificationContainer();
        console.log('✅ Utilidades inicializadas');
    }
    
    static createNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notifications-container';
        this.notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
        document.body.appendChild(this.notificationContainer);
    }
    
    // ===== NOTIFICACIONES MEJORADAS =====
    static showNotification(message, type = 'info', duration = 5000) {
        if (!this.notificationContainer) this.createNotificationContainer();
        
        const notification = document.createElement('div');
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700'
        };
        
        notification.className = `p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out opacity-0 translate-x-full ${colors[type]}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2 text-lg">${icons[type]}</span>
                <span class="flex-1 text-sm font-medium">${message}</span>
                <button class="ml-3 text-gray-400 hover:text-gray-600 transition-colors" onclick="Utils.closeNotification(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            notification.classList.remove('opacity-0', 'translate-x-full');
            notification.classList.add('opacity-100', 'translate-x-0');
        });
        
        // Auto-cierre
        if (duration > 0) {
            setTimeout(() => this.closeNotification(notification.querySelector('button')), duration);
        }
        
        return {
            close: () => this.closeNotification(notification.querySelector('button')),
            element: notification
        };
    }
    
    static closeNotification(button) {
        const notification = button.closest('.p-4');
        if (notification) {
            notification.classList.remove('opacity-100', 'translate-x-0');
            notification.classList.add('opacity-0', 'translate-x-full');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    static showSuccess(message, duration = 5000) {
        return this.showNotification(message, 'success', duration);
    }
    
    static showError(message, duration = 5000) {
        return this.showNotification(message, 'error', duration);
    }
    
    static showWarning(message, duration = 5000) {
        return this.showNotification(message, 'warning', duration);
    }
    
    static showInfo(message, duration = 5000) {
        return this.showNotification(message, 'info', duration);
    }
    
    static clearAllNotifications() {
        if (this.notificationContainer) {
            this.notificationContainer.innerHTML = '';
        }
    }
    
    // ===== VALIDACIONES MEJORADAS =====
    static validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.trim());
    }
    
    static validateUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    static validateRequired(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'number') return !isNaN(value);
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    }
    
    static validateNumber(value, min = 0, max = Infinity) {
        if (value === null || value === undefined || value === '') return false;
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num) && num >= min && num <= max;
    }
    
    static validateProductForm(formData) {
        const errors = [];
        
        if (!this.validateRequired(formData.name)) {
            errors.push('El nombre del producto es requerido');
        }
        
        if (!this.validateRequired(formData.category_id)) {
            errors.push('La categoría es requerida');
        }
        
        if (!this.validateRequired(formData.description)) {
            errors.push('La descripción es requerida');
        }
        
        if (!this.validateUrl(formData.photo_url)) {
            errors.push('La URL de la imagen no es válida');
        }
        
        if (!formData.plans || formData.plans.length === 0) {
            errors.push('Debe agregar al menos un plan');
        } else {
            formData.plans.forEach((plan, index) => {
                if (!this.validateRequired(plan.name)) {
                    errors.push(`El nombre del plan ${index + 1} es requerido`);
                }
                
                const hasSoles = this.validateNumber(plan.price_soles) && parseFloat(plan.price_soles) >= 0;
                const hasDollars = this.validateNumber(plan.price_dollars) && parseFloat(plan.price_dollars) >= 0;
                
                if (!hasSoles && !hasDollars) {
                    errors.push(`El plan ${index + 1} debe tener al menos un precio válido (soles o dólares)`);
                }
            });
        }
        
        return errors;
    }
    
    // ===== ANIMACIONES MEJORADAS =====
    static async fadeIn(element, duration = 300, display = 'block') {
        if (!element) return;
        
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = display;
            element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                setTimeout(resolve, duration);
            });
        });
    }
    
    static async fadeOut(element, duration = 300) {
        if (!element) return;
        
        return new Promise(resolve => {
            element.style.opacity = '1';
            element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.transform = '';
                    resolve();
                }, duration);
            });
        });
    }
    
    static async slideDown(element, duration = 300) {
        if (!element) return;
        
        return new Promise(resolve => {
            element.style.display = 'block';
            const height = element.scrollHeight;
            
            element.style.overflow = 'hidden';
            element.style.height = '0px';
            element.style.transition = `height ${duration}ms ease-out`;
            
            requestAnimationFrame(() => {
                element.style.height = `${height}px`;
                setTimeout(() => {
                    element.style.overflow = '';
                    element.style.height = '';
                    element.style.transition = '';
                    resolve();
                }, duration);
            });
        });
    }
    
    static async slideUp(element, duration = 300) {
        if (!element) return;
        
        return new Promise(resolve => {
            const height = element.scrollHeight;
            
            element.style.overflow = 'hidden';
            element.style.height = `${height}px`;
            element.style.transition = `height ${duration}ms ease-out`;
            
            requestAnimationFrame(() => {
                element.style.height = '0px';
                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.overflow = '';
                    element.style.height = '';
                    element.style.transition = '';
                    resolve();
                }, duration);
            });
        });
    }
    
    static async smoothScrollTo(target, offset = 0, duration = 800) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;
        
        return new Promise(resolve => {
            const startPosition = window.pageYOffset;
            const targetPosition = element.getBoundingClientRect().top + startPosition - offset;
            const distance = targetPosition - startPosition;
            let startTime = null;
            
            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                const ease = Utils.easeInOutQuad(progress);
                const run = distance * ease + startPosition;
                
                window.scrollTo(0, run);
                
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                } else {
                    resolve();
                }
            }
            
            requestAnimationFrame(animation);
        });
    }
    
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // ===== MANEJO DE DATOS =====
    static debounce(func, wait, immediate = false) {
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
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static safeJSONParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            if (this.debugMode) console.error('Error parsing JSON:', error);
            return defaultValue;
        }
    }
    
    static safeJSONStringify(data, defaultValue = '{}') {
        try {
            return JSON.stringify(data);
        } catch (error) {
            if (this.debugMode) console.error('Error stringifying JSON:', error);
            return defaultValue;
        }
    }
    
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    // ===== FORMATEO =====
    static formatCurrency(amount, currency = 'PEN', locale = 'es-PE') {
        if (amount === null || amount === undefined || isNaN(amount)) amount = 0;
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    static truncateText(text, maxLength = 100, suffix = '...') {
        if (!text || typeof text !== 'string') return '';
        return text.length <= maxLength ? text : text.substr(0, maxLength) + suffix;
    }
    
    static formatDate(date, options = {}) {
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
    }
    
    // ===== DEBUGGING Y PERFORMANCE =====
    static enableDebugMode(enable = true) {
        this.debugMode = enable;
        localStorage.setItem('debug', enable.toString());
        console.log(`🔧 Debug mode ${enable ? 'enabled' : 'disabled'}`);
    }
    
    static measurePerformance(name, fn) {
        if (!this.debugMode) return fn();
        
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.performanceMetrics.set(name, end - start);
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        
        return result;
    }
    
    static debugLog(message, data = null) {
        if (this.debugMode) {
            console.log(`🔍 ${message}`, data || '');
        }
    }
    
    static errorHandler(error, context = '') {
        console.error(`❌ Error en ${context}:`, error);
        this.showError(`Error en ${context}: ${error.message}`);
        return null;
    }
}

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Utils.init());
} else {
    setTimeout(() => Utils.init(), 0);
}

// Exportaciones para compatibilidad con módulos
export const {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    debounce,
    throttle,
    fadeIn,
    fadeOut,
    smoothScrollTo,
    validateEmail,
    validateUrl,
    validateRequired,
    validateNumber,
    formatCurrency,
    truncateText,
    formatDate
} = Utils;

// Hacer disponible globalmente
window.Utils = Utils;
