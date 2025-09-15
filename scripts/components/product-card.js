// scripts/components/product-card.js
import { Utils } from '../core/utils.js';

export class ProductCard {
    static create(product, isAdmin = false) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300';
        
        // Get category color if available
        const categoryColor = product.categories ? product.categories.color : '#3B82F6';
        
        card.innerHTML = `
            <div class="relative">
                <img src="${product.photo_url}" alt="${product.name}" 
                     class="w-full h-48 object-cover">
                <span class="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded-full" 
                      style="background-color: ${categoryColor}">
                    ${product.categories ? product.categories.name : 'No category'}
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
        if (!plans || !Array.isArray(plans) || plans.length === 0) {
            return '<p class="text-gray-500 text-sm">No plans available</p>';
        }
        
        let html = '<div class="space-y-2">';
        
        plans.forEach(plan => {
            // Ensure prices are numbers
            const priceSoles = typeof plan.price_soles === 'number' ? plan.price_soles : parseFloat(plan.price_soles || 0);
            const priceDollars = typeof plan.price_dollars === 'number' ? plan.price_dollars : parseFloat(plan.price_dollars || 0);
            
            html += `
                <div class="flex justify-between items-center text-sm">
                    <span class="font-medium">${plan.name}</span>
                    <div class="text-right">
                        <div class="font-semibold">${Utils.formatCurrency(priceSoles, 'PEN')}</div>
                        <div class="text-gray-500">${Utils.formatCurrency(priceDollars, 'USD')}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    static renderAdminActions(product) {
        return `
            <div class="flex justify-between pt-3 border-t">
                <button class="edit-product text-blue-600 hover:text-blue-800" data-id="${product.id}">
                    <i class="fas fa-edit mr-1"></i> Edit
                </button>
                <button class="delete-product text-red-600 hover:text-red-800" data-id="${product.id}">
                    <i class="fas fa-trash mr-1"></i> Delete
                </button>
            </div>
        `;
    }
}
