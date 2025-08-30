// Sistema de notificaciones
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notifications');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    show(options) {
        const {
            title = 'Notificación',
            message = '',
            type = 'info',
            duration = 5000,
            dismissible = true
        } = options;

        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            ${dismissible ? '<button class="notification-close">&times;</button>' : ''}
            <div class="notification-progress"></div>
        `;

        // Agregar al contenedor
        this.container.appendChild(notification);

        // Configurar cierre automático
        let timeoutId;
        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            progressBar.style.animation = `progressBar ${duration}ms linear forwards`;
            
            timeoutId = setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        // Configurar botón de cierre
        if (dismissible) {
            const closeButton = notification.querySelector('.notification-close');
            closeButton.addEventListener('click', () => {
                if (timeoutId) clearTimeout(timeoutId);
                this.remove(notification);
            });
        }

        // Retornar métodos para control manual
        return {
            remove: () => this.remove(notification),
            update: (newOptions) => this.update(notification, newOptions)
        };
    }

    remove(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }

    update(notification, options) {
        if (options.title !== undefined) {
            const titleEl = notification.querySelector('.notification-title');
            if (titleEl) titleEl.textContent = options.title;
        }
        
        if (options.message !== undefined) {
            const messageEl = notification.querySelector('.notification-message');
            if (messageEl) messageEl.textContent = options.message;
        }
        
        if (options.type !== undefined) {
            notification.className = `notification ${options.type}`;
        }
    }

    // Métodos de conveniencia
    success(message, title = 'Éxito', options = {}) {
        return this.show({ title, message, type: 'success', ...options });
    }

    error(message, title = 'Error', options = {}) {
        return this.show({ title, message, type: 'error', ...options });
    }

    warning(message, title = 'Advertencia', options = {}) {
        return this.show({ title, message, type: 'warning', ...options });
    }

    info(message, title = 'Información', options = {}) {
        return this.show({ title, message, type: 'info', ...options });
    }
}

// Crear instancia global
const notifications = new NotificationSystem();

// Exportar para uso en otros módulos
export default notifications;
