// scripts/app-admin.js
import { app } from './app.js';

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
