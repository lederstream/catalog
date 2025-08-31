import { logout } from './auth.js';
import { editProduct } from './components/admin-panel.js';

// Configurar todos los event listeners globales
export function setupGlobalEventListeners() {
    // Logout
    window.logout = logout;
    
    // Editar producto
    window.editProduct = editProduct;
    
    // Otros listeners globales
    document.addEventListener('click', function(e) {
        // Logout buttons
        if (e.target.closest('#logoutBtn') || 
            e.target.closest('#mobileLogoutBtn') || 
            e.target.closest('.mobile-logout-btn')) {
            logout();
        }
        
        // Delete product buttons
        if (e.target.closest('.delete-product')) {
            const id = e.target.closest('.delete-product').dataset.id;
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                if (window.deleteProduct) {
                    window.deleteProduct(id);
                }
            }
        }
        
        // Edit product buttons
        if (e.target.closest('.edit-product')) {
            const id = e.target.closest('.edit-product').dataset.id;
            if (window.editProduct) {
                window.editProduct(id);
            }
        }
    });
}

// Hacer disponible globalmente
window.setupGlobalEventListeners = setupGlobalEventListeners;
