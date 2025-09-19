import { Utils } from '../core/utils.js';

export class ProductCard {
    static create(product, isAdmin = false) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 product-card';
        
        const categoryColor = product.categories ? product.categories.color : '#3B82F6';
        const categoryName = product.categories ? product.categories.name : 'Sin categoría';
        
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
                
                <div class="mb-4">
                    ${this.renderPlans(product.plans)}
                </div>
                
                ${isAdmin ? this.renderAdminActions(product) : ''}
            </div>
        `;
        
        return card;
    }

    static renderPlans(plans) {
        let parsedPlans = [];
        
        try {
            // Intentar parsear los planes de diferentes formas
            if (typeof plans === 'string') {
                parsedPlans = JSON.parse(plans);
            } else if (Array.isArray(plans)) {
                parsedPlans = plans;
            } else if (plans && typeof plans === 'object') {
                // Si es un objeto, convertirlo a array
                parsedPlans = Object.values(plans);
            }
        } catch (error) {
            console.error('Error parsing plans:', error);
            parsedPlans = [];
        }
        
        if (!parsedPlans || parsedPlans.length === 0) {
            return '<p class="text-gray-500 text-sm">No hay planes disponibles</p>';
        }
        
        let html = `
            <div class="space-y-3">
                <h4 class="font-medium text-sm text-gray-700 mb-2">Planes disponibles:</h4>
        `;
        
        parsedPlans.forEach((plan, index) => {
            const priceSoles = typeof plan.price_soles === 'number' ? plan.price_soles : parseFloat(plan.price_soles || 0);
            const priceDollars = typeof plan.price_dollars === 'number' ? plan.price_dollars : parseFloat(plan.price_dollars || 0);
            
            // Mostrar solo los primeros 3 planes, el resto en acordeón
            if (index < 3) {
                html += `
                    <div class="bg-gray-50 rounded-lg p-3">
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
        });
        
        // Mostrar más planes si hay más de 3
        if (parsedPlans.length > 3) {
            html += `
                <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <button class="text-blue-600 text-sm font-medium view-more-plans" 
                            onclick="this.closest('.product-card').querySelector('.additional-plans').classList.toggle('hidden'); this.classList.add('hidden');">
                        +${parsedPlans.length - 3} planes más disponibles
                        <i class="fas fa-chevron-down ml-1"></i>
                    </button>
                </div>
                
                <div class="additional-plans hidden space-y-3">
            `;
            
            parsedPlans.slice(3).forEach(plan => {
                const priceSoles = typeof plan.price_soles === 'number' ? plan.price_soles : parseFloat(plan.price_soles || 0);
                const priceDollars = typeof plan.price_dollars === 'number' ? plan.price_dollars : parseFloat(plan.price_dollars || 0);
                
                html += `
                    <div class="bg-gray-50 rounded-lg p-3">
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
            });
            
            html += `</div>`;
        }
        
        html += '</div>';
        return html;
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
