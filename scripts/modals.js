// scripts/modals.js
import { 
    showNotification, 
    validateUrl, 
    debounce,
    fadeIn,
    fadeOut,
    slideDown,
    slideUp
} from './utils.js';

// Sistema de gestión de modales
class ModalSystem {
    constructor() {
        this.activeModals = new Set();
        this.modalStack = [];
        this.eventListeners = new Map();
    }
    
    static getInstance() {
        if (!ModalSystem.instance) {
            ModalSystem.instance = new ModalSystem();
        }
        return ModalSystem.instance;
    }
    
    // Abrir modal
    open(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal con ID ${modalId} no encontrado`);
            return false;
        }
        
        // Configurar opciones
        const config = {
            backdrop: true,
            closeOnEsc: true,
            closeOnBackdropClick: true,
            animation: true,
            ...options
        };
        
        // Agregar a pila de modales
        this.modalStack.push(modalId);
        this.activeModals.add(modalId);
        
        // Mostrar backdrop si es necesario
        if (config.backdrop) {
            this.createBackdrop();
        }
        
        // Mostrar modal con animación
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        
        if (config.animation) {
            fadeIn(modal);
        }
        
        // Configurar event listeners
        this.setupModalListeners(modal, config);
        
        // Disparar evento personalizado
        this.dispatchEvent('modalOpened', { modalId, modal });
        
        return true;
    }
    
    // Cerrar modal
    close(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal || !this.activeModals.has(modalId)) {
            return false;
        }
        
        // Configurar opciones
        const config = {
            animation: true,
            ...options
        };
        
        // Remover de pila de modales
        this.modalStack = this.modalStack.filter(id => id !== modalId);
        this.activeModals.delete(modalId);
        
        // Ocultar modal con animación
        const hideModal = () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            // Remover backdrop si no hay más modales abiertos
            if (this.activeModals.size === 0) {
                this.removeBackdrop();
            }
            
            // Disparar evento personalizado
            this.dispatchEvent('modalClosed', { modalId, modal });
        };
        
        if (config.animation) {
            fadeOut(modal).then(hideModal);
        } else {
            hideModal();
        }
        
        return true;
    }
    
    // Cerrar todos los modales
    closeAll() {
        this.activeModals.forEach(modalId => {
            this.close(modalId, { animation: false });
        });
    }
    
    // Crear backdrop
    createBackdrop() {
        let backdrop = document.getElementById('modal-backdrop');
        
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'modal-backdrop';
            backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 opacity-0';
            document.body.appendChild(backdrop);
            
            // Animar backdrop
            setTimeout(() => {
                backdrop.style.opacity = '1';
            }, 10);
        }
        
        return backdrop;
    }
    
    // Remover backdrop
    removeBackdrop() {
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
    }
    
    // Configurar event listeners del modal
    setupModalListeners(modal, config) {
        const modalId = modal.id;
        
        // Cerrar con Escape
        if (config.closeOnEsc) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && this.modalStack[this.modalStack.length - 1] === modalId) {
                    this.close(modalId);
                }
            };
            
            document.addEventListener('keydown', escapeHandler);
            this.eventListeners.set(`${modalId}-escape`, escapeHandler);
        }
        
        // Cerrar al hacer clic en el backdrop
        if (config.closeOnBackdropClick) {
            const backdropClickHandler = (e) => {
                if (e.target === modal) {
                    this.close(modalId);
                }
            };
            
            modal.addEventListener('click', backdropClickHandler);
            this.eventListeners.set(`${modalId}-backdrop`, backdropClickHandler);
        }
        
        // Botones de cerrar dentro del modal
        const closeButtons = modal.querySelectorAll('[data-dismiss="modal"], .close-modal');
        closeButtons.forEach(button => {
            const handler = () => this.close(modalId);
            button.addEventListener('click', handler);
            this.eventListeners.set(`${modalId}-button-${button.className}`, handler);
        });
    }
    
    // Limpiar event listeners del modal
    cleanupModalListeners(modalId) {
        // Eliminar event listeners específicos de este modal
        const prefixes = [`${modalId}-escape`, `${modalId}-backdrop`, `${modalId}-button`];
        
        this.eventListeners.forEach((handler, key) => {
            if (prefixes.some(prefix => key.startsWith(prefix))) {
                // Remover el event listener
                if (key.includes('escape')) {
                    document.removeEventListener('keydown', handler);
                } else if (key.includes('backdrop')) {
                    const modal = document.getElementById(modalId);
                    if (modal) modal.removeEventListener('click', handler);
                } else if (key.includes('button')) {
                    // Los botones se limpian automáticamente cuando se remueve el modal
                }
                
                this.eventListeners.delete(key);
            }
        });
    }
    
    // Sistema de eventos personalizados
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    dispatchEvent(event, detail) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(detail);
                } catch (error) {
                    console.error(`Error en event listener para ${event}:`, error);
                }
            });
        }
    }
}

// Inicializar sistema de modales
const modalSystem = ModalSystem.getInstance();

// Modal de búsqueda de imágenes
const imageSearchModal = document.getElementById('imageSearchModal');
const imageSearchQuery = document.getElementById('imageSearchQuery');
const imageSearchResults = document.getElementById('imageSearchResults');
const performSearch = document.getElementById('performSearch');
const closeModal = document.getElementById('closeModal');

// Modal de categorías
const categoriesModal = document.getElementById('categoriesModal');
const newCategoryName = document.getElementById('newCategoryName');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoriesList = document.getElementById('categoriesList');
const closeCategoriesModal = document.getElementById('closeCategoriesModal');

// Inicializar modales
export function initModals() {
    console.log('🔲 Inicializando sistema de modales...');
    
    // Inicializar sistema de modales
    setupModalSystem();
    
    // Modal de búsqueda de imágenes
    if (performSearch) {
        performSearch.addEventListener('click', searchImages);
    }

    if (imageSearchQuery) {
        imageSearchQuery.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchImages();
            }
        });
    }

    // Modal de categorías
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const name = newCategoryName.value.trim();
            if (name && typeof window.addCategory === 'function') {
                window.addCategory(name).then(() => {
                    newCategoryName.value = '';
                    if (typeof window.renderCategoriesList === 'function') {
                        window.renderCategoriesList(categoriesList);
                    }
                });
            }
        });
    }

    if (newCategoryName) {
        newCategoryName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const name = newCategoryName.value.trim();
                if (name && typeof window.addCategory === 'function') {
                    window.addCategory(name).then(() => {
                        newCategoryName.value = '';
                        if (typeof window.renderCategoriesList === 'function') {
                            window.renderCategoriesList(categoriesList);
                        }
                    });
                }
            }
        });
    }
    
    console.log('✅ Sistema de modales inicializado');
}

// Configurar sistema de modales
function setupModalSystem() {
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const topModal = modalSystem.modalStack[modalSystem.modalStack.length - 1];
            if (topModal) {
                modalSystem.close(topModal);
            }
        }
    });
    
    // Inicializar modales existentes
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        // Botones de apertura
        const openButtons = document.querySelectorAll(`[data-toggle="modal"][data-target="#${modal.id}"]`);
        openButtons.forEach(button => {
            button.addEventListener('click', () => {
                modalSystem.open(modal.id);
            });
        });
        
        // Botones de cierre dentro del modal
        const closeButtons = modal.querySelectorAll('[data-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modalSystem.close(modal.id);
            });
        });
    });
    
    // Event listeners para cambios de modales
    modalSystem.addEventListener('modalOpened', (detail) => {
        console.log(`Modal abierto: ${detail.modalId}`);
        
        // Enfocar el primer campo de entrada si existe
        const firstInput = detail.modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Agregar clase al body
        document.body.classList.add('modal-open');
    });
    
    modalSystem.addEventListener('modalClosed', (detail) => {
        console.log(`Modal cerrado: ${detail.modalId}`);
        
        // Remover clase del body si no hay modales abiertos
        if (modalSystem.activeModals.size === 0) {
            document.body.classList.remove('modal-open');
        }
    });
}

// Abrir modal de búsqueda de imágenes
export function openImageSearchModal() {
    modalSystem.open('imageSearchModal');
    imageSearchQuery.value = '';
    imageSearchResults.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Realiza una búsqueda para ver resultados</p>';
    imageSearchQuery.focus();
}

// Buscar imágenes (usando Unsplash API como ejemplo)
async function searchImages() {
    const query = imageSearchQuery.value.trim();
    if (!query) return;

    imageSearchResults.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Buscando imágenes...</p>';

    try {
        // En una implementación real, aquí harías una llamada a la API de Unsplash, Pexels, etc.
        // Por ahora, simularemos una respuesta con imágenes de placeholder
        setTimeout(() => {
            // Simular resultados de búsqueda
            const simulatedResults = [
                { id: 1, url: `https://source.unsplash.com/300x200/?${encodeURIComponent(query)}`, alt: query },
                { id: 2, url: `https://source.unsplash.com/300x201/?${encodeURIComponent(query)}`, alt: query },
                { id: 3, url: `https://source.unsplash.com/300x202/?${encodeURIComponent(query)}`, alt: query },
                { id: 4, url: `https://source.unsplash.com/300x203/?${encodeURIComponent(query)}`, alt: query },
                { id: 5, url: `https://source.unsplash.com/300x204/?${encodeURIComponent(query)}`, alt: query },
                { id: 6, url: `https://source.unsplash.com/300x205/?${encodeURIComponent(query)}`, alt: query },
                { id: 7, url: `https://source.unsplash.com/300x206/?${encodeURIComponent(query)}`, alt: query },
                { id: 8, url: `https://source.unsplash.com/300x207/?${encodeURIComponent(query)}`, alt: query }
            ];

