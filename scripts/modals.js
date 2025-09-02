// scripts/modals.js - Modales mejorados y corregidos
import { showNotification, debounce } from './utils.js';

// Variables globales para modales
let imageSearchModal, imageSearchQuery, imageSearchResults, performSearch, closeModal;
let categoriesModal, newCategoryName, addCategoryBtn, categoriesList, closeCategoriesModal;

// Inicializar modales
export function initModals() {
    console.log('🔧 Inicializando modales...');
    
    // Modal de búsqueda de imágenes
    imageSearchModal = document.getElementById('imageSearchModal');
    imageSearchQuery = document.getElementById('imageSearchQuery');
    imageSearchResults = document.getElementById('imageSearchResults');
    performSearch = document.getElementById('performSearch');
    closeModal = document.getElementById('closeModal');

    // Modal de categorías
    categoriesModal = document.getElementById('categoriesModal');
    newCategoryName = document.getElementById('newCategoryName');
    addCategoryBtn = document.getElementById('addCategoryBtn');
    categoriesList = document.getElementById('categoriesList');
    closeCategoriesModal = document.getElementById('closeCategoriesModal');

    // Inicializar solo si los elementos existen
    if (performSearch && imageSearchQuery) {
        performSearch.addEventListener('click', searchImages);
        imageSearchQuery.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchImages();
            }
        });
    }

    if (closeModal && imageSearchModal) {
        closeModal.addEventListener('click', closeImageSearchModal);
        imageSearchModal.addEventListener('click', (e) => {
            if (e.target === imageSearchModal) {
                closeImageSearchModal();
            }
        });
    }

    if (closeCategoriesModal && categoriesModal) {
        closeCategoriesModal.addEventListener('click', closeCategoriesModalFunc);
        categoriesModal.addEventListener('click', (e) => {
            if (e.target === categoriesModal) {
                closeCategoriesModalFunc();
            }
        });
    }
    
    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (imageSearchModal && !imageSearchModal.classList.contains('hidden')) {
                closeImageSearchModal();
            }
            if (categoriesModal && !categoriesModal.classList.contains('hidden')) {
                closeCategoriesModalFunc();
            }
        }
    });
    
    console.log('✅ Modales inicializados correctamente');
}

// Abrir modal de búsqueda de imágenes con animación
export function openImageSearchModal() {
    if (!imageSearchModal) {
        console.error('Modal de búsqueda de imágenes no encontrado');
        return;
    }
    
    imageSearchModal.classList.remove('hidden');
    setTimeout(() => {
        imageSearchModal.classList.remove('opacity-0');
        const modalContent = imageSearchModal.querySelector('.modal-content');
        if (modalContent) modalContent.classList.remove('scale-95');
    }, 10);
    
    if (imageSearchQuery) {
        imageSearchQuery.value = '';
        imageSearchQuery.focus();
    }
    
    if (imageSearchResults) {
        imageSearchResults.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Realiza una búsqueda para ver resultados</p>';
    }
}

// Cerrar modal de búsqueda de imágenes con animación
function closeImageSearchModal() {
    if (!imageSearchModal) return;
    
    imageSearchModal.classList.add('opacity-0');
    const modalContent = imageSearchModal.querySelector('.modal-content');
    if (modalContent) modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        imageSearchModal.classList.add('hidden');
    }, 300);
}

// Buscar imágenes (usando Unsplash API como ejemplo)
async function searchImages() {
    if (!imageSearchQuery || !imageSearchResults) return;
    
    const query = imageSearchQuery.value.trim();
    if (!query) {
        showNotification('Ingresa un término de búsqueda', 'warning');
        return;
    }

    // Animación de carga
    imageSearchResults.innerHTML = `
        <div class="col-span-full text-center py-8">
            <div class="inline-flex items-center">
                <i class="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
                <span class="text-gray-500">Buscando imágenes...</span>
            </div>
        </div>
    `;

    try {
        // Simular resultados de búsqueda (en producción, usar API real)
        setTimeout(() => {
            const simulatedResults = [
                { id: 1, url: `https://source.unsplash.com/300x200/?${encodeURIComponent(query)}`, alt: query },
                { id: 2, url: `https://source.unsplash.com/300x201/?${encodeURIComponent(query)}`, alt: query },
                { id: 3, url: `https://source.unsplash.com/300x202/?${encodeURIComponent(query)}`, alt: query },
                { id: 4, url: `https://source.unsplash.com/300x203/?${encodeURIComponent(query)}`, alt: query },
                { id: 5, url: `https://source.unsplash.com/300x204/?${encodeURIComponent(query)}`, alt: query },
                { id: 6, url: `https://source.unsplash.com/300x205/?${encodeURIComponent(query)}`, alt: query }
            ];

            renderImageResults(simulatedResults);
        }, 1500);
    } catch (error) {
        console.error('Error al buscar imágenes:', error);
        if (imageSearchResults) {
            imageSearchResults.innerHTML = '<p class="text-red-500 col-span-full text-center py-8">Error al buscar imágenes. Intenta nuevamente.</p>';
        }
    }
}

