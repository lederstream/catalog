// scripts/core/utils.js
class Utils {
  static enableDebugMode(enable = true) {
    window.DEBUG_MODE = enable;
    console.log(`🔧 Debug mode ${enable ? 'enabled' : 'disabled'}`);
  }

  static log(...args) {
    if (window.DEBUG_MODE) console.log('🔍', ...args);
  }

  static error(...args) {
    console.error('❌', ...args);
  }

  static warn(...args) {
    console.warn('⚠️', ...args);
  }

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

  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static formatCurrency(amount, currency = 'PEN') {
    if (amount === null || amount === undefined) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  static formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static showNotification(message, type = 'info', duration = 3000) {
    const existingNotifications = document.querySelectorAll('.global-notification');
    existingNotifications.forEach(notification => notification.remove());

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const colors = { 
      success: 'bg-green-100 border-green-400 text-green-800',
      error: 'bg-red-100 border-red-400 text-red-800', 
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      info: 'bg-blue-100 border-blue-400 text-blue-800'
    };

    const notification = document.createElement('div');
    notification.className = `global-notification fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full ${colors[type]} border`;
    
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icons[type]} mr-3"></i>
        <span>${this.escapeHtml(message)}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    });
    
    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
    
    return notification;
  }

  static showSuccess(message, duration = 3000) {
    return this.showNotification(message, 'success', duration);
  }

  static showError(message, duration = 5000) {
    return this.showNotification(message, 'error', duration);
  }

  static showWarning(message, duration = 4000) {
    return this.showNotification(message, 'warning', duration);
  }

  static showInfo(message, duration = 3000) {
    return this.showNotification(message, 'info', duration);
  }

  static async fadeOut(element, duration = 300) {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-out`;
      element.style.opacity = '0';
      setTimeout(() => resolve(), duration);
    });
  }

  static async fadeIn(element, duration = 300) {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-in`;
      element.style.opacity = '1';
      setTimeout(() => resolve(), duration);
    });
  }

  static generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
  }

  static async copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(resolve).catch(reject);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          resolve();
        } catch (error) {
          reject(error);
        }
        
        document.body.removeChild(textArea);
      }
    });
  }

  static getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static preloadImages(urls) {
    urls.forEach(url => {
      if (url && url.startsWith('http')) {
        const img = new Image();
        img.src = url;
      }
    });
  }
}

// Exportar solo Utils - ELIMINADO CONFIG
export { Utils };

// Global único
if (typeof window.Utils === 'undefined') {
  window.Utils = Utils;
}
