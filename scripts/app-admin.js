// scripts/app-admin.js
import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout, isAuthenticated } from './auth.js';

// Inicializar la aplicación de administración
async function initAdminApp() {
    try {
        console.log('🚀 Inicializando aplicación para panel de administración...');
        
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

        // Inicializar panel de administración
        if (typeof initAdminPanel === 'function') {
            initAdminPanel();
        }

        // Cargar productos y categorías inicialmente
        await window.loadProducts();
        await window.loadCategories();

        // Renderizar lista de productos en admin
        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList && typeof window.renderAdminProductsList === 'function') {
            window.renderAdminProductsList(window.getProducts(), adminProductsList);
        }

        console.log('✅ Panel de administración inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación de administración:', error);
        // Fallback: cargar componentes directamente
        loadAdminComponents();
    }
}

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

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar si estamos en una página que requiere autenticación
        const requiresAuth = document.getElementById('adminProductsList') || 
                            document.getElementById('productForm') ||
                            document.getElementById('manageCategoriesBtn');
        
        if (requiresAuth) {
            if (typeof isAuthenticated === 'function' && isAuthenticated()) {
                initAdminApp();
            } else {
                window.location.href = 'login.html';
            }
        }
    });
} else {
    // Si el DOM ya está cargado, verificar autenticación
    const requiresAuth = document.getElementById('adminProductsList') || 
                        document.getElementById('productForm') ||
                        document.getElementById('manageCategoriesBtn');
    
    if (requiresAuth) {
        if (typeof isAuthenticated === 'function' && isAuthenticated()) {
            initAdminApp();
        } else {
            window.location.href = 'login.html';
        }
    }
}

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
