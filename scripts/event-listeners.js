// scripts/event-listeners.js - VERSIÓN CORREGIDA
import { Utils } from './utils.js';

// Configurar todos los event listeners globales
export function setupAllEventListeners() {
    try {
        setupGlobalClickListeners();
        setupFormEventListeners();
        setupNavigationListeners();
        setupUIEventListeners();
        
        console.log('✅ Event listeners configurados correctamente');
    } catch (error) {
        console.error('Error configurando event listeners:', error);
    }
}

// Manejadores específicos para evitar problemas
function handleViewDetails(e) {
    e.preventDefault();
    const btn = e.target.closest('.view-details-btn');
    const productId = btn.dataset.productId;
    if (productId && typeof window.showProductDetails === 'function') {
        window.showProductDetails(productId);
    }
}

function handleEditProduct(e) {
    e.preventDefault();
    const btn = e.target.closest('.edit-product');
    const productId = btn.dataset.id;
    if (productId && typeof window.editProduct === 'function') {
        window.editProduct(productId);
    }
}

function handleSearchImage(e) {
    e.preventDefault();
    if (typeof window.openImageSearchModal === 'function') {
        window.openImageSearchModal();
    }
}

function handleManageCategories(e) {
    e.preventDefault();
    if (typeof window.openCategoriesModal === 'function') {
        window.openCategoriesModal();
    }
}

// Listeners globales de clic - VERSIÓN SEGURA
function setupGlobalClickListeners() {
    document.addEventListener('click', function(e) {
        // EXCLUSIÓN CRÍTICA: No procesar clicks en elementos de formulario
        const isFormElement = e.target.matches('input, select, textarea, label, button[type="submit"], button[type="button"]');
        const isInForm = e.target.closest('form');
        
        // Si es un elemento de formulario o está dentro de uno, NO procesar
        if (isFormElement || isInForm) {
            return; // Permitir comportamiento normal
        }
        
        // Solo procesar clicks en botones específicos
        if (e.target.closest('.view-details-btn')) {
            handleViewDetails(e);
        }
        
        if (e.target.closest('.edit-product')) {
            handleEditProduct(e);
        }
        
        if (e.target.closest('#searchImageBtn')) {
            handleSearchImage(e);
        }
        
        if (e.target.closest('#manageCategoriesBtn')) {
            handleManageCategories(e);
        }
    });
}

// Listeners para formularios (sin interferencias)
function setupFormEventListeners() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
                Utils.showError('Por favor, completa todos los campos requeridos');
            }
        });
    });
    
    // Asegurar que los campos de formulario sean completamente interactivos
    document.addEventListener('focus', (e) => {
        if (e.target.matches('input, select, textarea')) {
            // Remover cualquier atributo que pueda interferir
            e.target.removeAttribute('readonly');
            e.target.removeAttribute('disabled');
            e.target.classList.remove('pointer-events-none');
            e.target.style.pointerEvents = 'auto';
        }
    }, true);
}

// Listeners de navegación
function setupNavigationListeners() {
    // Smooth scrolling para enlaces internos
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
}

// Listeners para UI
function setupUIEventListeners() {
    // Hover effects
    const cards = document.querySelectorAll('.card, .product-card, .btn');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'all 0.3s ease';
        });
    });
}

// Validación de formulario completo
function validateForm(form) {
    if (!form) return true;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('border-red-500');
        }
    });
    
    return isValid;
}

// Función para limpiar interferencias en formularios
export function clearFormInterference() {
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.removeAttribute('readonly');
        element.removeAttribute('disabled');
        element.classList.remove('pointer-events-none');
        element.style.pointerEvents = 'auto';
    });
    console.log('✅ Interferencias de formulario limpiadas');
}

// Hacer funciones disponibles globalmente
window.setupAllEventListeners = setupAllEventListeners;
window.clearFormInterference = clearFormInterference;
