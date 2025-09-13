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

    static showNotification(message, type = 'info') {
        const types = {
            info: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'ℹ️' },
            success: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
            warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
            error: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
        };

        const { bg, text, icon } = types[type] || types.info;
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${bg} ${text} px-6 py-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        });
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        return notification;
    }

    static showError(message) {
        return this.showNotification(message, 'error');
    }

    static showSuccess(message) {
        return this.showNotification(message, 'success');
    }

    static showInfo(message) {
        return this.showNotification(message, 'info');
    }

    static showWarning(message) {
        return this.showNotification(message, 'warning');
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
        urls.forEach(url => {
            if (!url || url === CONFIG.IMAGE_PLACEHOLDER) return;
            
            const img = new Image();
            img.src = url;
        });
    }

    static generateSlug(text) {
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
}

// Configuración global
const CONFIG = {
    IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'
};

// Hacer disponible globalmente
window.Utils = Utils;
window.CONFIG = CONFIG;

export { Utils, CONFIG };
