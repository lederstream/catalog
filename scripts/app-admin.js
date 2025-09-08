// scripts/app-admin.js
import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout } from './auth.js';
import { setupAllEventListeners } from './event-listeners.js';

// Inicializar la aplicación de administración
async function initAdminApp() {
    try {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'login.html';
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
            if (product && typeof window.prepareEditForm === 'function') {
                window.prepareEditForm(product);
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

        // Configurar event listeners globales
        setupAllEventListeners();

        // Inicializar panel de administración
        initAdminPanel();

        // Cargar productos y categorías inicialmente
        await window.productManager.loadProducts();
        await window.categoryManager.loadCategories();

        // Renderizar lista de productos en admin
        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList) {
            window.productManager.renderAdminProductsList(window.productManager.getProducts(), adminProductsList);
        }

        console.log('✅ Panel de administración inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación de administración:', error);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
    initAdminApp();
}

// Inicializar la aplicación para la página de administración
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicación para panel de administración...');
    
    // Verificar si app y initialize existen antes de llamarlos
    if (window.app && typeof window.app.initialize === 'function') {
        window.app.initialize();
    } else {
        console.error('❌ Error: app o app.initialize no están definidos');
        loadAdminComponents();
    }
});

// Cargar componentes de administración directamente
async function loadAdminComponents() {
    console.log('🔄 Cargando componentes de administración directamente...');
    
    try {
        // Cargar productos y categorías
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
        }
        
        if (typeof window.loadCategories === 'function') {
            await window.loadCategories();
        }
        
        // Configurar formulario de producto
        if (typeof window.setupProductForm === 'function') {
            window.setupProductForm();
        }
        
        // Inicializar panel de administración
        if (typeof window.initAdminPanel === 'function') {
            window.initAdminPanel();
        }
        
        console.log('✅ Componentes de administración cargados');
    } catch (error) {
        console.error('❌ Error cargando componentes de administración:', error);
    }
}

// Hacer funciones disponibles globalmente
window.refreshAdminData = () => {
    if (window.app && typeof window.app.refresh === 'function') {
        window.app.refresh();
    } else if (window.refreshData) {
        window.refreshData();
    }
};

// Para debugging
console.log('✅ app-admin.js cargado correctamente');
