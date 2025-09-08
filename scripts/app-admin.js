import { initAdminPanel } from './components/admin-panel.js';
import { getProductManager } from './products.js';
import { getCategoryManager } from './categories.js';
import { checkAuth, handleLogout } from './auth.js';

// Inicializar la aplicación de administración
async function initAdminApp() {
    try {
        console.log('🚀 Iniciando aplicación de administración...');
        
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'login.html';
            return;
        }

        // Inicializar managers
        window.productManager = await getProductManager();
        window.categoryManager = await getCategoryManager();

        console.log('✅ Managers inicializados:', {
            productManager: !!window.productManager,
            categoryManager: !!window.categoryManager
        });

        // Configurar funciones globales CORRECTAMENTE
        window.getProducts = () => window.productManager.getProducts();
        window.getProductById = (id) => window.productManager.getProductById(id);
        window.deleteProduct = (id) => window.productManager.deleteProduct(id);
        window.loadProducts = () => window.productManager.loadProducts();
        window.addProduct = (productData) => window.productManager.addProduct(productData);
        window.updateProduct = (id, productData) => window.productManager.updateProduct(id, productData);
        window.renderAdminProductsList = (products, container) => window.productManager.renderAdminProductsList(products, container);
        
        window.getCategories = () => window.categoryManager.getCategories();
        window.loadCategories = () => window.categoryManager.loadCategories();
        window.handleLogout = handleLogout;

        // Configurar editProduct para usar la función de admin-panel.js
        window.editProduct = (id) => {
            console.log('🔍 editProduct llamado con ID:', id);
            const product = window.productManager.getProductById(id);
            
            if (product && typeof window.prepareEditForm === 'function') {
                console.log('✅ Producto encontrado, llamando a prepareEditForm');
                window.prepareEditForm(product);
            } else {
                console.error('❌ Error: Producto no encontrado o prepareEditForm no disponible');
            }
        };

        // Inicializar panel de administración
        initAdminPanel();

        // Cargar datos iniciales
        await window.productManager.loadProducts();
        await window.categoryManager.loadCategories();

        console.log('✅ Datos iniciales cargados:', {
            productos: window.productManager.getProducts().length,
            categorias: window.categoryManager.getCategories().length
        });

    } catch (error) {
        console.error('❌ Error fatal en initAdminApp:', error);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
    initAdminApp();
}

// Hacer funciones disponibles globalmente
window.refreshAdminData = async () => {
    try {
        await window.loadProducts();
        await window.loadCategories();
        
        const adminProductsList = document.getElementById('adminProductsList');
        if (adminProductsList) {
            window.renderAdminProductsList(window.getProducts(), adminProductsList);
        }
    } catch (error) {
        console.error('Error refrescando datos:', error);
    }
};
