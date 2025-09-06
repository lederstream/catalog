// scripts/utils.js
// Sistema de utilidades - Versión optimizada y corregida
class Utils {
    static debugMode = localStorage.getItem('debug') === 'true';
    static notificationCounter = 0;
    static maxNotifications = 3;
    
    // ===== NOTIFICACIONES =====
    static showNotification(message, type = 'info', duration = 5000) {
        // Limitar número de notificaciones simultáneas
        if (this.notificationCounter >= this.maxNotifications) {
            return { close: () => {}, element: null };
        }
        
        this.notificationCounter++;
        
        // Crear contenedor si no existe
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
            document.body.appendChild(container);
        }

        const notificationId = `notification-${Date.now()}`;
        const notification = document.createElement('div');
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: 'bg-green-100 border-l-4 border-green-500 text-green-700',
            error: 'bg-red-100 border-l-4 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        };
        
        notification.id = notificationId;
        notification.className = `p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out opacity-0 translate-x-full ${colors[type]}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2 text-lg">${icons[type]}</span>
                <span class="flex-1 text-sm font-medium">${message}</span>
                <button class="ml-3 text-gray-400 hover:text-gray-600 transition-colors notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);

        // Animación de entrada
        requestAnimationFrame(() => {
            notification.classList.remove('opacity-0', 'translate-x-full');
            notification.classList.add('opacity-100', 'translate-x-0');
        });

        // Función para cerrar
        const closeNotification = () => {
            notification.classList.remove('opacity-100', 'translate-x-0');
            notification.classList.add('opacity-0', 'translate-x-full');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    this.notificationCounter--;
                }
            }, 300);
        };

        // Evento para el botón de cerrar
        notification.querySelector('.notification-close').addEventListener('click', closeNotification);

        // Cierre automático
        if (duration > 0) {
            setTimeout(closeNotification, duration);
        }

        return {
            close: closeNotification,
            element: notification
        };
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
    
    // ===== VALIDACIONES =====
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
    
    // ===== ANIMACIONES =====
    static async fadeIn(element, duration = 300, display = 'block') {
        if (!element) return;
        
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = display;
            element.style.transition = `opacity ${duration}ms ease-out`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                setTimeout(resolve, duration);
            });
        });
    }
    
    static async fadeOut(element, duration = 300) {
        if (!element) return;
        
        return new Promise(resolve => {
            element.style.opacity = '1';
            element.style.transition = `opacity ${duration}ms ease-out`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.display = 'none';
                    resolve();
                }, duration);
            });
        });
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
    
    // Limpiar todas las notificaciones
    static clearAllNotifications() {
        const container = document.getElementById('notifications-container');
        if (container) {
            container.innerHTML = '';
            this.notificationCounter = 0;
        }
    }
}

// Exportar la clase completa
export { Utils };

// Hacer disponible globalmente
window.Utils = Utils;

// Inicialización automática
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ Utils inicializado');
    });
}
