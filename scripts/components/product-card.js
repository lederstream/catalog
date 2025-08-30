import { formatCurrency } from '../utils.js';

export const createProductCard = (product) => {
    let plansHTML = '';
    if (Array.isArray(product.plans)) {
        plansHTML = product.plans.map(plan => `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm">${plan.name}</span>
                <div>
                    <span class="text-sm font-bold text-blue-600 mr-2">${formatCurrency(plan.price_soles, 'PEN')}</span>
                    <span class="text-sm font-bold text-green-600">${formatCurrency(plan.price_dollars, 'USD')}</span>
                </div>
            </div>
        `).join('');
    }
    
    return `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
            <img src="${product.photo_url}" alt="${product.name}" class="w-full h-48 object-cover" loading="lazy">
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-semibold text-gray-800">${product.name}</h3>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${product.category}</span>
                </div>
                <p class="text-gray-600 mb-4">${product.description}</p>
                <div class="mb-4">
                    <h4 class="font-medium text-gray-700 mb-2">Planes y precios:</h4>
                    ${plansHTML || '<span class="text-gray-500 text-sm">No especificado</span>'}
                </div>
                <button class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors view-details-btn" data-product-id="${product.id}">
                    Ver detalles
                </button>
            </div>
        </div>
    `;
};

export const renderProductsGrid = (products, containerId) => {
    const container = document.getElementById(containerId);
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600 col-span-full py-8">No se encontraron productos</p>';
        return;
    }
    
    container.innerHTML = products.map(product => createProductCard(product)).join('');
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-product-id');
            showProductDetails(productId);
        });
    });
};

const showProductDetails = (productId) => {
    // Implementar modal de detalles del producto
    console.log('Showing details for product:', productId);
};