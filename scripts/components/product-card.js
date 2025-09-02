// scripts/components/product-card.js
import { formatCurrency, truncateText, lazyLoadImages, showNotification } from '../utils.js';

// Crear tarjeta de producto
export const createProductCard = (product) => {
    if (!product) {
        console.error('Producto no definido en createProductCard');
        return '';
    }

    // Manejar imagen con fallback y lazy loading
    const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
    
    // Obtener nombre de categoría
    const categoryName = getCategoryName(product);
    
    // Generar HTML de planes
    let plansHTML = '';
    if (Array.isArray(product.plans) && product.plans.length > 0) {
        // Mostrar máximo 3 planes inicialmente
        const visiblePlans = product.plans.slice(0, 3);
        const hiddenPlansCount = product.plans.length - 3;
        
        plansHTML = visiblePlans.map(plan => `
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
        
        if (hiddenPlansCount > 0) {
            plansHTML += `<div class="text-xs text-gray-500 mt-2">+${hiddenPlansCount} plan(s) más</div>`;
        }
    } else {
        plansHTML = '<span class="text-gray-500 text-sm">No hay planes disponibles</span>';
    }
    
    // Truncar descripción si es muy larga
    const description = truncateText(product.description || 'Sin descripción', 120);
    
    return `
        <div class="product-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group opacity-0 transform translate-y-6" data-product-id="${product.id}">
            <div class="h-48 bg-gray-100 overflow-hidden relative">
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <img src="https://via.placeholder.com/300x200?text=Cargando..." 
                     data-src="${imageUrl}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen';this.onerror=null;">
                <div class="absolute top-3 right-3 z-20">
                    <span class="px-3 py-1 bg-blue-600 text-white text-xs rounded-full shadow-lg">${categoryName}</span>
                </div>
                <div class="absolute bottom-3 left-3 z-20">
                    ${product.plans && product.plans.length > 0 ? `
                        <div class="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                            ${product.plans[0].price_soles > 0 ? `
                                <span class="text-green-600 font-bold text-sm">S/ ${formatCurrency(product.plans[0].price_soles)}</span>
                            ` : ''}
                            ${product.plans[0].price_soles > 0 && product.plans[0].price_dollars > 0 ? '<span class="text-gray-400 mx-1">|</span>' : ''}
                            ${product.plans[0].price_dollars > 0 ? `
                                <span class="text-blue-600 text-sm">$ ${formatCurrency(product.plans[0].price_dollars)}</span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200" title="${product.name || 'Producto sin nombre'}">${product.name || 'Producto sin nombre'}</h3>
                <p class="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">${description}</p>
                <div class="mb-4">
                    <h4 class="font-medium text-gray-700 text-sm mb-2 flex items-center">
                        <i class="fas fa-list-alt mr-2 text-blue-500"></i>Planes disponibles:
                    </h4>
                    <div class="space-y-1">
                        ${plansHTML}
                    </div>
                </div>
                <button class="view-details-btn w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center group/btn" 
                        data-product-id="${product.id}"
                        aria-label="Ver detalles de ${product.name}">
                    <i class="fas fa-eye mr-2 group-hover/btn:animate-pulse"></i>
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
            <div class="col-span-full text-center py-12 animate-fade-in">
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
        
        // Configurar lazy loading para imágenes
        const images = container.querySelectorAll('img[data-src]');
        if (images.length > 0) {
            lazyLoadImages(images);
        }
        
        // Animar la entrada de las tarjetas
        animateProductCards();
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

// Animación de entrada para las tarjetas de producto
function animateProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Añadir event listeners a las tarjetas
const addProductCardEventListeners = () => {
    // Botones de ver detalles
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.currentTarget.getAttribute('data-product-id');
            
            // Efecto de clic
            e.currentTarget.classList.add('scale-95');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-95');
            }, 150);
            
            if (productId && typeof window.showProductDetails === 'function') {
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
                    // Efecto de clic en la tarjeta
                    card.classList.add('scale-95');
                    setTimeout(() => {
                        card.classList.remove('scale-95');
                        window.showProductDetails(productId);
                    }, 150);
                }
            });
        });
    }
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
            showNotification('Producto no encontrado', 'error');
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
            <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 group/plan hover:bg-gray-50 rounded-lg px-2 transition-colors duration-200">
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
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 opacity-0 transition-opacity duration-300" id="productDetailModal">
            <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-300 shadow-2xl">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${product.name || 'Producto sin nombre'}</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700 text-xl transition-all duration-200 transform hover:rotate-90 hover:scale-110 p-1 rounded-full hover:bg-gray-100" aria-label="Cerrar modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm inline-flex items-center">
                            <i class="fas fa-tag mr-1 text-xs"></i> ${categoryName}
                        </span>
                    </div>
                    
                    <div class="h-64 bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                        <img src="${product.photo_url || 'https://via.placeholder.com/500x300?text=Imagen+no+disponible'}" 
                             alt="${product.name}" 
                             class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                             onerror="this.src='https://via.placeholder.com/500x300?text=Imagen+no+disponible';this.onerror=null;">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <a href="${product.photo_url}" target="_blank" class="text-white text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-black/70 transition-colors duration-200">
                                <i class="fas fa-external-link-alt mr-1"></i> Ver imagen completa
                            </a>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h3 class="font-semibold text-gray-800 mb-2 flex items-center">
                            <i class="fas fa-align-left mr-2 text-blue-500"></i>Descripción:
                        </h3>
                        <p class="text-gray-600">${product.description || 'Sin descripción disponible'}</p>
                    </div>
                    
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-800 mb-2 flex items-center">
                            <i class="fas fa-list-alt mr-2 text-blue-500"></i>Planes y precios:
                        </h3>
                        <div class="space-y-2">
                            ${plansHTML}
                        </div>
                    </div>
                    
                    <div class="flex justify-end mt-6">
                        <button class="close-modal bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center shadow-md hover:shadow-lg">
                            <i class="fas fa-times mr-2"></i>
                            Cerrar
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
    
    // Animación de entrada
    setTimeout(() => {
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        }
    }, 10);
    
    // Agregar event listeners para cerrar el modal
    const closeModal = () => {
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                if (modalContainer.parentNode) {
                    document.body.removeChild(modalContainer);
                }
            }, 300);
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
    
    // Enfocar el modal para accesibilidad
    modalContainer.querySelector('.close-modal')?.focus();
};

// Exportar función de renderizado para compatibilidad
export const renderProductCard = createProductCard;

// Hacer funciones disponibles globalmente
window.showProductDetails = showProductDetails;
window.renderProductCard = renderProductCard;
