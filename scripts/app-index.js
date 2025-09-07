// app-index.js - Punto de entrada para la página principal
import { app } from './app.js';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicación para página principal...');
    
    // Verificar si app y initialize existen antes de llamarlos
    if (window.app && typeof window.app.initialize === 'function') {
        window.app.initialize();
    } else {
        console.error('❌ Error: app o app.initialize no están definidos');
        
        // Intentar cargar los componentes esenciales directamente
        loadEssentialComponents();
    }
});

// Configurar event listeners para filtros
function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            if (window.app && typeof window.app.filterProducts === 'function') {
                window.app.filterProducts();
            } else if (window.filterProducts) {
                window.filterProducts();
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (window.app && typeof window.app.filterProducts === 'function') {
                window.app.filterProducts();
            } else if (window.filterProducts) {
                window.filterProducts();
            }
        });
    }
}

// Cargar componentes esenciales directamente si es necesario
async function loadEssentialComponents() {
    console.log('🔄 Cargando componentes esenciales directamente...');
    
    try {
        // Cargar productos si la función está disponible
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
        }
        
        // Configurar filtros
        setupFilters();
        
        // Configurar modales si existen
        if (typeof window.initModals === 'function') {
            window.initModals();
        }
        
        console.log('✅ Componentes esenciales cargados');
    } catch (error) {
        console.error('❌ Error cargando componentes esenciales:', error);
    }
}

// Configurar filtros cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupFilters);

// Hacer funciones disponibles globalmente
window.refreshCatalog = () => {
    if (window.app && typeof window.app.refresh === 'function') {
        window.app.refresh();
    } else if (window.refreshData) {
        window.refreshData();
    }
};

// Función para verificar y corregir errores de inicialización
window.fixInitializationErrors = () => {
    console.log('🔧 Verificando y corrigiendo errores de inicialización...');
    
    // Verificar si el formulario de producto existe y configurarlo si es necesario
    const productForm = document.getElementById('productForm');
    if (productForm && typeof window.setupProductForm === 'function') {
        console.log('✅ Configurando formulario de producto...');
        window.setupProductForm();
    }
    
    // Verificar si el panel de administración necesita configuración
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel && !adminPanel.classList.contains('initialized')) {
        console.log('✅ Configurando panel de administración...');
        if (typeof window.initAdminPanel === 'function') {
            window.initAdminPanel();
            adminPanel.classList.add('initialized');
        }
    }
    
    console.log('✅ Verificación de errores completada');
};

// Ejecutar corrección de errores después de un tiempo
setTimeout(() => {
    if (typeof window.fixInitializationErrors === 'function') {
        window.fixInitializationErrors();
    }
}, 2000);

// Para debugging
console.log('✅ app-index.js cargado correctamente');
