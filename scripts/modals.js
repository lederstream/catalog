// scripts/modals.js
import { Utils } from './utils.js';

// Sistema de modales
class ModalSystem {
    constructor() {
        this.currentModal = null;
        this.modalStack = [];
        this.init();
    }
    
    static getInstance() {
        if (!ModalSystem.instance) {
            ModalSystem.instance = new ModalSystem();
        }
        return ModalSystem.instance;
    }
    
    init() {
        console.log('🔲 Inicializando sistema de modales...');
        this.setupGlobalEventListeners();
    }
    
    setupGlobalEventListeners() {
        // Cerrar modal al hacer clic fuera del contenido
        document.addEventListener('click', (e) => {
            if (this.currentModal && e.target === this.currentModal) {
                this.closeCurrentModal();
            }
        });
        
        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeCurrentModal();
            }
        });
    }
    
    // Modal de confirmación
    showConfirmationModal(options = {}) {
        const {
            title = 'Confirmar acción',
            message = '¿Estás seguro de que deseas continuar?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'info',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;
        
        const modalId = 'confirmationModal';
        this.createModal({
            id: modalId,
            title,
            content: `
                <div class="space-y-4">
                    <p class="text-gray-600">${message}</p>
                    <div class="flex space-x-3 justify-end pt-4">
                        <button class="cancel-btn px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            ${cancelText}
                        </button>
                        <button class="confirm-btn px-4 py-2 ${this.getButtonClass(type)} text-white rounded-lg hover:opacity-90 transition-colors">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `,
            onShow: (modal) => {
                const confirmBtn = modal.querySelector('.confirm-btn');
                const cancelBtn = modal.querySelector('.cancel-btn');
                
                confirmBtn.addEventListener('click', () => {
                    onConfirm();
                    this.closeModal(modalId);
                });
                
                cancelBtn.addEventListener('click', () => {
                    onCancel();
                    this.closeModal(modalId);
                });
            }
        });
    }
    
    // Modal de categorías
    openCategoriesModal() {
        const modalId = 'categoriesModal';
        this.createModal({
            id: modalId,
            title: 'Gestión de Categorías',
            size: 'lg',
            content: `
                <div class="centered">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-800 mb-3">Agregar nueva categoría</h3>
                        <form id="categoryForm" class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" name="name" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                Agregar Categoría
                            </button>
                        </form>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-800 mb-3">Categorías existentes</h3>
                        <div id="categoriesList" class="bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                            <!-- Las categorías se cargarán aquí -->
                        </div>
                    </div>
                </div>
            `,
            onShow: (modal) => {
                // Configurar formulario
                const form = modal.querySelector('#categoryForm');
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    
                    const categoryData = {
                        name: formData.get('name'),
                    };
                    
                    if (typeof window.addCategory === 'function') {
                        const success = await window.addCategory(categoryData);
                        if (success) {
                            form.reset();
                            // Recargar lista de categorías
                            if (typeof window.renderCategoriesList === 'function') {
                                const categoriesList = modal.querySelector('#categoriesList');
                                window.renderCategoriesList(categoriesList);
                            }
                        }
                    }
                });
                
                // Cargar categorías
                if (typeof window.renderCategoriesList === 'function') {
                    const categoriesList = modal.querySelector('#categoriesList');
                    window.renderCategoriesList(categoriesList);
                }
            }
        });
    }
    
    // Modal de búsqueda de imágenes
    openImageSearchModal() {
        const modalId = 'imageSearchModal';
        this.createModal({
            id: modalId,
            title: 'Buscar Imagen',
            size: 'xl',
            content: `
                <div class="space-y-4">
                    <div class="flex space-x-2">
                        <input type="text" placeholder="Buscar imágenes..." 
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                        <div class="image-option cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                            <img src="https://via.placeholder.com/150?text=Imagen+1" class="w-full h-24 object-cover">
                        </div>
                        <div class="image-option cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                            <img src="https://via.placeholder.com/150?text=Imagen+2" class="w-full h-24 object-cover">
                        </div>
                        <div class="image-option cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                            <img src="https://via.placeholder.com/150?text=Imagen+3" class="w-full h-24 object-cover">
                        </div>
                        <div class="image-option cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                            <img src="https://via.placeholder.com/150?text=Imagen+4" class="w-full h-24 object-cover">
                        </div>
                        <div class="image-option cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                            <img src="https://via.placeholder.com/150?text=Imagen+5" class="w-full h-24 object-cover">
                        </div>
                        <div class="image-option cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden">
                            <img src="https://via.placeholder.com/150?text=Imagen+6" class="w-full h-24 object-cover">
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">O ingresa una URL personalizada:</p>
                        <div class="flex space-x-2 mt-2">
                            <input type="url" placeholder="https://ejemplo.com/imagen.jpg" 
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                Usar URL
                            </button>
                        </div>
                    </div>
                </div>
            `,
            onShow: (modal) => {
                // Configurar selección de imágenes
                const imageOptions = modal.querySelectorAll('.image-option');
                imageOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        const img = option.querySelector('img');
                        if (img && typeof window.updateImagePreview === 'function') {
                            window.updateImagePreview(img.src);
                            this.closeModal(modalId);
                        }
                    });
                });
                
                // Configurar URL personalizada
                const urlInput = modal.querySelector('input[type="url"]');
                const urlButton = modal.querySelector('.bg-green-600');
                urlButton.addEventListener('click', () => {
                    if (urlInput.value && typeof window.updateImagePreview === 'function') {
                        window.updateImagePreview(urlInput.value);
                        this.closeModal(modalId);
                    }
                });
            }
        });
    }
    
    // Crear modal genérico
    createModal(options = {}) {
        const {
            id = `modal-${Date.now()}`,
            title = 'Modal',
            content = '',
            size = 'md',
            onShow = () => {},
            onClose = () => {}
        } = options;
        
        // Eliminar modal existente si hay uno
        this.closeCurrentModal();
        
        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-full mx-4'
        };
        
        const modalHTML = `
            <div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-container">
                <div class="bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden">
                    <div class="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                        <button class="close-modal text-gray-400 hover:text-gray-600 text-xl transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement);
        
        const modal = modalElement.querySelector(`#${id}`);
        this.currentModal = modal;
        this.modalStack.push(modal);
        
        // Configurar evento de cierre
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.closeModal(id));
        
        // Animación de entrada
        Utils.fadeIn(modal);
        
        // Ejecutar callback de mostrar
        onShow(modal);
        
        return modal;
    }
    
    // Cerrar modal específico
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            Utils.fadeOut(modal).then(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                this.modalStack = this.modalStack.filter(m => m.id !== modalId);
                if (this.modalStack.length > 0) {
                    this.currentModal = this.modalStack[this.modalStack.length - 1];
                } else {
                    this.currentModal = null;
                }
            });
        }
    }
    
    // Cerrar modal actual
    closeCurrentModal() {
        if (this.currentModal) {
            this.closeModal(this.currentModal.id);
        }
    }
    
    // Obtener clase de botón según tipo
    getButtonClass(type) {
        const classes = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            warning: 'bg-yellow-600',
            danger: 'bg-red-600',
            primary: 'bg-blue-600'
        };
        return classes[type] || classes.info;
    }
}

// Inicializar sistema de modales
export function initModals() {
    return ModalSystem.getInstance();
}

// Funciones de conveniencia para uso global
export function showConfirmationModal(options) {
    const modalSystem = ModalSystem.getInstance();
    return modalSystem.showConfirmationModal(options);
}

export function openCategoriesModal() {
    const modalSystem = ModalSystem.getInstance();
    return modalSystem.openCategoriesModal();
}

export function openImageSearchModal() {
    const modalSystem = ModalSystem.getInstance();
    return modalSystem.openImageSearchModal();
}

// Hacer funciones disponibles globalmente
window.showConfirmationModal = showConfirmationModal;
window.openCategoriesModal = openCategoriesModal;
window.openImageSearchModal = openImageSearchModal;
window.initModals = initModals;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModals);
} else {
    setTimeout(initModals, 0);
}
