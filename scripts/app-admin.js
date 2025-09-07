// scripts/app-admin.js
import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout, isAuthenticated } from './auth.js';

// Inicializar la aplicación de administración
async function initAdminApp() {
    try {
        console.log('🚀 Inicializando aplicación de administración...');
        
        // Verificar autenticación
        const authenticated = isAuthenticated();
        if (!authenticated) {
            console.log('❌ Usuario no autenticado');
            return;
        }

        // Inicializar managers
        window.productManager = await getProductManager();
        window.categoryManager = await getCategoryManager();

        // Hacer funciones disponibles globalmente
        window.getProducts = () => window.productManager.getProducts();
        window.getProductById = (id) => window.productManager.getProductById(id);
        window.editProduct = (id) => {
            const product = window.productManager.getProductById(id);
            if (product) {
                // Usar la función prepareEditForm del admin-panel
                if (typeof window.prepareEditForm === 'function') {
                    window.prepareEditForm(product);
                }
            }
        };
        window.deleteProduct = (id) => window.productManager.deleteProduct(id);
        window.loadProducts = () => window.productManager.loadProducts();
        window.addProduct = (productData) => window.productManager.addProduct(productData);
        window.updateProduct = (id, productData) => window.productManager.updateProduct(id, productData);
        window.renderAdminProductsList = (products, container) => window.productManager.renderAdminProductsList(products, container);
        
        window.getCategories = () => window.categoryManager.getCategories();
        window.loadCategories = () => window.categoryManager.loadCategories();
        window.handleLogout = handleLogout;

        // Inicializar panel de administración
        initAdminPanel();

        console.log('✅ Panel de administración inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación de administración:', error);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en una página de administración
    const isAdminPage = document.getElementById('adminPanel') || 
                       document.getElementById('adminProductsList') ||
                       document.getElementById('productForm');
    
    if (isAdminPage) {
        // Verificar autenticación antes de inicializar
        if (isAuthenticated()) {
            initAdminApp();
        } else {
            console.log('🔒 Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    }
});

// Hacer funciones disponibles globalmente
window.refreshAdminData = () => {
    if (typeof window.loadProducts === 'function') {
        window.loadProducts().then(() => {
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList && typeof window.renderAdminProductsList === 'function') {
                window.renderAdminProductsList(window.getProducts(), adminProductsList);
            }
        });
    }
};

// Para debugging
console.log('✅ app-admin.js cargado correctamente');
