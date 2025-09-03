// scripts/components/product-card.js
import { 
    formatCurrency, 
    truncateText, 
    lazyLoadImages,
    fadeIn,
    fadeOut,
    smoothScrollTo
} from '../utils.js';

// Crear tarjeta de producto
export const createProductCard = (product, isListView = false, index = 0) => {
    if (!product) {
        console.error('Producto no definido en createProductCard');
        return '';
    }

    // Manejar imagen con fallback y lazy loading
    const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
    
    // Obtener nombre de categoría
    const categoryName = getCategoryName(product);
    
    // Obtener precio mínimo
    const minPrice = getProductMinPrice(product);
    
    if (isListView) {
        // Vista de lista
        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row opacity-0 transform translate-y-4" 
                 style="animation-delay: ${index * 50}ms"
                 data-product-id="${product.id}">
                <div class="md:w-48 h-48 bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    <img src="https://via.placeholder.com/192x192?text=Cargando..." 
                         data-src="${imageUrl}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/192x192?text=Error+imagen'">
                    <div class="absolute top-3 right-3">
                        <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            ${categoryName}
                        </span>
                    </div>
                </div>
                
                <div class="flex-1 p-6 flex flex-col">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-semibold text-gray-800" title="${product.name}">${truncateText(product.name, 60)}</h3>
                    </div>
                    
                    <p class="text-gray-600 mb-4 flex-1">${truncateText(product.description || 'Sin descripción', 120)}</p>
                    
                    <div class="mb-4">
                        <h4 class="font-medium text-gray-700 mb-2">Planes disponibles:</h4>
                        <div class="space-y-2">
                            ${renderPlansList(product.plans)}
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center mt-auto">
                        <div class="text-lg font-bold text-blue-600">
                            Desde ${formatCurrency(minPrice)}
                        </div>
                        <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center transform hover:scale-105 group/btn" 
                                data-product-id="${product.id}"
                                aria-label="Ver detalles de ${product.name}">
                            <i class="fas fa-eye mr-2 group-hover/btn:animate-bounce"></i>
                            Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Vista de grid
        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col opacity-0 transform translate-y-4 group" 
                 style="animation-delay: ${index * 50}ms"
                 data-product-id="${product.id}">
                <div class="h-48 bg-gray-100 overflow-hidden relative">
                    <img src="https://via.placeholder.com/300x200?text=Cargando..." 
                         data-src="${imageUrl}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                    <div class="absolute top-3 right-3">
                        <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            ${categoryName}
                        </span>
                    </div>
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                </div>
                
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2" title="${product.name}">${truncateText(product.name, 50)}</h3>
                    <p class="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">${truncateText(product.description || 'Sin descripción', 100)}</p>
                    
                    <div class="mb-4">
                        <div class="text-sm text-gray-500 mb-1">Desde:</div>
                        <div class="text-xl font-bold text-blue-600">
                            ${formatCurrency(minPrice)}
                        </div>
                    </div>
                    
                    <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center group/btn transform hover:scale-105" 
                            data-product-id="${product.id}"
                            aria-label="Ver detalles de ${product.name}">
                        <i class="fas fa-eye mr-2 group-hover/btn:animate-bounce"></i>
                        Ver detalles
                    </button>
                </div>
            </div>
        `;
    }
};

// Renderizar lista de planes
function renderPlansList(plans) {
    if (!plans || plans.length === 0) {
        return '<span class="text-gray-500 text-sm">No hay planes disponibles</span>';
    }
    
    // Mostrar máximo 3 planes
    const visiblePlans = plans.slice(0, 3);
    const hiddenPlansCount = plans.length - 3;
    
    return visiblePlans.map(plan => `
        <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
            <span class="text-sm font-medium">${plan.name}</span>
            <div class="text-right">
                ${plan.price_soles ? `<div class="text-green-600 font-bold">S/ ${plan.price_soles}</div>` : ''}
                ${plan.price_dollars ? `<div class="text-blue-600 text-sm">$ ${plan.price_dollars}</div>` : ''}
            </div>
        </div>
    `).join('') + (hiddenPlansCount > 0 ? 
        `<div class="text-xs text-gray-500 mt-1">+${hiddenPlansCount} plan(s) más</div>` : ''
    );
}

// Obtener precio mínimo de un producto
function getProductMinPrice(product) {
    if (!product.plans || product.plans.length === 0) return 0;
    
    const prices = product.plans.map(plan => 
        Math.min(
            plan.price_soles || Infinity,
            plan.price_dollars || Infinity
        )
    ).filter(price => price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
}

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
    return 'General';
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
            <div class="col-span-full text-center py-16 fade-in-up">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500">Intenta con otros términos de búsqueda o categorías</p>
            </div>
        `;
        return;
    }
    
    try {
        // Determinar si es vista de lista
        const isListView = container.classList.contains('list-view');
        const catalogState = window.CatalogState ? window.CatalogState.getInstance() : { currentView: 'grid' };
        const actualIsListView = isListView || catalogState.currentView === 'list';
        
        container.innerHTML = products.map((product, index) => 
            createProductCard(product, actualIsListView, index)
        ).join('');
        
        addProductCardEventListeners();
        
        // Configurar lazy loading para imágenes
        const images = container.querySelectorAll('img[data-src]');
        if (images.length > 0) {
            lazyLoadImages(images);
        }
        
        // Animación de entrada
        animateProductsEntry();
        
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
                // Efecto de clic
                btn.classList.add('scale-95');
                setTimeout(() => btn.classList.remove('scale-95'), 150);
                
                window.showProductDetails(productId);
            }
        });
    });
    
    // Hacer toda la tarjeta clickeable en móviles
    if (window.innerWidth < 768) {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // No activar si se hizo clic en un botón o enlace
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button, a')) {
                    return;
                }
                
                const productId = card.getAttribute('data-product-id');
                if (productId && typeof window.showProductDetails === 'function') {
                    window.showProductDetails(productId);
                }
            });
        });
    }
};

