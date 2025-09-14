// scripts/components/product-card.js
import { Utils } from '../core/utils.js';

// Configuración
const CONFIG = {
    IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Imagen+no+disponible',
    CURRENCY: 'PEN',
    ANIMATION_DELAY: 0.05,
    LAZY_LOAD_THRESHOLD: '100px'
};

// Crear tarjeta de producto
export function createProductCard(product, isListView = false, index = 0) {
    const plans = Utils.safeParseJSON(product.plans);
    const minPrice = getProductMinPrice(product, plans);
    const maxPrice = getProductMaxPrice(product, plans);
    const categoryName = getCategoryName(product);
    const imageUrl = product.photo_url || CONFIG.IMAGE_PLACEHOLDER;
    const hasMultiplePrices = minPrice !== maxPrice && maxPrice !== Infinity;
    const rating = product.rating || Math.random() * 2 + 3; // Random rating entre 3-5 si no existe
    const isNew = isProductNew(product.created_at);
    
    if (isListView) {
        return createListView(product, plans, minPrice, maxPrice, categoryName, imageUrl, rating, isNew, index);
    } else {
        return createGridView(product, plans, minPrice, maxPrice, categoryName, imageUrl, rating, isNew, index);
    }
}

function createGridView(product, plans, minPrice, maxPrice, categoryName, imageUrl, rating, isNew, index) {
    const hasMultiplePlans = plans.length > 1;
    const priceRange = hasMultiplePrices ? `${Utils.formatCurrency(minPrice)} - ${Utils.formatCurrency(maxPrice)}` : Utils.formatCurrency(minPrice);
    
    return `
        <div class="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 product-card fade-in-up will-change-transform" 
             style="animation-delay: ${index * CONFIG.ANIMATION_DELAY}s" 
             data-id="${product.id}"
             data-category="${product.category_id}">
            
            <!-- Image Container -->
            <div class="relative overflow-hidden aspect-w-16 aspect-h-10 bg-gray-100">
                <img 
                    src="${imageUrl}" 
                    alt="${product.name}"
                    class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}';this.onerror=null;"
                />
                
                <!-- Overlay Effects -->
                <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                
                <!-- Badges Container -->
                <div class="absolute top-3 left-3 flex flex-col items-start gap-2">
                    ${isNew ? `
                        <span class="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                            Nuevo
                        </span>
                    ` : ''}
                    
                    ${product.featured ? `
                        <span class="bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                            Destacado
                        </span>
                    ` : ''}
                </div>
                
                <!-- Price Badge -->
                ${minPrice !== Infinity ? `
                    <div class="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-blue-600 text-sm font-bold px-3 py-2 rounded-xl shadow-lg">
                        ${priceRange}
                    </div>
                ` : ''}
                
                <!-- Quick Actions Overlay -->
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                    <button class="view-details-btn bg-white text-blue-600 font-semibold px-6 py-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-blue-50" 
                            data-product-id="${product.id}">
                        Ver Detalles
                    </button>
                </div>
            </div>
            
            <!-- Content Container -->
            <div class="p-5">
                <!-- Category and Rating -->
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        ${categoryName}
                    </span>
                    
                    <div class="flex items-center gap-1">
                        <i class="fas fa-star text-yellow-400 text-xs"></i>
                        <span class="text-xs text-gray-600 font-medium">${rating.toFixed(1)}</span>
                    </div>
                </div>
                
                <!-- Product Name -->
                <h3 class="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                    ${product.name}
                </h3>
                
                <!-- Description -->
                <p class="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    ${product.description || 'Descripción no disponible'}
                </p>
                
                <!-- Features/Highlights -->
                ${product.highlights ? `
                    <div class="mb-4">
                        <ul class="text-xs text-gray-500 space-y-1">
                            ${product.highlights.slice(0, 2).map(highlight => `
                                <li class="flex items-center">
                                    <i class="fas fa-check-circle text-green-500 mr-2 text-xs"></i>
                                    ${highlight}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <!-- Footer -->
                <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center group/details" 
                            data-product-id="${product.id}">
                        <span>Más información</span>
                        <i class="fas fa-arrow-right ml-2 text-xs transform group-hover/details:translate-x-1 transition-transform duration-200"></i>
                    </button>
                    
                    ${hasMultiplePlans ? `
                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            ${plans.length} planes
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createListView(product, plans, minPrice, maxPrice, categoryName, imageUrl, rating, isNew, index) {
    const hasMultiplePrices = minPrice !== maxPrice && maxPrice !== Infinity;
    const priceRange = hasMultiplePrices ? `${Utils.formatCurrency(minPrice)} - ${Utils.formatCurrency(maxPrice)}` : Utils.formatCurrency(minPrice);
    
    return `
        <div class="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 product-card fade-in-up will-change-transform" 
             style="animation-delay: ${index * CONFIG.ANIMATION_DELAY}s" 
             data-id="${product.id}"
             data-category="${product.category_id}">
            
            <div class="flex flex-col md:flex-row">
                <!-- Image Section -->
                <div class="md:w-1/3 lg:w-1/4 relative">
                    <div class="relative aspect-w-16 aspect-h-9 bg-gray-100">
                        <img 
                            src="${imageUrl}" 
                            alt="${product.name}"
                            class="w-full h-full object-cover"
                            loading="lazy"
                            onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}';this.onerror=null;"
                        />
                        
                        <!-- Badges -->
                        <div class="absolute top-3 left-3 flex flex-col items-start gap-2">
                            ${isNew ? `
                                <span class="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                    Nuevo
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Content Section -->
                <div class="flex-1 p-6">
                    <div class="flex flex-col h-full">
                        <!-- Header -->
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-2 inline-block">
                                    ${categoryName}
                                </span>
                                
                                <h3 class="font-semibold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                                    ${product.name}
                                </h3>
                                
                                <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                                    ${product.description || 'Descripción no disponible'}
                                </p>
                            </div>
                            
                            <!-- Price Desktop -->
                            ${minPrice !== Infinity ? `
                                <div class="hidden md:block text-right ml-6">
                                    <div class="text-2xl font-bold text-blue-600">${priceRange}</div>
                                    ${plans.length > 1 ? `
                                        <span class="text-xs text-gray-500">Desde</span>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Features -->
                        ${product.highlights ? `
                            <div class="mb-4">
                                <ul class="text-sm text-gray-600 grid grid-cols-2 gap-2">
                                    ${product.highlights.slice(0, 4).map(highlight => `
                                        <li class="flex items-center">
                                            <i class="fas fa-check-circle text-green-500 mr-2 text-xs"></i>
                                            ${highlight}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <!-- Footer -->
                        <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                            <div class="flex items-center gap-4">
                                <!-- Rating -->
                                <div class="flex items-center gap-1">
                                    <i class="fas fa-star text-yellow-400"></i>
                                    <span class="text-sm text-gray-600 font-medium">${rating.toFixed(1)}</span>
                                </div>
                                
                                <!-- Plans Count -->
                                ${plans.length > 1 ? `
                                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        ${plans.length} planes disponibles
                                    </span>
                                ` : ''}
                            </div>
                            
                            <div class="flex items-center gap-3">
                                <!-- Price Mobile -->
                                ${minPrice !== Infinity ? `
                                    <div class="md:hidden text-right">
                                        <div class="text-lg font-bold text-blue-600">${priceRange}</div>
                                    </div>
                                ` : ''}
                                
                                <button class="view-details-btn bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center group/details" 
                                        data-product-id="${product.id}">
                                    <span>Ver planes</span>
                                    <i class="fas fa-arrow-right ml-2 text-xs transform group-hover/details:translate-x-1 transition-transform duration-200"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Obtener precio mínimo de un producto
function getProductMinPrice(product, plans = null) {
    if (!plans) {
        plans = Utils.safeParseJSON(product.plans);
    }
    
    if (!plans || !plans.length) return Infinity;
    
    const prices = plans.flatMap(plan => [
        plan.price_soles || Infinity,
        plan.price_dollars || Infinity
    ]).filter(price => price > 0 && price !== Infinity);
    
    return prices.length ? Math.min(...prices) : Infinity;
}

// Obtener precio máximo de un producto
function getProductMaxPrice(product, plans = null) {
    if (!plans) {
        plans = Utils.safeParseJSON(product.plans);
    }
    
    if (!plans || !plans.length) return Infinity;
    
    const prices = plans.flatMap(plan => [
        plan.price_soles || 0,
        plan.price_dollars || 0
    ]).filter(price => price > 0);
    
    return prices.length ? Math.max(...prices) : Infinity;
}

// Obtener nombre de categoría
function getCategoryName(product) {
    if (product.categories?.name) return product.categories.name;
    if (product.category_id && window.categoryManager) {
        try {
            const category = window.categoryManager.getCategoryById(product.category_id);
            return category?.name || `Categoría ${product.category_id}`;
        } catch (error) {
            console.error('Error obteniendo categoría:', error);
        }
    }
    return product.category || 'General';
}

// Verificar si el producto es nuevo (menos de 30 días)
function isProductNew(createdAt) {
    if (!createdAt) return false;
    
    try {
        const createdDate = new Date(createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return createdDate > thirtyDaysAgo;
    } catch (error) {
        return false;
    }
}

// Añadir event listeners a las tarjetas de producto
export function addProductCardEventListeners() {
    // Event listeners para botones de ver detalles
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = btn.dataset.productId;
            if (productId && typeof window.showProductDetails === 'function') {
                window.showProductDetails(productId);
            }
        });
    });
    
    // Click en toda la tarjeta (excepto en botones)
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // No activar si se hizo click en un botón o enlace
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            
            const productId = card.dataset.id;
            if (productId && typeof window.showProductDetails === 'function') {
                window.showProductDetails(productId);
            }
        });
    });
}

// Animar entrada de productos
export function animateProductsEntry() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: CONFIG.LAZY_LOAD_THRESHOLD
    });
    
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

// Efecto de hover mejorado para tarjetas
export function enhanceCardHoverEffects() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px) scale(1.01)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Lazy loading mejorado para imágenes
export function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src') || img.src;
                
                if (src && src !== img.src) {
                    img.src = src;
                }
                
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: CONFIG.LAZY_LOAD_THRESHOLD
    });
    
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Inicializar todos los efectos
export function initProductCards() {
    addProductCardEventListeners();
    animateProductsEntry();
    enhanceCardHoverEffects();
    initLazyLoading();
}

// Exportar funciones de utilidad
export const ProductCardUtils = {
    getMinPrice: getProductMinPrice,
    getMaxPrice: getProductMaxPrice,
    getCategoryName,
    isProductNew
};
