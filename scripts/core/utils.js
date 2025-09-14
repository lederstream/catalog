// scripts/core/utils.js
export class Utils {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static formatCurrency(amount) {
    if (amount === Infinity || amount === null || isNaN(amount)) return 'Consultar precio';
    return `S/ ${amount.toFixed(2)}`;
  }

  static showNotification(message, type = 'info', duration = 3000) {
    // Eliminar notificaciones existentes
    document.querySelectorAll('.global-notification').forEach(el => el.remove());
    
    const colors = {
      success: 'bg-green-100 border-green-400 text-green-800',
      error: 'bg-red-100 border-red-400 text-red-800',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      info: 'bg-blue-100 border-blue-400 text-blue-800'
    };
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `global-notification fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${colors[type]} border`;
    notification.innerHTML = `<div class="flex items-center"><i class="fas ${icons[type]} mr-3"></i><span>${this.escapeHtml(message)}</span></div>`;
    
    document.body.appendChild(notification);
    
    if (duration > 0) {
      setTimeout(() => notification.remove(), duration);
    }
    
    return notification;
  }

  static safeParseJSON(str, defaultValue = []) {
    if (!str || typeof str !== 'string') return defaultValue;
    try {
      return JSON.parse(str);
    } catch (error) {
      console.warn('Error parsing JSON:', error);
      return defaultValue;
    }
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