// Animación de entrada de productos
function animateProductsEntry() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        }, index * 50);
    });
}

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
            showNotification('❌ Producto no encontrado', 'error');
            return;
        }
        
        // Crear y mostrar modal de detalles
        showProductModal(product);
        
    } catch (error) {
        console.error('Error al mostrar detalles:', error);
        showNotification('❌ Error al cargar los detalles del producto', 'error');
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
                <div>
                    <span class="font-medium">${plan.name}</span>
                    ${plan.features && plan.features.length > 0 ? `
                        <div class="text-sm text-gray-500 mt-1">
                            <ul class="list-disc list-inside">
                                ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="text-right">
                    ${plan.price_soles ? `<div class="text-green-600 font-bold">S/ ${plan.price_soles}</div>` : ''}
                    ${plan.price_dollars ? `<div class="text-blue-600 text-sm">$ ${plan.price_dollars}</div>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        plansHTML = '<p class="text-gray-500 py-4 text-center">No hay planes disponibles</p>';
    }
    
    // Crear modal
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="productDetailModal">
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${product.name || 'Producto sin nombre'}</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700 text-xl transition-colors duration-200 transform hover:scale-110" aria-label="Cerrar modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            ${categoryName}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div class="h-64 lg:h-80 bg-gray-100 rounded-lg overflow-hidden">
                            <img src="${product.photo_url || 'https://via.placeholder.com/500x300?text=Imagen+no+disponible'}" 
                                 alt="${product.name}" 
                                 class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                 onerror="this.src='https://via.placeholder.com/500x300?text=Imagen+no+disponible'">
                        </div>
                        
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-2">Descripción:</h3>
                            <p class="text-gray-600 mb-6">${product.description || 'Sin descripción disponible'}</p>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-gray-800 mb-3">Planes y precios:</h3>
                                <div class="space-y-3">
                                    ${plansHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 close-modal flex items-center">
                            <i class="fas fa-times mr-2"></i>
                            Cerrar
                        </button>
                        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 contact-btn flex items-center transform hover:scale-105" 
                                data-product-id="${product.id}">
                            <i class="fas fa-envelope mr-2"></i>
                            Contactar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('productDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al documento
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Mostrar modal con animación
    const modal = modalContainer.querySelector('#productDetailModal');
    fadeIn(modal);
    
    // Agregar event listeners para cerrar el modal
    const closeModal = () => {
        fadeOut(modal).then(() => {
            if (modalContainer.parentNode) {
                document.body.removeChild(modalContainer);
            }
        });
    };
    
    modalContainer.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Botón de contactar
    const contactBtn = modalContainer.querySelector('.contact-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            showNotification('📧 Función de contacto habilitada próximamente', 'info');
        });
    }
    
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
    
    // Enfocar el modal para accesibilidad
    setTimeout(() => {
        const closeBtn = modalContainer.querySelector('.close-modal');
        if (closeBtn) closeBtn.focus();
    }, 100);
};

// Exportar función de renderizado para compatibilidad
export const renderProductCard = createProductCard;

// Hacer funciones disponibles globalmente
window.showProductDetails = showProductDetails;
window.renderProductCard = renderProductCard;
