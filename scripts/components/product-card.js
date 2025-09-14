// scripts/components/product-card.js
import { Utils } from '../core/utils.js';

// Configuración
const CONFIG = {
    IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Imagen+no+disponible',
    CURRENCY_SYMBOL: 'S/'
};

// Crear tarjeta de producto
export function createProductCard(product, isListView = false, index = 0) {
    const plans = Utils.safeParseJSON(product.plans);
    const minPrice = getProductMinPrice(product, plans);
    const categoryName = getCategoryName(product);
    const imageUrl = product.photo_url || CONFIG.IMAGE_PLACEHOLDER;
    const hasMultiplePlans = plans && plans.length > 1;
    
    if (isListView) {
        return createListView(product, plans, minPrice, categoryName, imageUrl, index, hasMultiplePlans);
    } else {
        return createGridView(product, plans, minPrice, categoryName, imageUrl, index, hasMultiplePlans);
    }
}

function createGridView(product, plans, minPrice, categoryName, imageUrl, index, hasMultiplePlans) {
    const isPriceAvailable = minPrice !== Infinity;
    const animationDelay = index * 0.05;
    
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-up will-change-transform product-card group" 
             style="animation-delay: ${animationDelay}s" 
             data-id="${product.id}">
            
            <!-- Imagen del producto -->
            <div class="relative overflow-hidden h-48 bg-gray-100">
                <img 
                    src="${imageUrl}" 
                    alt="${product.name}"
                    class="w-full h-full object-cover product-image transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}';this.onerror=null;"
                />
                
                <!-- Badge de categoría -->
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    ${categoryName}
                </div>
                
                <!-- Badge de precio o etiqueta especial -->
                ${isPriceAvailable ? `
                    <div class="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                        ${Utils.formatCurrency(minPrice)}
                    </div>
                ` : `
                    <div class="absolute top-3 right-3 bg-gray-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
                        Consultar precio
                    </div>
                `}
                
                <!-- Overlay de hover -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button class="view-details-btn bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-blue-50" 
                            data-product-id="${product.id}">
                        Ver detalles
                    </button>
                </div>
            </div>
            
            <!-- Contenido de la tarjeta -->
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-gray-800 text-lg line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-200" title="${product.name}">
                        ${product.name}
                    </h3>
                    
                    ${hasMultiplePlans ? `
                        <span class="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ml-2">
                            ${plans.length} planes
                        </span>
                    ` : ''}
                </div>
                
                <p class="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed" title="${product.description || 'Sin descripción'}">
                    ${product.description || 'Sin descripción'}
                </p>
                
                <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        ${hasMultiplePlans ? 'Múltiples planes' : 'Plan único'}
                    </div>
                    
                    <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center group/btn" 
                            data-product-id="${product.id}">
                        Detalles
                        <svg class="w-4 h-4 ml-1 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createListView(product, plans, minPrice, categoryName, imageUrl, index, hasMultiplePlans) {
    const isPriceAvailable = minPrice !== Infinity;
    const animationDelay = index * 0.05;
    
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-up will-change-transform product-card group" 
             style="animation-delay: ${animationDelay}s" 
             data-id="${product.id}">
            
            <div class="flex flex-col md:flex-row">
                <!-- Imagen -->
                <div class="relative flex-shrink-0 w-full md:w-48 h-48 md:h-auto">
                    <img 
                        src="${imageUrl}" 
                        alt="${product.name}"
                        class="w-full h-full object-cover product-image"
                        loading="lazy"
                        onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}';this.onerror=null;"
                    />
                    
                    <!-- Badge de categoría -->
                    <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                        ${categoryName}
                    </div>
                </div>
                
                <!-- Contenido -->
                <div class="p-5 flex-1 flex flex-col">
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-gray-800 text-xl line-clamp-1 group-hover:text-blue-600 transition-colors duration-200" title="${product.name}">
                                ${product.name}
                            </h3>
                            
                            ${isPriceAvailable ? `
                                <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-md ml-4 whitespace-nowrap">
                                    ${Utils.formatCurrency(minPrice)}
                                </div>
                            ` : `
                                <div class="bg-gray-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md ml-4 whitespace-nowrap">
                                    Consultar precio
                                </div>
                            `}
                        </div>
                        
                        <p class="text-gray-500 mb-3 line-clamp-2 leading-relaxed" title="${product.description || 'Sin descripción'}">
                            ${product.description || 'Sin descripción'}
                        </p>
                    </div>
                    
                    <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div class="flex items-center space-x-4">
                            ${hasMultiplePlans ? `
                                <span class="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                    ${plans.length} planes disponibles
                                </span>
                            ` : `
                                <span class="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Plan único
                                </span>
                            `}
                        </div>
                        
                        <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center group/btn" 
                                data-product-id="${product.id}">
                            Ver detalles
                            <svg class="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
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
    
    // Filtrar precios válidos y encontrar el mínimo
    const validPrices = plans.flatMap(plan => [
        plan.price_soles || Infinity,
        plan.price_dollars ? plan.price_dollars * 3.7 : Infinity // Conversión aproximada a soles
    ]).filter(price => price > 0 && price !== Infinity);
    
    return validPrices.length ? Math.min(...validPrices) : Infinity;
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
    
    // Event listener para hacer clic en toda la tarjeta (excepto en los botones)
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // No activar si se hizo clic en un botón o enlace
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button, a')) {
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
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.fade-in-up').forEach(el => {
        // Estilos iniciales para la animación
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        observer.observe(el);
    });
}

// Función para formatear precios (si no existe en Utils)
if (typeof Utils.formatCurrency === 'undefined') {
    Utils.formatCurrency = (amount) => {
        if (amount === Infinity) return 'Consultar';
        return `S/ ${amount.toFixed(2)}`;
    };
}
