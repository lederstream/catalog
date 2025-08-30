import { supabase } from './supabase.js';
import { renderHeader } from './components/header.js';
import { renderProductsGrid } from './components/product-card.js';
import { renderAdminPanel } from './components/admin-panel.js';
import { checkAuth, handleLogin, handleRegister, handleLogout } from './auth.js';
import { loadProducts } from './products.js';
import { loadCategories } from './categories.js';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Renderizar componentes estáticos
        renderHeader();
        renderAdminPanel();
        
        // Verificar autenticación
        await checkAuth();
        
        // Cargar datos iniciales
        await loadProducts();
        await loadCategories();
        
        // Configurar event listeners globales
        setupGlobalEventListeners();
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al cargar la aplicación', 'error');
    }
});

const setupGlobalEventListeners = () => {
    // Filtros de búsqueda
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    searchInput.addEventListener('input', debounce(() => {
        filterProducts();
    }, 300));
    
    categoryFilter.addEventListener('change', () => {
        filterProducts();
    });
    
    // Navegación suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
};

// Función para filtrar productos
const filterProducts = () => {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    let filteredProducts = allProducts;
    
    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === category);
    }
    
    if (searchText) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchText) || 
            product.description.toLowerCase().includes(searchText)
        );
    }
    
    renderProductsGrid(filteredProducts, 'productsGrid');
};

// Exportar funciones para uso global
window.filterProducts = filterProducts;