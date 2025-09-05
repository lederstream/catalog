// scripts/notifications.js
// Sistema de notificaciones para la aplicación
export const showNotification = (message, type = 'info', duration = 5000) => {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
        document.body.appendChild(container);
    }

    // Crear elemento de notificación
    const notification = document.createElement('div');
    
    // Estilos base
    notification.className = `p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out opacity-0 translate-x-full`;
    
    // Estilos según el tipo
    const typeStyles = {
        success: 'bg-green-100 border-l-4 border-green-500 text-green-700',
        error: 'bg-red-100 border-l-4 border-red-500 text-red-700',
        warning: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
        info: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
    };
    
    notification.className += ` ${typeStyles[type] || typeStyles.info}`;
    
    // Contenido
    notification.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${getNotificationIcon(type)}
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <button type="button" class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 notification-close">
                <span class="sr-only">Cerrar</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;

    // Agregar al contenedor
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
};

const getNotificationIcon = (type) => {
    const icons = {
        success: `<svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`,
        error: `<svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`,
        warning: `<svg class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>`,
        info: `<svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`
    };
    
    return icons[type] || icons.info;
};

// Notificación de éxito
export const showSuccess = (message, duration = 5000) => {
    return showNotification(message, 'success', duration);
};

// Notificación de error
export const showError = (message, duration = 5000) => {
    return showNotification(message, 'error', duration);
};

// Notificación de advertencia
export const showWarning = (message, duration = 5000) => {
    return showNotification(message, 'warning', duration);
};

// Notificación informativa
export const showInfo = (message, duration = 5000) => {
    return showNotification(message, 'info', duration);
};

// Limpiar todas las notificaciones
export const clearAllNotifications = () => {
    const container = document.getElementById('notifications-container');
    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
};
