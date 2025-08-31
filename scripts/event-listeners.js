// scripts/event-listeners.js
import { showNotification } from './utils.js';

export function setupGlobalEventListeners() {
    // Event delegation para todos los botones de la aplicación
    document.addEventListener('click', function(e) {
        // Logout buttons
        if (e.target.closest('#logoutBtn') || 
            e.target.closest('#mobileLogoutBtn') || 
            e.target.closest('.mobile-logout-btn')) {
            e.preventDefault();
            if (typeof window.logout === 'function') {
                window.logout();
            }
        }
        
        // Delete product buttons
        if (e.target.closest('.delete-product')) {
            e.preventDefault();
            const id = e.target.closest('.delete-product').dataset.id;
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                if (window.deleteProduct) {
                    window.deleteProduct(id);
                }
            }
        }
        
        // Edit product buttons
        if (e.target.closest('.edit-product')) {
            e.preventDefault();
            const id = e.target.closest('.edit-product').dataset.id;
            if (window.editProduct) {
                window.editProduct(id);
            }
        }
        
        // View details buttons
        if (e.target.closest('.view-details-btn')) {
            e.preventDefault();
            const id = e.target.closest('.view-details-btn').dataset.id;
            if (window.showProductDetails) {
                window.showProductDetails(id);
            }
        }
        
        // Toggle mobile menu
        if (e.target.closest('#mobileMenuBtn')) {
            e.preventDefault();
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        }
    });

    // Manejar envío de formularios
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        // Formulario de contacto
        if (form.id === 'contactForm') {
            e.preventDefault();
            handleContactForm(form);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+K para buscar
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape para cerrar modales
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        }
    });
}

// Manejar formulario de contacto
function handleContactForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validación básica
    if (!data.contactName || !data.contactEmail || !data.contactMessage) {
        showNotification('Por favor completa todos los campos obligatorios', 'error');
        return;
    }
    
    // Simular envío (en una app real, aquí harías una petición a tu backend)
    showNotification('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
    form.reset();
}

// Hacer disponible globalmente
window.setupGlobalEventListeners = setupGlobalEventListeners;

// Inicializar event listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalEventListeners);
} else {
    setupGlobalEventListeners();
}
