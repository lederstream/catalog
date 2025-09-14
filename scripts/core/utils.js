// scripts/core/utils.js
class Utils {
  static validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static safeParseJSON(str, defaultValue = []) {
    if (!str || typeof str !== 'string') return defaultValue
    
    try {
      const parsed = JSON.parse(str)
      return parsed || defaultValue
    } catch (error) {
      console.warn('Error parsing JSON:', error, 'String:', str)
      return defaultValue
    }
  }

  static enableDebugMode(enable = true) {
    window.DEBUG_MODE = enable
    console.log(`🔧 Debug mode ${enable ? 'enabled' : 'disabled'}`)
  }

  static log(...args) {
    if (window.DEBUG_MODE) console.log('🔍', ...args)
  }

  static error(...args) {
    console.error('❌', ...args)
  }

  static warn(...args) {
    console.warn('⚠️', ...args)
  }

  static debounce(func, wait, immediate = false) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        timeout = null
        if (!immediate) func.apply(this, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this, args)
    }
  }

  static throttle(func, limit) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  static formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible'
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Fecha inválida'
    }
  }

  static escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  static showNotification(message, type = 'info', duration = 3000) {
    // Eliminar notificaciones existentes
    document.querySelectorAll('.global-notification').forEach(n => n.remove())

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle', 
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    }

    const colors = { 
      success: 'bg-green-100 border-green-400 text-green-800',
      error: 'bg-red-100 border-red-400 text-red-800', 
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      info: 'bg-blue-100 border-blue-400 text-blue-800'
    }

    const notification = document.createElement('div')
    notification.className = `global-notification fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full ${colors[type]} border`
    
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icons[type]} mr-3"></i>
        <span>${this.escapeHtml(message)}</span>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animación de entrada
    requestAnimationFrame(() => {
      notification.classList.remove('translate-x-full')
      notification.classList.add('translate-x-0')
    })
    
    // Auto-eliminación
    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('translate-x-0')
        notification.classList.add('translate-x-full')
        setTimeout(() => notification.remove(), 300)
      }, duration)
    }
    
    return notification
  }

  static showSuccess(message, duration = 3000) {
    return this.showNotification(message, 'success', duration)
  }

  static showError(message, duration = 5000) {
    return this.showNotification(message, 'error', duration)
  }

  static showWarning(message, duration = 4000) {
    return this.showNotification(message, 'warning', duration)
  }

  static showInfo(message, duration = 3000) {
    return this.showNotification(message, 'info', duration)
  }

  static async fadeOut(element, duration = 300) {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-out`
      element.style.opacity = '0'
      setTimeout(() => resolve(), duration)
    })
  }

  static async fadeIn(element, duration = 300) {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-in`
      element.style.opacity = '1'
      setTimeout(() => resolve(), duration)
    })
  }

  static generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      this.showSuccess('Copiado al portapapeles')
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  }

  static getSafeImageUrl(url, fallback = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible') {
    if (!url || !this.isValidUrl(url)) return fallback
    
    try {
      // Corregir URLs de placeholder sin protocolo
      if (url.includes('via.placeholder.com') && !url.startsWith('http')) {
        return 'https://' + url
      }
      return url
    } catch {
      return fallback
    }
  }

  static formatCurrency(amount, currency = 'PEN') {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Precio no disponible'
    }
    
    try {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      return `S/ ${amount.toFixed(2)}`
    }
  }

  static preloadImages(urls) {
    urls.forEach(url => {
      if (url && this.isValidUrl(url)) {
        const img = new Image()
        img.src = url
      }
    })
  }

  static createLoadingSpinner(size = 'medium') {
    const sizes = {
      small: 'w-4 h-4',
      medium: 'w-8 h-8',
      large: 'w-12 h-12'
    }
    
    const spinner = document.createElement('div')
    spinner.className = `loading-spinner inline-block ${sizes[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`
    return spinner
  }

  static showConfirm(title, message, type = 'warning') {
    return new Promise((resolve) => {
      // Crear modal de confirmación
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-95 opacity-0">
          <div class="text-center mb-4">
            <div class="w-12 h-12 rounded-full ${type === 'warning' ? 'bg-yellow-100 text-yellow-600' : type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center mx-auto mb-3">
              <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : type === 'danger' ? 'fa-times-circle' : 'fa-question-circle'}"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
            <p class="text-gray-600 mt-2">${message}</p>
          </div>
          <div class="flex gap-3 justify-center">
            <button class="cancel-btn px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button class="confirm-btn px-4 py-2 rounded-lg text-white ${type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} transition-colors">
              Confirmar
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // Animación de entrada
      requestAnimationFrame(() => {
        modal.querySelector('div').classList.remove('scale-95', 'opacity-0')
        modal.querySelector('div').classList.add('scale-100', 'opacity-100')
      })

      // Event listeners
      const confirmBtn = modal.querySelector('.confirm-btn')
      const cancelBtn = modal.querySelector('.cancel-btn')

      const cleanup = () => {
        modal.querySelector('div').classList.remove('scale-100', 'opacity-100')
        modal.querySelector('div').classList.add('scale-95', 'opacity-0')
        setTimeout(() => modal.remove(), 300)
      }

      confirmBtn.addEventListener('click', () => {
        cleanup()
        resolve(true)
      })

      cancelBtn.addEventListener('click', () => {
        cleanup()
        resolve(false)
      })

      // Cerrar al hacer clic fuera
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          cleanup()
          resolve(false)
        }
      })
    })
  }
}

// Global único
window.Utils = Utils

export { Utils }
