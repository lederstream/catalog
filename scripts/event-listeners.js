// scripts/event-listeners.js
import { showNotification } from './utils.js';

// Configurar todos los event listeners globales
export function setupAllEventListeners() {
    console.log('🔧 Configurando todos los event listeners...');
    
    // Event delegation para toda la aplicación
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Botones de productos en admin
        if (target.classList.contains('delete-product') || target.closest('.delete-product')) {
            e.preventDefault();
            const button = target.classList.contains('delete-product') ? target : target.closest('.delete-product');
            const id = button.dataset.id;
            if (id && confirm('¿Estás seguro de eliminar este producto?')) {
                if (typeof window.deleteProduct === 'function') {
                    window.deleteProduct(id);
                }
            }
        }
        
        if (target.classList.contains('edit-product') || target.closest('.edit-product')) {
            e.preventDefault();
            const button = target.classList.contains('edit-product') ? target : target.closest('.edit-product');
            const id = button.dataset.id;
            if (id && typeof window.editProduct === 'function') {
                window.editProduct(id);
            }
        }
        
        // Botones de ver detalles
        if (target.classList.contains('view-details-btn') || target.closest('.view-details-btn')) {
            e.preventDefault();
            const button = target.classList.contains('view-details-btn') ? target : target.closest('.view-details-btn');
            const id = button.dataset.productId;
            if (id && typeof window.showProductDetails === 'function') {
                window.showProductDetails(id);
            }
        }
        
        // Menú móvil
        if (target.id === 'mobileMenuBtn' || target.closest('#mobileMenuBtn')) {
            e.preventDefault();
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        }
    });
    
    // Formulario de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
            this.reset();
        });
    }
    
    console.log('✅ Todos los event listeners configurados');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAllEventListeners);
} else {
    setupAllEventListeners();
}

// Hacer disponible globalmente
window.setupAllEventListeners = setupAllEventListeners;
