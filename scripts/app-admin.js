// scripts/app-admin.js - VERSIÓN FINAL
import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout } from './auth.js';
import { setupAllEventListeners } from './event-listeners.js';

async function initAdminApp() {
    try {
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        window.productManager = await getProductManager();
        window.categoryManager = await getCategoryManager();

        setupGlobalFunctions();
        setupAllEventListeners();
        initAdminPanel();

        await window.productManager.loadProducts();
        await window.categoryManager.loadProducts();

        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList) window.productManager.renderAdminProductsList(window.productManager.getProducts(), adminProductsList);

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación de administración:', error);
    }
}

function setupGlobalFunctions() {
    window.getProducts = () => window.productManager.getProducts();
    window.getProductById = (id) => window.productManager.getProductById(id);
    window.editProduct = (id) => {
        const product = window.productManager.getProductById(id);
        if (product && typeof window.prepareEditForm === 'function') window.prepareEditForm(product);
    };      
    window.deleteProduct = (id) => window.productManager.deleteProduct(id);
    window.loadProducts = () => window.productManager.loadProducts();
    window.addProduct = (productData) => window.productManager.addProduct(productData);
    window.updateProduct = (id, productData) => window.productManager.updateProduct(id, productData);
    window.renderAdminProductsList = (products, container) => window.productManager.renderAdminProductsList(products, container);
    
    window.getCategories = () => window.categoryManager.getCategories();
    window.loadCategories = () => window.categoryManager.loadCategories();
    window.handleLogout = handleLogout;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
    initAdminApp();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.app && typeof window.app.initialize === 'function') {
        window.app.initialize();
    } else {
        loadAdminComponents();
    }
});

async function loadAdminComponents() {
    try {
        if (typeof window.loadProducts === 'function') await window.loadProducts();
        if (typeof window.loadCategories === 'function') await window.loadCategories();
        if (typeof window.setupProductForm === 'function') window.setupProductForm();
        if (typeof window.initAdminPanel === 'function') window.initAdminPanel();
    } catch (error) {
        console.error('❌ Error cargando componentes de administración:', error);
    }
}

window.refreshAdminData = () => {
    if (window.app && typeof window.app.refresh === 'function') window.app.refresh();
    else if (window.refreshData) window.refreshData();
};
