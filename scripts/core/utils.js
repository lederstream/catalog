// scripts/components/product-card.js
import { Utils } from '../core/utils.js';

// Configuración
const CONFIG = {
    IMAGE_PLACEHOLDER: 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'
};

// Crear tarjeta de producto
export function createProductCard(product, isListView = false, index = 0) {
    const plans = Utils.safeParseJSON(product.plans);
    const minPrice = getProductMinPrice(product);
    const categoryName = getCategoryName(product);
    const imageUrl = product.photo_url || CONFIG.IMAGE_PLACEHOLDER;
    
    if (isListView) {
        return createListView(product, plans, minPrice, categoryName, imageUrl, index);
    } else {
        return createGridView(product, plans, minPrice, categoryName, imageUrl, index);
    }
}

function createGridView(product, plans, minPrice, categoryName, imageUrl, index) {
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 fade-in-up will-change-transform product-card" style="animation-delay: ${index * 0.05}s" data-id="${product.id}">
            <div class="relative overflow-hidden">
                <img 
                    src="${imageUrl}" 
                    alt="${product.name}"
                    class="w-full h-48 object-cover product-image transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}';this.onerror=null;"
                >
                ${minPrice !== Infinity ? `
                    <div class="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-lg">
                        ${Utils.formatCurrency(minPrice)}
                    </div>
                ` : ''}
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-1 text-gray-800 line-clamp-1">${product.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${categoryName}</p>
                <p class="text-gray-500 text-sm mb-3 line-clamp-2">${product.description || 'Sin descripción'}</p>
                <div class="flex justify-between items-center">
                    <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium text-sm" data-product-id="${product.id}">
                        Ver detalles
                    </button>
                    ${plans.length > 1 ? `
                        <span class="text-xs text-gray-500">${plans.length} planes</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function createListView(product, plans, minPrice, categoryName, imageUrl, index) {
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 fade-in-up will-change-transform product-card" style="animation-delay: ${index * 0.05}s" data-id="${product.id}">
            <div class="flex">
                <div class="flex-shrink-0 w-32 md:w-48">
                    <img 
                        src="${imageUrl}" 
                        alt="${product.name}"
                        class="w-full h-full object-cover product-image"
                        loading="lazy"
                        onerror="this.src='${CONFIG.IMAGE_PLACEHOLDER}';this.onerror=null;"
                    >
                </div>
                <div class="p-4 flex-1">
                    <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                        <div class="flex-1">
                            <h3 class="font-semibold text-lg text-gray-800">${product.name}</h3>
                            <p class="text-sm text-gray-600 mb-1">${categoryName}</p>
                            <p class="text-gray-500 text-sm mb-2">${product.description || 'Sin descripción'}</p>
                        </div>
                        ${minPrice !== Infinity ? `
                            <div class="text-blue-600 font-bold text-lg">
                                ${Utils.formatCurrency(minPrice)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex justify-between items-center mt-3">
                        <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium text-sm" data-product-id="${product.id}">
                            Ver detalles y planes
                        </button>
                        ${plans.length > 1 ? `
                            <span class="text-xs text-gray-500">${plans.length} planes disponibles</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Obtener precio mínimo de un producto
export function getProductMinPrice(product) {
    if (!product.plans || !product.plans.length) return Infinity;
    
    const plans = Utils.safeParseJSON(product.plans);
    if (!plans.length) return Infinity;
    
    return Math.min(...plans.map(plan => 
        Math.min(
            plan.price_soles || Infinity,
            plan.price_dollars || Infinity
        )
    ).filter(price => price > 0));
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
            const productId = btn.dataset.productId;
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
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}