            renderImageResults(simulatedResults);
        }, 1000);
    } catch (error) {
        console.error('Error al buscar imágenes:', error);
        imageSearchResults.innerHTML = '<p class="text-red-500 col-span-full text-center py-8">Error al buscar imágenes. Intenta nuevamente.</p>';
    }
}

// Renderizar resultados de búsqueda de imágenes
function renderImageResults(images) {
    if (!images || images.length === 0) {
        imageSearchResults.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No se encontraron imágenes</p>';
        return;
    }

    imageSearchResults.innerHTML = images.map(image => `
        <div class="group relative overflow-hidden rounded-lg transform transition-transform duration-300 hover:scale-105">
            <img src="${image.url}" alt="${image.alt}" 
                 class="w-full h-32 object-cover cursor-pointer"
                 loading="lazy">
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300">
                <button class="select-image bg-white text-black px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110" 
                        data-url="${image.url}">
                    Seleccionar
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners a los botones de selección
    imageSearchResults.querySelectorAll('.select-image').forEach(button => {
        button.addEventListener('click', (e) => {
            const url = e.currentTarget.dataset.url;
            const photoUrlInput = document.getElementById('photo_url');
            
            if (photoUrlInput) {
                photoUrlInput.value = url;
                
                // Actualizar vista previa si existe
                if (typeof window.updateImagePreview === 'function') {
                    window.updateImagePreview(url);
                }
            }
            
            modalSystem.close('imageSearchModal');
            showNotification('✅ Imagen seleccionada correctamente', 'success');
        });
    });
}

// Abrir modal de categorías
export function openCategoriesModal() {
    modalSystem.open('categoriesModal');
    newCategoryName.value = '';
    newCategoryName.focus();
    
    // Cargar y renderizar categorías si existe la función
    if (typeof window.renderCategoriesList === 'function' && categoriesList) {
        window.renderCategoriesList(categoriesList);
    }
}

// Actualizar vista previa de imagen
export function updateImagePreview(url) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;

    if (url && url.trim() !== '') {
        preview.innerHTML = `
            <div class="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                <img src="${url}" alt="Vista previa" 
                     class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+al+cargar+imagen'">
            </div>
        `;
    } else {
        preview.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                <div class="text-center">
                    <i class="fas fa-image text-2xl mb-2"></i>
                    <p class="text-sm">La imagen aparecerá aquí</p>
                </div>
            </div>
        `;
    }
}

