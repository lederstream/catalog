import { formatCurrency, truncateText } from '../utils.js';

// Crear tarjeta de producto
export const createProductCard = (product) => {
    if (!product) {
        console.error('Producto no definido en createProductCard');
        return '';
    }

    // Manejar imagen con fallback
    const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
    
    // Obtener nombre de categoría
    const categoryName = getCategoryName(product);
    
    // Generar HTML de planes
    let plansHTML = '';
    if (Array.isArray(product.plans) && product.plans.length > 0) {
        plansHTML = product.plans.map(plan => `
            <div class="border-t border-gray-100 pt-2 mt-2 first:border-t-0 first:mt-0 first:pt-0">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">${plan.name || 'Plan sin nombre'}</span>
                    <div class="flex flex-col items-end">
                        ${plan.price_soles ? `<span class="text-sm font-bold text-green-600">S/ ${formatCurrency(plan.price_soles)}</span>` : ''}
                        ${plan.price_dollars ? `<span class="text-xs font-bold text-blue-600">$ ${formatCurrency(plan.price_dollars)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        plansHTML = '<span class="text-gray-500 text-sm">No hay planes disponibles</span>';
    }
    
    // Truncar descripción si es muy larga
    const description = truncateText(product.description || 'Sin descripción', 120);
    
    return `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col" data-product-id="${product.id}">
            <div class="h-48 bg-gray-100 overflow-hidden">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
            </div>
            <div class="p-4 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-800 flex-1 mr-2">${product.name || 'Producto sin nombre'}</h3>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap">${categoryName}</span>
                </div>
                <p class="text-gray-600 text-sm mb-4 flex-1">${description}</p>
                <div class="mb-4">
                    <h4 class="font-medium text-gray-700 text-sm mb-2">Planes y precios:</h4>
                    <div class="space-y-1">
                        ${plansHTML}
                    </div>
                </div>
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 view-details-btn flex items-center justify-center" 
                        data-product-id="${product.id}">
                    <i class="fas fa-eye mr-2"></i>
                    Ver detalles
                </button>
            </div>
        </div>
    `;
};

// Helper para obtener nombre de categoría
function getCategoryName(product) {
    if (product.categories && product.categories.name) {
        return product.categories.name;
    }
    if (product.category_id && typeof window.getCategories === 'function') {
        try {
            const categories = window.getCategories();
            if (categories && Array.isArray(categories)) {
                const category = categories.find(cat => cat.id == product.category_id);
                return category ? category.name : `Categoría ${product.category_id}`;
            }
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
        }
    }
    if (product.category) {
        return product.category;
    }
    return 'Sin categoría';
}

// Renderizar grid de productos
export const renderProductsGrid = (products, containerId) => {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Contenedor con ID ${containerId} no encontrado`);
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600">No se encontraron productos</p>
                <p class="text-sm text-gray-500 mt-1">Intenta con otros filtros o categorías</p>
            </div>
        `;
        return;
    }
    
    try {
        container.innerHTML = products.map(product => createProductCard(product)).join('');
        addProductCardEventListeners();
    } catch (error) {
        console.error('Error al renderizar productos:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                <p class="text-gray-600">Error al cargar los productos</p>
                <p class="text-sm text-gray-500 mt-1">Por favor, recarga la página</p>
            </div>
        `;
    }
};

// Añadir event listeners a las tarjetas
const addProductCardEventListeners = () => {
    // Botones de ver detalles
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.currentTarget.getAttribute('data-product-id');
            if (productId && typeof window.showProductDetails === 'function') {
                window.showProductDetails(productId);
            }
        });
    });
};

// Mostrar detalles del producto (modal)
export const showProductDetails = (productId) => {
    try {
        // Obtener el producto completo
        let product;
        if (typeof window.getProductById === 'function') {
            product = window.getProductById(productId);
        }
        
        if (!product) {
            console.error('Producto no encontrado:', productId);
            return;
        }
        
        // Crear y mostrar modal de detalles
        showProductModal(product);
        
    } catch (error) {
        console.error('Error al mostrar detalles:', error);
        if (typeof window.showError === 'function') {
            window.showError('Error al cargar los detalles del producto');
        }
    }
};

// Función para mostrar modal de detalles
const showProductModal = (product) => {
    // Obtener nombre de categoría
    const categoryName = getCategoryName(product);
    
    // Generar HTML de planes
    let plansHTML = '';
    if (Array.isArray(product.plans) && product.plans.length > 0) {
        plansHTML = product.plans.map(plan => `
            <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                <span class="font-medium">${plan.name}</span>
                <div class="text-right">
                    ${plan.price_soles ? `<div class="text-green-600 font-bold">S/ ${formatCurrency(plan.price_soles)}</div>` : ''}
                    ${plan.price_dollars ? `<div class="text-blue-600 text-sm">$ ${formatCurrency(plan.price_dollars)}</div>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        plansHTML = '<p class="text-gray-500 py-4 text-center">No hay planes disponibles</p>';
    }
    
    // Crear modal
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${product.name || 'Producto sin nombre'}</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            ${categoryName}
                        </span>
                    </div>
                    
                    <img src="${product.photo_url || 'https://via.placeholder.com/500x300?text=Imagen+no+disponible'}" 
                         alt="${product.name}" 
                         class="w-full h-64 object-cover rounded-lg mb-4"
                         onerror="this.src='https://via.placeholder.com/500x300?text=Imagen+no+disponible'">
                    
                    <div class="mb-4">
                        <h3 class="font-semibold text-gray-800 mb-2">Descripción:</h3>
                        <p class="text-gray-600">${product.description || 'Sin descripción disponible'}</p>
                    </div>
                    
                    <div class="mb-4">
                        <h3 class="font-semibold text-gray-800 mb-2">Planes y precios:</h3>
                        <div class="space-y-2">
                            ${plansHTML}
                        </div>
                    </div>
                    
                    <div class="flex justify-end mt-6">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg close-modal">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al documento
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Agregar event listeners para cerrar el modal
    const closeModal = () => {
        if (modalContainer.parentNode) {
            document.body.removeChild(modalContainer);
        }
    };
    
    modalContainer.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });
    
    // Cerrar con tecla Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    
    document.addEventListener('keydown', handleEscape);
};

// Exportar función de renderizado para compatibilidad
export const renderProductCard = (product) => {
    return createProductCard(product);
};

// Hacer funciones disponibles globalmente
window.showProductDetails = showProductDetails;
