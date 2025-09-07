// scripts/app-admin.js
import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout, isAuthenticated } from './auth.js';

// Estado de la aplicación
const AppState = {
    INITIALIZING: 'initializing',
    READY: 'ready',
    ERROR: 'error'
};

// Inicializar la aplicación de administración
async function initAdminApp() {
    try {
        console.log('🚀 Inicializando aplicación para panel de administración...');
        
        // Verificar autenticación
        if (!checkAuth()) {
            console.log('🔐 Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'login.html';
            return;
        }

        console.log('✅ Usuario autenticado, inicializando managers...');

        // Inicializar managers
        window.productManager = await getProductManager();
        window.categoryManager = await getCategoryManager();

        // Configurar funciones globales
        setupGlobalFunctions();

        // Inicializar panel de administración
        initAdminPanel();

        // Cargar datos iniciales
        await loadInitialData();

        // Configurar event listeners
        setupEventListeners();

        console.log('✅ Panel de administración inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación de administración:', error);
        showErrorNotification('Error al inicializar el panel de administración');
    }
}

// Configurar funciones globales
function setupGlobalFunctions() {
    window.getProducts = () => window.productManager?.getProducts() || [];
    window.getProductById = (id) => window.productManager?.getProductById(id) || null;
    window.editProduct = (id) => {
        const product = window.getProductById(id);
        if (product && typeof window.prepareEditForm === 'function') {
            window.prepareEditForm(product);
        }
    };
    window.deleteProduct = (id) => window.productManager?.deleteProduct(id) || Promise.reject('ProductManager no disponible');
    window.loadProducts = () => window.productManager?.loadProducts() || Promise.reject('ProductManager no disponible');
    window.addProduct = (productData) => window.productManager?.addProduct(productData) || Promise.reject('ProductManager no disponible');
    window.updateProduct = (id, productData) => window.productManager?.updateProduct(id, productData) || Promise.reject('ProductManager no disponible');
    window.renderAdminProductsList = (products, container) => window.productManager?.renderAdminProductsList(products, container);
    
    window.getCategories = () => window.categoryManager?.getCategories() || [];
    window.loadCategories = () => window.categoryManager?.loadCategories() || Promise.reject('CategoryManager no disponible');
    window.handleLogout = handleLogout;
}

// Cargar datos iniciales
async function loadInitialData() {
    try {
        await window.loadProducts();
        await window.loadCategories();

        // Renderizar lista de productos en admin
        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList && typeof window.renderAdminProductsList === 'function') {
            window.renderAdminProductsList(window.getProducts(), adminProductsList);
        }
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listener para el botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Mostrar notificación de error
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Cargar componentes de administración directamente (fallback)
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
        showErrorNotification('Error al cargar componentes de administración');
    }
}

// Función para refrescar datos
window.refreshAdminData = async () => {
    try {
        console.log('🔄 Actualizando datos de administración...');
        await window.loadProducts();
        await window.loadCategories();
        
        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList && typeof window.renderAdminProductsList === 'function') {
            window.renderAdminProductsList(window.getProducts(), adminProductsList);
        }
        
        console.log('✅ Datos actualizados correctamente');
    } catch (error) {
        console.error('❌ Error actualizando datos:', error);
        showErrorNotification('Error al actualizar datos');
    }
};

// Verificar si estamos en una página de administración
function isAdminPage() {
    return document.getElementById('adminProductsList') || 
           document.getElementById('productForm') ||
           document.getElementById('manageCategoriesBtn') ||
           document.querySelector('[data-admin-page]');
}

// Inicialización principal
function initializeApp() {
    console.log('✅ app-admin.js cargado correctamente');
    
    if (!isAdminPage()) {
        console.log('ℹ️ No es una página de administración, omitiendo inicialización');
        return;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isAuthenticated()) {
                initAdminApp();
            } else {
                console.log('🔐 Usuario no autenticado, redirigiendo...');
                window.location.href = 'login.html';
            }
        });
    } else {
        if (isAuthenticated()) {
            initAdminApp();
        } else {
            console.log('🔐 Usuario no autenticado, redirigiendo...');
            window.location.href = 'login.html';
        }
    }
}

// Eliminar el código problemático que intenta acceder a window.app
// y reemplazarlo con la inicialización limpia

// Inicializar la aplicación
initializeApp();

// Exportar para pruebas (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAdminApp,
        loadAdminComponents,
        setupGlobalFunctions,
        isAdminPage
    };
}
