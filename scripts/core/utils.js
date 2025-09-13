// scripts/core/utils.js
class Utils {
    static debounce(func, wait, immediate = false) {
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
    }

    static async fadeIn(element, duration = 300) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            let start = null;
            const animate = timestamp => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.min(progress / duration, 1);
                
                element.style.opacity = opacity.toString();
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    static async fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            let start = null;
            const animate = timestamp => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.max(1 - progress / duration, 0);
                
                element.style.opacity = opacity.toString();
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    static showNotification(message, type = 'info', duration = 5000) {
        // Eliminar notificaciones existentes para evitar duplicados
        const existingNotifications = document.querySelectorAll('.custom-notification');
        if (existingNotifications.length > 3) {
            existingNotifications[0].remove();
        }
        
        const types = {
            info: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: 'ℹ️' },
            success: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '✅' },
            warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '⚠️' },
            error: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '❌' }
        };

        const { bg, text, border, icon } = types[type] || types.info;
        
        const notification = document.createElement('div');
        notification.className = `custom-notification fixed top-4 right-4 ${bg} ${text} border ${border} px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full opacity-0 max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-start">
                <span class="mr-2 mt-0.5 flex-shrink-0">${icon}</span>
                <span class="flex-grow">${message}</span>
                <button class="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0" aria-label="Cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
            notification.classList.add('translate-x-0', 'opacity-100');
        });
        
        // Cerrar al hacer clic en el botón
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            notification.classList.remove('translate-x-0', 'opacity-100');
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Auto-eliminar después del tiempo especificado
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('translate-x-0', 'opacity-100');
                notification.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
        
        return notification;
    }

    static showError(message, duration = 5000) {
        return this.showNotification(message, 'error', duration);
    }

    static showSuccess(message, duration = 3000) {
        return this.showNotification(message, 'success', duration);
    }

    static showInfo(message, duration = 4000) {
        return this.showNotification(message, 'info', duration);
    }

    static showWarning(message, duration = 5000) {
        return this.showNotification(message, 'warning', duration);
    }

    static formatCurrency(amount, currency = 'PEN') {
        const formatter = new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2
        });
        
        return formatter.format(amount);
    }

    static safeParseJSON(str, fallback = []) {
        try {
            return typeof str === 'string' ? JSON.parse(str) : (str || fallback);
        } catch (error) {
            console.warn('Error parsing JSON:', error);
            return fallback;
        }
    }

    static preloadImages(urls) {
        if (!urls || !Array.isArray(urls)) return;
        
        urls.forEach(url => {
            if (!url || url === CONFIG.IMAGE_PLACEHOLDER) return;
            
            const img = new Image();
            img.src = url;
        });
    }

    static generateSlug(text) {
        if (!text) return '';
        
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
    }
    
    static validateEmail(email) {
        if (!email) return false;
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.trim());
    }
    
    static formatDate(date, options = {}) {
        if (!date) return '';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        return new Date(date).toLocaleDateString('es-ES', mergedOptions);
    }
    
    static capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    static truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// Configuración global
const CONFIG = {
    IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Imagen+no+disponible',
    SUPABASE_URL: 'https://fwmpcglrwgfougbgxvnt.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc'
};

// Hacer disponible globalmente
window.Utils = Utils;
window.CONFIG = CONFIG;

export { Utils, CONFIG };
