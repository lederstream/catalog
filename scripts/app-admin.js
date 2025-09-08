// scripts/app-admin.js - VERSIÓN FINAL
import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout } from './auth.js';

// Variable para controlar la inicialización
let isAdminAppInitialized = false;

// Inicializar la aplicación de administración
async function initAdminApp() {
    if (isAdminAppInitialized) {
        console.log('⚠️ Admin app ya está inicializada, omitiendo...');
        return;
    }
    
    try {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        console.log('🚀 Inicializando aplicación de administración...');
        
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

        // Cargar productos y categorías inicialmente
        await window.productManager.loadProducts();
        await window.categoryManager.loadCategories();

        // Inicializar panel de administración solo una vez
        if (typeof initAdminPanel === 'function') {
            initAdminPanel();
        }

        // Renderizar lista de productos en admin
        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList) {
            window.productManager.renderAdminProductsList(window.productManager.getProducts(), adminProductsList);
        }

        isAdminAppInitialized = true;
        console.log('✅ Panel de administración inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación de administración:', error);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Inicializando aplicación para panel de administración...');
        
        // Verificar si app y initialize existen antes de llamarlos
        if (window.app && typeof window.app.initialize === 'function') {
            window.app.initialize();
        } else {
            console.log('ℹ️ Inicializando sin app global...');
            await initAdminApp();
        }
    });
} else {
    // Si el DOM ya está listo, inicializar directamente
    setTimeout(async () => {
        await initAdminApp();
    }, 100);
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
