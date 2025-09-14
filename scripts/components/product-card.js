// scripts/components/product-card.js
import { Utils } from '../core/utils.js';

export function createProductCard(product, isListView = false, index = 0) {
  const minPrice = window.productManager?.getProductMinPrice(product) || Infinity;
  const categoryName = window.categoryManager?.getCategoryName(product.category_id) || 'General';
  const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
  const plans = Utils.safeParseJSON(product.plans);
  const hasMultiplePlans = plans && plans.length > 1;
  const animationDelay = index * 0.05;
  
  if (isListView) {
    return `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 fade-in" 
           style="animation-delay: ${animationDelay}s" data-id="${product.id}">
        <div class="flex flex-col md:flex-row">
          <div class="relative flex-shrink-0 w-full md:w-48 h-48 md:h-auto">
            <img src="${imageUrl}" alt="${Utils.escapeHtml(product.name)}" 
                 class="w-full h-full object-cover" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
            <div class="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              ${Utils.escapeHtml(categoryName)}
            </div>
          </div>
          <div class="p-5 flex-1 flex flex-col">
            <div class="flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-gray-800 text-xl line-clamp-1" title="${Utils.escapeHtml(product.name)}">
                  ${Utils.escapeHtml(product.name)}
                </h3>
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-md ml-4 whitespace-nowrap">
                  ${Utils.formatCurrency(minPrice)}
                </div>
              </div>
              <p class="text-gray-500 mb-3 line-clamp-2" title="${Utils.escapeHtml(product.description || 'Sin descripción')}">
                ${Utils.escapeHtml(product.description || 'Sin descripción')}
              </p>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-gray-100">
              <div class="flex items-center space-x-4">
                ${hasMultiplePlans ? `
                  <span class="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                    <i class="fas fa-copy mr-1"></i>${plans.length} planes
                  </span>
                ` : `
                  <span class="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                    <i class="fas fa-check-circle mr-1"></i>Plan único
                  </span>
                `}
              </div>
              <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 flex items-center" 
                      data-product-id="${product.id}">
                Ver detalles
                <i class="fas fa-chevron-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 fade-in product-card group" 
           style="animation-delay: ${animationDelay}s" data-id="${product.id}">
        <div class="relative overflow-hidden h-48 bg-gray-100">
          <img src="${imageUrl}" alt="${Utils.escapeHtml(product.name)}" 
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
          <div class="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            ${Utils.escapeHtml(categoryName)}
          </div>
          <div class="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
            ${Utils.formatCurrency(minPrice)}
          </div>
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button class="view-details-btn bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" 
                    data-product-id="${product.id}">
              Ver detalles
            </button>
          </div>
        </div>
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-gray-800 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors duration-200" title="${Utils.escapeHtml(product.name)}">
              ${Utils.escapeHtml(product.name)}
            </h3>
            ${hasMultiplePlans ? `
              <span class="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ml-2">
                ${plans.length} planes
              </span>
            ` : ''}
          </div>
          <p class="text-gray-500 text-sm mb-3 line-clamp-2" title="${Utils.escapeHtml(product.description || 'Sin descripción')}">
            ${Utils.escapeHtml(product.description || 'Sin descripción')}
          </p>
          <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <div class="flex items-center text-sm text-gray-500">
              <i class="fas fa-file-invoice mr-1"></i>
              ${hasMultiplePlans ? 'Múltiples planes' : 'Plan único'}
            </div>
            <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center" 
                    data-product-id="${product.id}">
              Detalles
              <i class="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

export function addProductCardEventListeners() {
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      if (productId && typeof window.showProductDetails === 'function') {
        window.showProductDetails(productId);
      }
    });
  });
  
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      const productId = card.dataset.id;
      if (productId && typeof window.showProductDetails === 'function') {
        window.showProductDetails(productId);
      }
    });
  });
}

export function animateProductsEntry() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  
  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
}
