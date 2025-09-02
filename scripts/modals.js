// scripts/modals.js
import { showNotification, debounce } from './utils.js';

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

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            closeImageSearchModal();
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    imageSearchModal.addEventListener('click', (e) => {
        if (e.target === imageSearchModal) {
            closeImageSearchModal();
        }
    });

    // Modal de categorías
    if (closeCategoriesModal) {
        closeCategoriesModal.addEventListener('click', () => {
            closeCategoriesModalFunc();
        });
    }

    categoriesModal.addEventListener('click', (e) => {
        if (e.target === categoriesModal) {
            closeCategoriesModalFunc();
        }
    });
    
    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!imageSearchModal.classList.contains('hidden')) {
                closeImageSearchModal();
            }
            if (!categoriesModal.classList.contains('hidden')) {
                closeCategoriesModalFunc();
            }
        }
    });
}

// Abrir modal de búsqueda de imágenes con animación
export function openImageSearchModal() {
    imageSearchModal.classList.remove('hidden');
    setTimeout(() => {
        imageSearchModal.classList.remove('opacity-0');
        imageSearchModal.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
    imageSearchQuery.value = '';
    imageSearchResults.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Realiza una búsqueda para ver resultados</p>';
    imageSearchQuery.focus();
}

// Cerrar modal de búsqueda de imágenes con animación
function closeImageSearchModal() {
    imageSearchModal.classList.add('opacity-0');
    imageSearchModal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => {
        imageSearchModal.classList.add('hidden');
    }, 300);
}

// Buscar imágenes (usando Unsplash API como ejemplo)
async function searchImages() {
    const query = imageSearchQuery.value.trim();
    if (!query) return;

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
        // En una implementación real, aquí harías una llamada a la API de Unsplash, Pexels, etc.
        // Por ahora, simularemos una respuesta con imágenes de placeholder
        setTimeout(() => {
            // Simular resultados de búsqueda
            const simulatedResults = [
                { id: 1, url: `https://source.unsplash.com/300x200/?${query}`, alt: query },
                { id: 2, url: `https://source.unsplash.com/300x201/?${query}`, alt: query },
                { id: 3, url: `https://source.unsplash.com/300x202/?${query}`, alt: query },
                { id: 4, url: `https://source.unsplash.com/300x203/?${query}`, alt: query },
                { id: 5, url: `https://source.unsplash.com/300x204/?${query}`, alt: query },
                { id: 6, url: `https://source.unsplash.com/300x205/?${query}`, alt: query },
                { id: 7, url: `https://source.unsplash.com/300x206/?${query}`, alt: query },
                { id: 8, url: `https://source.unsplash.com/300x207/?${query}`, alt: query }
            ];

            renderImageResults(simulatedResults);
        }, 1500);
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
            document.getElementById('photo_url').value = url;
            updateImagePreview(url);
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
                    <img src="${url}" alt="Vista previa" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
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
    categoriesModal.classList.remove('hidden');
    setTimeout(() => {
        categoriesModal.classList.remove('opacity-0');
        categoriesModal.querySelector('.modal-content').classList.remove('scale-95');
    }, 10);
    newCategoryName.value = '';
    newCategoryName.focus();
}

// Cerrar modal de categorías con animación
function closeCategoriesModalFunc() {
    categoriesModal.classList.add('opacity-0');
    categoriesModal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => {
        categoriesModal.classList.add('hidden');
    }, 300);
}

// Inicializar funcionalidad de categorías
export function initCategories(renderCategoriesCallback) {
    if (addCategoryBtn) {
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

            // Esta función debería ser proporcionada por el módulo que llama
            if (renderCategoriesCallback) {
                await renderCategoriesCallback(name);
                newCategoryName.value = '';
                
                // Restaurar botón
                addCategoryBtn.innerHTML = originalHtml;
                addCategoryBtn.disabled = false;
            }
        });
    }

    if (newCategoryName) {
        newCategoryName.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const name = newCategoryName.value.trim();
                if (!name) return;

                // Animación de carga
                const originalHtml = addCategoryBtn.innerHTML;
                addCategoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                addCategoryBtn.disabled = true;

                // Esta función debería ser proporcionada por el módulo que llama
                if (renderCategoriesCallback) {
                    await renderCategoriesCallback(name);
                    newCategoryName.value = '';
                    
                    // Restaurar botón
                    addCategoryBtn.innerHTML = originalHtml;
                    addCategoryBtn.disabled = false;
                }
            }
        });
    }
}
