// scripts/components/product-card.js
import { Utils } from '../utils.js';

// Crear tarjeta de producto
export const createProductCard = (product, isListView = false, index = 0) => {
    if (!product) return '';

    const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
    const categoryName = getCategoryName(product);
    const minPrice = getProductMinPrice(product);
    
    if (isListView) {
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
                        <h3 class="text-xl font-semibold text-gray-800" title="${product.name}">
                            ${Utils.truncateText(product.name, 60)}
                        </h3>
                    </div>
                    
                    <p class="text-gray-600 mb-4 flex-1">
                        ${Utils.truncateText(product.description || 'Sin descripción', 120)}
                    </p>
                    
                    <div class="flex justify-between items-center mt-auto">
                        <div class="text-lg font-bold text-blue-600">
                            Desde ${Utils.formatCurrency(minPrice)}
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
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2" title="${product.name}">
                        ${Utils.truncateText(product.name, 50)}
                    </h3>
                    <p class="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                        ${Utils.truncateText(product.description || 'Sin descripción', 100)}
                    </p>
                    
                    <div class="mb-4">
                        <div class="text-sm text-gray-500 mb-1">Desde:</div>
                        <div class="text-xl font-bold text-blue-600">
                            ${Utils.formatCurrency(minPrice)}
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

// Obtener precio mínimo de un producto
export function getProductMinPrice(product) {
    if (!product.plans?.length) return 0;
    
    const prices = product.plans.map(plan => 
        Math.min(
            plan.price_soles || Infinity,
            plan.price_dollars || Infinity
        )
    ).filter(price => price > 0);
    
    return prices.length ? Math.min(...prices) : 0;
}

// Helper para obtener nombre de categoría
export function getCategoryName(product) {
    if (product.categories?.name) return product.categories.name;
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
    return product.category || 'General';
}

// Añadir event listeners a las tarjetas
export const addProductCardEventListeners = () => {
    // Usar event delegation para manejar clicks dinámicos
    document.addEventListener('click', function(e) {
        const viewDetailsBtn = e.target.closest('.view-details-btn');
        if (viewDetailsBtn) {
            handleViewDetailsClick(e, viewDetailsBtn);
            return;
        }
        
        // Click en tarjeta para móviles
        if (window.innerWidth < 768) {
            const productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('button, a')) {
                handleProductCardClick(e, productCard);
            }
        }
    });
};

function handleViewDetailsClick(e, button) {
    e.preventDefault();
    e.stopPropagation();
    
    const productId = button.getAttribute('data-product-id');
    if (productId && typeof window.showProductDetails === 'function') {
        button.classList.add('scale-95');
        setTimeout(() => button.classList.remove('scale-95'), 150);
        window.showProductDetails(productId);
    }
}

function handleProductCardClick(e, card) {
    const productId = card.getAttribute('data-product-id');
    if (productId && typeof window.showProductDetails === 'function') {
        window.showProductDetails(productId);
    }
}

// Animación de entrada de productos
export const animateProductsEntry = () => {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        }, index * 50);
    });
};

// Mostrar detalles del producto
export const showProductDetails = (productId) => {
    try {
        const product = typeof window.getProductById === 'function' 
            ? window.getProductById(productId) 
            : null;
        
        if (!product) {
            Utils.showError('❌ Producto no encontrado');
            return;
        }
        
        showProductModal(product);
        
    } catch (error) {
        console.error('Error al mostrar detalles:', error);
        Utils.showError('❌ Error al cargar los detalles del producto');
    }
};

// Función para mostrar modal de detalles
const showProductModal = (product) => {
    const categoryName = getCategoryName(product);
    const plansHTML = generatePlansHTML(product.plans);
    
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
    
    removeExistingModal();
    const modalContainer = createModalContainer(modalHTML);
    setupModalEventListeners(modalContainer);
};

function generatePlansHTML(plans) {
    if (!plans?.length) {
        return '<p class="text-gray-500 py-4 text-center">No hay planes disponibles</p>';
    }
    
    return plans.map(plan => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div>
                <span class="font-medium">${plan.name}</span>
                ${plan.features?.length ? `
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
}

function removeExistingModal() {
    const existingModal = document.getElementById('productDetailModal');
    if (existingModal) existingModal.remove();
}

function createModalContainer(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    Utils.fadeIn(container.querySelector('#productDetailModal'));
    return container;
}

function setupModalEventListeners(container) {
    const closeModal = () => Utils.fadeOut(container.querySelector('#productDetailModal')).then(() => container.remove());
    
    container.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
    container.addEventListener('click', (e) => { if (e.target === container) closeModal(); });
    
    const contactBtn = container.querySelector('.contact-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => Utils.showInfo('📧 Función de contacto habilitada próximamente'));
    }
    
    const handleEscape = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handleEscape);
    
    setTimeout(() => {
        const closeBtn = container.querySelector('.close-modal');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

// Hacer funciones disponibles globalmente
window.showProductDetails = showProductDetails;