// Modal de confirmación genérico
export function showConfirmationModal(options = {}) {
    const {
        title = '¿Estás seguro?',
        message = 'Esta acción no se puede deshacer.',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        onConfirm = () => {},
        onCancel = () => {},
        type = 'warning' // warning, danger, info, success
    } = options;
    
    const modalId = 'confirmationModal';
    let modal = document.getElementById(modalId);
    
    // Crear modal si no existe
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        document.body.appendChild(modal);
    }
    
    // Icono según el tipo
    let icon = 'fa-question-circle';
    let iconColor = 'text-blue-500';
    
    switch (type) {
        case 'danger':
            icon = 'fa-exclamation-triangle';
            iconColor = 'text-red-500';
            break;
        case 'success':
            icon = 'fa-check-circle';
            iconColor = 'text-green-500';
            break;
        case 'info':
            icon = 'fa-info-circle';
            iconColor = 'text-blue-500';
            break;
        case 'warning':
        default:
            icon = 'fa-exclamation-triangle';
            iconColor = 'text-yellow-500';
            break;
    }
    
    // Contenido del modal
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
            <div class="p-6">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 ${iconColor} rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas ${icon} text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">${title}</h3>
                    <p class="text-gray-600">${message}</p>
                </div>
                
                <div class="flex space-x-3">
                    <button class="flex-1 cancel-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        ${cancelText}
                    </button>
                    <button class="flex-1 confirm-btn px-4 py-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors">
                        ${confirmText}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Configurar event listeners
    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        modalSystem.close(modalId);
    };
    
    const confirmHandler = () => {
        cleanup();
        onConfirm();
    };
    
    const cancelHandler = () => {
        cleanup();
        onCancel();
    };
    
    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    
    // Abrir modal
    modalSystem.open(modalId);
    
    // Devolver funciones para controlar el modal
    return {
        close: () => modalSystem.close(modalId),
        update: (newOptions) => {
            // Implementar actualización dinámica si es necesario
        }
    };
}

// Modal de carga
export function showLoadingModal(message = 'Cargando...') {
    const modalId = 'loadingModal';
    let modal = document.getElementById(modalId);
    
    // Crear modal si no existe
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        document.body.appendChild(modal);
    }
    
    // Contenido del modal
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 text-center">
            <div class="loading-spinner inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-gray-700">${message}</p>
        </div>
    `;
    
    // Abrir modal
    modalSystem.open(modalId);
    
    // Devolver función para cerrar
    return {
        close: () => modalSystem.close(modalId),
        update: (newMessage) => {
            const messageElement = modal.querySelector('p');
            if (messageElement && newMessage) {
                messageElement.textContent = newMessage;
            }
        }
    };
}

// Hacer funciones disponibles globalmente
window.openImageSearchModal = openImageSearchModal;
window.openCategoriesModal = openCategoriesModal;
window.showConfirmationModal = showConfirmationModal;
window.showLoadingModal = showLoadingModal;
window.modalSystem = modalSystem;

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModals);
} else {
    setTimeout(initModals, 0);
}
