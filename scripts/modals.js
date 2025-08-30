// scripts/modals.js
import { showNotification } from './utils.js';

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
            imageSearchModal.classList.add('hidden');
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    imageSearchModal.addEventListener('click', (e) => {
        if (e.target === imageSearchModal) {
            imageSearchModal.classList.add('hidden');
        }
    });

    // Modal de categorías
    if (closeCategoriesModal) {
        closeCategoriesModal.addEventListener('click', () => {
            categoriesModal.classList.add('hidden');
        });
    }

    categoriesModal.addEventListener('click', (e) => {
        if (e.target === categoriesModal) {
            categoriesModal.classList.add('hidden');
        }
    });
}

// Abrir modal de búsqueda de imágenes
export function openImageSearchModal() {
    imageSearchModal.classList.remove('hidden');
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
        <div class="relative group">
            <img src="${image.url}" alt="${image.alt}" class="w-full h-32 object-cover rounded-lg cursor-pointer">
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <button class="select-image bg-white text-black px-3 py-1 rounded text-sm" data-url="${image.url}">
                    Seleccionar
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners a los botones de selección
    imageSearchResults.querySelectorAll('.select-image').forEach(button => {
        button.addEventListener('click', (e) => {
            const url = e.currentTarget.dataset.url;
            document.getElementById('photo_url').value = url;
            updateImagePreview(url);
            imageSearchModal.classList.add('hidden');
            showNotification('Imagen seleccionada correctamente', 'success');
        });
    });
}

// Actualizar vista previa de imagen
export function updateImagePreview(url) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;

    if (url && url.trim() !== '') {
        preview.innerHTML = `<img src="${url}" alt="Vista previa" class="w-full h-full object-contain">`;
    } else {
        preview.innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
    }
}

// Abrir modal de categorías
export function openCategoriesModal() {
    categoriesModal.classList.remove('hidden');
    newCategoryName.value = '';
    newCategoryName.focus();
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

            // Esta función debería ser proporcionada por el módulo que llama
            if (renderCategoriesCallback) {
                await renderCategoriesCallback(name);
                newCategoryName.value = '';
            }
        });
    }

    if (newCategoryName) {
        newCategoryName.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const name = newCategoryName.value.trim();
                if (!name) return;

                // Esta función debería ser proporcionada por el módulo que llama
                if (renderCategoriesCallback) {
                    await renderCategoriesCallback(name);
                    newCategoryName.value = '';
                }
            }
        });
    }
}