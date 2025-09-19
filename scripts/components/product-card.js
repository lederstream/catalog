import { Utils } from '../core/utils.js';

export class ProductCard {
    static create(product, isAdmin = false) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 product-card';
        
        const categoryColor = product.categories ? product.categories.color : '#3B82F6';
        const categoryName = product.categories ? product.categories.name : 'Sin categoría';
        
        const plansHtml = this.renderPlans(product.plans);
        
        card.innerHTML = `
            <div class="relative">
                <img src="${Utils.getSafeImageUrl(product.photo_url)}" alt="${product.name}" 
                     class="w-full h-48 object-cover" onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+no+disponible'">
                <span class="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded-full" 
                      style="background-color: ${categoryColor}">
                    ${categoryName}
                </span>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2 line-clamp-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${product.description}</p>
                
                <div class="mb-4 product-plans-container">
                    ${plansHtml}
                </div>
                
                ${isAdmin ? this.renderAdminActions(product) : ''}
            </div>
        `;
        
        return card;
    }

    static renderPlans(plans) {
        let parsedPlans = [];
        
        try {
            if (typeof plans === 'string') {
                parsedPlans = JSON.parse(plans);
            } else if (Array.isArray(plans)) {
                parsedPlans = plans;
            } else if (plans && typeof plans === 'object') {
                parsedPlans = Object.values(plans);
            }
        } catch (error) {
            console.error('Error parsing plans:', error);
            parsedPlans = [];
        }
        
        if (!parsedPlans || parsedPlans.length === 0) {
            return '<p class="text-gray-500 text-sm">No hay planes disponibles</p>';
        }
        
        // Generar ID único para este acordeón
        const accordionId = `plans-accordion-${Math.random().toString(36).substr(2, 9)}`;
        
        let html = `
            <div class="space-y-3" id="${accordionId}">
                <h4 class="font-medium text-sm text-gray-700 mb-2">Planes disponibles:</h4>
        `;
        
        // Mostrar primeros 2 planes
        parsedPlans.slice(0, 2).forEach(plan => {
            html += this.renderPlanItem(plan);
        });
        
        // Si hay más de 2 planes, mostrar botón y planes ocultos
        if (parsedPlans.length > 2) {
            html += `
                <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <button type="button" class="text-blue-600 text-sm font-medium view-more-plans-btn"
                            onclick="togglePlansAccordion('${accordionId}')">
                        +${parsedPlans.length - 2} planes más disponibles
                        <i class="fas fa-chevron-down ml-1"></i>
                    </button>
                </div>
                
                <div class="additional-plans hidden space-y-3">
            `;
            
            // Mostrar planes restantes
            parsedPlans.slice(2).forEach(plan => {
                html += this.renderPlanItem(plan);
            });
            
            html += `</div>`;
        }
        
        html += '</div>';
        return html;
    }

    static renderPlanItem(plan) {
        const priceSoles = typeof plan.price_soles === 'number' ? plan.price_soles : parseFloat(plan.price_soles || 0);
        const priceDollars = typeof plan.price_dollars === 'number' ? plan.price_dollars : parseFloat(plan.price_dollars || 0);
        
        return `
            <div class="bg-gray-50 rounded-lg p-3 plan-item">
                <div class="flex justify-between items-start mb-2">
                    <span class="font-medium text-sm">${plan.name}</span>
                    <div class="text-right">
                        ${priceSoles > 0 ? `<div class="font-semibold text-green-600">${Utils.formatCurrency(priceSoles, 'PEN')}</div>` : ''}
                        ${priceDollars > 0 ? `<div class="text-xs text-gray-500">${Utils.formatCurrency(priceDollars, 'USD')}</div>` : ''}
                    </div>
                </div>
                ${plan.features && plan.features.length > 0 ? `
                    <div class="text-xs text-gray-600">
                        <span class="font-medium">Incluye:</span> ${plan.features.join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    static renderAdminActions(product) {
        return `
            <div class="flex justify-between pt-3 border-t">
                <button class="edit-product text-blue-600 hover:text-blue-800 text-sm font-medium" data-id="${product.id}">
                    <i class="fas fa-edit mr-1"></i> Editar
                </button>
                <button class="delete-product text-red-600 hover:text-red-800 text-sm font-medium" data-id="${product.id}">
                    <i class="fas fa-trash mr-1"></i> Eliminar
                </button>
            </div>
        `;
    }
}

// Función global para toggle del acordeón
window.togglePlansAccordion = function(accordionId) {
    const container = document.getElementById(accordionId);
    if (!container) return;
    
    const additionalPlans = container.querySelector('.additional-plans');
    const viewMoreBtn = container.querySelector('.view-more-plans-btn');
    const icon = viewMoreBtn.querySelector('i');
    
    if (additionalPlans.classList.contains('hidden')) {
        additionalPlans.classList.remove('hidden');
        viewMoreBtn.innerHTML = `Ocultar planes <i class="fas fa-chevron-up ml-1"></i>`;
        additionalPlans.style.animation = 'fadeIn 0.3s ease-in-out';
    } else {
        additionalPlans.classList.add('hidden');
        viewMoreBtn.innerHTML = `+${additionalPlans.querySelectorAll('.plan-item').length} planes más disponibles <i class="fas fa-chevron-down ml-1"></i>`;
    }
};
