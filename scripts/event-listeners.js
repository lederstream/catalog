// scripts/event-listeners.js
import { Utils } from './core/utils.js';
import { authManager } from './core/auth.js';

export function setupAllEventListeners(adminPage) {
    if (!adminPage) {
        console.error('AdminPage no proporcionada para event listeners');
        return;
    }

    // Event listener para búsqueda
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
            adminPage.currentFilters.search = e.target.value;
            adminPage.applyFilters();
        }, 300));
    }
    
    // Event listener para filtro de categoría
    const categoryFilter = document.getElementById('filterCategory');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            adminPage.currentFilters.category = e.target.value;
            adminPage.applyFilters();
        });
    }
    
    // Event listener para ordenamiento
    const sortSelect = document.getElementById('sortProducts');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            adminPage.currentFilters.sort = e.target.value;
            adminPage.applyFilters();
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
    authManager.addAuthStateListener((event, user) => {
        if (adminPage.handleAuthenticationChange) {
            adminPage.handleAuthenticationChange(event, user);
        }
    });
    
    console.log('✅ Todos los event listeners configurados correctamente');
}
