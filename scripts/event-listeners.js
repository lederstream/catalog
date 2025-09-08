// scripts/event-listeners.js - VERSIÓN CORREGIDA
import { Utils } from './utils.js';

// Configurar todos los event listeners globales
export function setupAllEventListeners() {
    console.log('🔧 Configurando todos los event listeners...');
    
    try {
        setupGlobalClickListeners();
        setupFormEventListeners();
        setupNavigationListeners();
        setupUIEventListeners();
        
        console.log('✅ Todos los event listeners configurados');
    } catch (error) {
        console.error('Error configurando event listeners:', error);
        Utils.showError('Error al configurar interactividad');
    }
}

// Listeners globales de clic - VERSIÓN CORREGIDA
function setupGlobalClickListeners() {
    document.addEventListener('click', function(e) {
        // EXCLUSIÓN CRÍTICA: No procesar clicks en elementos de formulario
        const isFormElement = e.target.matches('input, select, textarea, label, button[type="submit"], button[type="button"]');
        const isInForm = e.target.closest('form');
        
        // Si es un elemento de formulario o está dentro de uno, NO procesar el evento aquí
        if (isFormElement || isInForm) {
            // Permitir que los eventos de formulario se manejen normalmente
            return;
        }
        
        // Solo procesar clicks en botones específicos con data attributes
        if (e.target.closest('.view-details-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.view-details-btn');
            const productId = btn.dataset.productId;
            if (productId && typeof window.showProductDetails === 'function') {
                btn.classList.add('scale-95');
                setTimeout(() => btn.classList.remove('scale-95'), 150);
                window.showProductDetails(productId);
            }
        }
        
        if (e.target.closest('.edit-product')) {
            e.preventDefault();
            const btn = e.target.closest('.edit-product');
            const productId = btn.dataset.id;
            if (productId && typeof window.editProduct === 'function') {
                btn.classList.add('scale-95');
                setTimeout(() => btn.classList.remove('scale-95'), 150);
                window.editProduct(productId);
            }
        }
        
        if (e.target.closest('#searchImageBtn')) {
            e.preventDefault();
            if (typeof window.openImageSearchModal === 'function') {
                window.openImageSearchModal();
            }
        }
        
        if (e.target.closest('#manageCategoriesBtn')) {
            e.preventDefault();
            if (typeof window.openCategoriesModal === 'function') {
                window.openCategoriesModal();
            }
        }
    });
}

// Listeners para formularios - VERSIÓN MEJORADA
function setupFormEventListeners() {
    // Validación en tiempo real para formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('input', Utils.debounce((e) => {
            validateField(e.target);
        }, 300));
        
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
        
        card.addEventListener('touchstart', () => {
            card.classList.add('active');
        });
        
        card.addEventListener('touchend', () => {
            setTimeout(() => card.classList.remove('active'), 150);
        });
    });
    
    // Loading states for buttons
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
        // Guardar el texto original
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.innerHTML;
        }
        
        button.addEventListener('click', function(e) {
            // No interferir con la funcionalidad normal del botón
            if (this.form && this.form.checkValidity()) {
                this.classList.add('loading');
                this.disabled = true;
                const originalText = this.dataset.originalText;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                
                // Restore after 5 seconds max (safety)
                setTimeout(() => {
                    this.classList.remove('loading');
                    this.disabled = false;
                    this.innerHTML = originalText;
                }, 5000);
            }
        });
    });
}

// Validación de campo individual
function validateField(field) {
    if (!field) return true;
    
    const isValid = field.checkValidity();
    const errorElement = field.nextElementSibling?.classList.contains('error') 
        ? field.nextElementSibling 
        : null;
    
    if (!isValid && field.value) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = field.validationMessage;
            errorElement.classList.remove('hidden');
        }
        return false;
    } else {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        return true;
    }
}

// Validación de formulario completo
function validateForm(form) {
    if (!form) return true;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
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
