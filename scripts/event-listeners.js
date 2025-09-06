// scripts/event-listeners.js
import { Utils } from './utils.js';
import { openImageSearchModal, openCategoriesModal } from './modals.js';

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

// Listeners globales de clic
function setupGlobalClickListeners() {
    document.addEventListener('click', Utils.debounce((e) => {
        // Solo registrar clicks en modo desarrollo
        if (localStorage.getItem('debug') === 'true') {
            console.log('🖱️ Global click detected on:', e.target.className);
        }
        
        // Manejar clicks en botones de detalles de producto
        if (e.target.closest('.view-details-btn')) {
            const btn = e.target.closest('.view-details-btn');
            const productId = btn.dataset.productId;
            if (productId && typeof window.showProductDetails === 'function') {
                // Efecto de clic
                btn.classList.add('scale-95');
                setTimeout(() => btn.classList.remove('scale-95'), 150);
                
                window.showProductDetails(productId);
            }
        }
        
        // Manejar clicks en botones de editar producto
        if (e.target.closest('.edit-product')) {
            const btn = e.target.closest('.edit-product');
            const productId = btn.dataset.id;
            if (productId && typeof window.editProduct === 'function') {
                // Efecto de clic
                btn.classList.add('scale-95');
                setTimeout(() => btn.classList.remove('scale-95'), 150);
                
                window.editProduct(productId);
            }
        }
        
        // Manejar clicks en botones de búsqueda de imagen
        if (e.target.closest('#searchImageBtn')) {
            if (typeof window.openImageSearchModal === 'function') {
                window.openImageSearchModal();
            }
        }
        
        // Manejar clicks en botones de gestión de categorías
        if (e.target.closest('#manageCategoriesBtn')) {
            if (typeof window.openCategoriesModal === 'function') {
                window.openCategoriesModal();
            }
        }
    }, 50));
}

// Listeners para formularios
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
        button.addEventListener('click', function() {
            if (this.form && this.form.checkValidity()) {
                this.classList.add('loading');
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                
                // Restore after 5 seconds max (safety)
                setTimeout(() => {
                    this.classList.remove('loading');
                    this.disabled = false;
                    this.innerHTML = this.dataset.originalText || this.textContent;
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

// Hacer funciones disponibles globalmente
window.setupAllEventListeners = setupAllEventListeners;
