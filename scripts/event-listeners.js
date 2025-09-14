// scripts/event-listeners.js
import { Utils } from './core/utils.js';
import { AuthManagerFunctions } from './core/auth.js';

export function setupAllEventListeners(adminPage) {
    // Event listener para búsqueda en tiempo real
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
            adminPage.handleSearch(e);
        }, 300));
    }
    
    // Event listener para cambio de categoría
    const categoryFilter = document.getElementById('filterCategory');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            adminPage.handleFilterChange(e);
        });
    }
    
    // Event listener para cambio de ordenamiento
    const sortSelect = document.getElementById('sortProducts');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            adminPage.handleSortChange(e);
        });
    }
    
    // Event listener para cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            adminPage.handleLogout();
        });
    }
    
    // Escuchar cambios de autenticación
    AuthManagerFunctions.addAuthStateListener((event, user) => {
        adminPage.handleAuthenticationChange(event, user);
    });
    
    console.log('✅ Todos los event listeners configurados correctamente');
}