// Renderizar resultados de búsqueda de imágenes
function renderImageResults(images) {
    if (!imageSearchResults) return;
    
    if (!images || images.length === 0) {
        imageSearchResults.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No se encontraron imágenes</p>';
        return;
    }

    imageSearchResults.innerHTML = images.map((image, index) => `
        <div class="relative group opacity-0 transform scale-95 transition-all duration-300" style="transition-delay: ${index * 50}ms">
            <img src="${image.url}" alt="${image.alt}" class="w-full h-32 object-cover rounded-lg cursor-pointer shadow-md group-hover:shadow-xl transition-all duration-300">
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg">
                <button class="select-image bg-white text-black px-4 py-2 rounded-lg font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-105 flex items-center" data-url="${image.url}">
                    <i class="fas fa-check mr-2"></i> Seleccionar
                </button>
            </div>
        </div>
    `).join('');

    // Animar la entrada de las imágenes
    setTimeout(() => {
        const imageElements = imageSearchResults.querySelectorAll('div');
        imageElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.remove('opacity-0', 'scale-95');
            }, index * 50);
        });
    }, 10);

    // Agregar event listeners a los botones de selección
    imageSearchResults.querySelectorAll('.select-image').forEach(button => {
        button.addEventListener('click', (e) => {
            const url = e.currentTarget.dataset.url;
            const photoUrlInput = document.getElementById('photo_url');
            if (photoUrlInput) {
                photoUrlInput.value = url;
                updateImagePreview(url);
            }
            closeImageSearchModal();
            showNotification('Imagen seleccionada correctamente', 'success');
        });
    });
}

// Actualizar vista previa de imagen
export function updateImagePreview(url) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;

    // Animación de desvanecimiento
    preview.style.opacity = '0';
    
    setTimeout(() => {
        if (url && url.trim() !== '') {
            preview.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                    <img src="${url}" alt="Vista previa" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                    <i class="fas fa-image text-3xl mb-2 opacity-50"></i>
                    <p class="text-sm">La imagen aparecerá aquí</p>
                </div>
            `;
        }
        
        // Restaurar opacidad con animación
        setTimeout(() => {
            preview.style.opacity = '1';
        }, 50);
    }, 300);
}

// Abrir modal de categorías con animación
export function openCategoriesModal() {
    if (!categoriesModal) {
        console.error('Modal de categorías no encontrado');
        return;
    }
    
    categoriesModal.classList.remove('hidden');
    setTimeout(() => {
        categoriesModal.classList.remove('opacity-0');
        const modalContent = categoriesModal.querySelector('.modal-content');
        if (modalContent) modalContent.classList.remove('scale-95');
    }, 10);
    
    if (newCategoryName) {
        newCategoryName.value = '';
        newCategoryName.focus();
    }
    
    // Cargar y renderizar categorías si existe la función
    if (typeof window.renderCategoriesList === 'function' && categoriesList) {
        window.renderCategoriesList(categoriesList);
    }
}

// Cerrar modal de categorías con animación
function closeCategoriesModalFunc() {
    if (!categoriesModal) return;
    
    categoriesModal.classList.add('opacity-0');
    const modalContent = categoriesModal.querySelector('.modal-content');
    if (modalContent) modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        categoriesModal.classList.add('hidden');
    }, 300);
}

// Inicializar funcionalidad de categorías
export function initCategories(renderCategoriesCallback) {
    if (!addCategoryBtn || !newCategoryName) {
        console.warn('Elementos de categorías no encontrados');
        return;
    }

    addCategoryBtn.addEventListener('click', async () => {
        const name = newCategoryName.value.trim();
        if (!name) {
            showNotification('El nombre de la categoría no puede estar vacío', 'error');
            return;
        }

        // Animación de carga
        const originalHtml = addCategoryBtn.innerHTML;
        addCategoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        addCategoryBtn.disabled = true;

        try {
            if (renderCategoriesCallback) {
                await renderCategoriesCallback(name);
                newCategoryName.value = '';
            }
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            showNotification('Error al agregar categoría', 'error');
        } finally {
            // Restaurar botón
            addCategoryBtn.innerHTML = originalHtml;
            addCategoryBtn.disabled = false;
        }
    });

    newCategoryName.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const name = newCategoryName.value.trim();
            if (!name) return;

            // Animación de carga
            const originalHtml = addCategoryBtn.innerHTML;
            addCategoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            addCategoryBtn.disabled = true;

            try {
                if (renderCategoriesCallback) {
                    await renderCategoriesCallback(name);
                    newCategoryName.value = '';
                }
            } catch (error) {
                console.error('Error al agregar categoría:', error);
                showNotification('Error al agregar categoría', 'error');
            } finally {
                // Restaurar botón
                addCategoryBtn.innerHTML = originalHtml;
                addCategoryBtn.disabled = false;
            }
        }
    });
}

// Hacer funciones disponibles globalmente
window.openImageSearchModal = openImageSearchModal;
window.openCategoriesModal = openCategoriesModal;
window.updateImagePreview = updateImagePreview;
