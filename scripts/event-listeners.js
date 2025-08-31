// Configurar todos los event listeners globales
export function setupGlobalEventListeners() {
    // Otros listeners globales
    document.addEventListener('click', function(e) {
        // Logout buttons
        if (e.target.closest('#logoutBtn') || 
            e.target.closest('#mobileLogoutBtn') || 
            e.target.closest('.mobile-logout-btn')) {
            if (typeof window.logout === 'function') {
                window.logout();
            }
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
        
        // View details buttons
        if (e.target.closest('.view-details-btn')) {
            const id = e.target.closest('.view-details-btn').dataset.id;
            if (window.showProductDetails) {
                window.showProductDetails(id);
            }
        }
    });
}

// Hacer disponible globalmente
window.setupGlobalEventListeners = setupGlobalEventListeners;
