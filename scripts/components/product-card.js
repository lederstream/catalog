// scripts/components/product-card.js

import { formatCurrency, truncateText, showNotification, showError } from '../utils.js';

// Crear tarjeta de producto
export const createProductCard = (product) => {
    if (!product) {
        console.error('Producto no definido en createProductCard');
        return '';
    }

    // Manejar imagen con fallback
    const imageUrl = product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen';
    
    // Generar HTML de planes
    let plansHTML = '';
    if (Array.isArray(product.plans) && product.plans.length > 0) {
        plansHTML = product.plans.map(plan => `
            <div class="border-t border-gray-100 pt-2 mt-2 first:border-t-0 first:mt-0 first:pt-0">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">${plan.name || 'Plan sin nombre'}</span>
                    <div class="flex flex-col items-end">
                        <span class="text-sm font-bold text-green-600">${formatCurrency(plan.price_soles || 0, 'PEN')}</span>
                        <span class="text-xs font-bold text-blue-600">${formatCurrency(plan.price_dollars || 0, 'USD')}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        plansHTML = '<span class="text-gray-500 text-sm">No hay planes disponibles</span>';
    }
    
    // Manejar categoría
    const category = product.category || 'Sin categoría';
    
    // Truncar descripción si es muy larga
    const description = truncateText(product.description || 'Sin descripción', 120);
    
    return `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col" data-product-id="${product.id}">
            <div class="h-48 bg-gray-100 overflow-hidden">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
            </div>
            <div class="p-4 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-800 flex-1 mr-2">${product.name || 'Producto sin nombre'}</h3>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap">${category}</span>
                </div>
                <p class="text-gray-600 text-sm mb-4 flex-1">${description}</p>
                <div class="mb-4">
                    <h4 class="font-medium text-gray-700 text-sm mb-2">Planes y precios:</h4>
                    <div class="space-y-1">
                        ${plansHTML}
                    </div>
                </div>
                <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 view-details-btn flex items-center justify-center" 
                        data-product-id="${product.id}">
                    <i class="fas fa-eye mr-2"></i>
                    Ver detalles
                </button>
            </div>
        </div>
    `;
};

// Renderizar grid de productos
export const renderProductsGrid = (products, containerId) => {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Contenedor con ID ${containerId} no encontrado`);
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
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

// Añadir event listeners a las tarjetas
const addProductCardEventListeners = () => {
    // Botones de ver detalles
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.currentTarget.getAttribute('data-product-id');
            if (productId) {
                showProductDetails(productId);
            }
        });
    });
    
    // Click en toda la tarjeta (opcional)
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar que se active cuando se hace click en el botón
            if (!e.target.closest('.view-details-btn')) {
                const productId = card.getAttribute('data-product-id');
                if (productId) {
                    showProductDetails(productId);
                }
            }
        });
    });
};

// Mostrar detalles del producto (modal)
const showProductDetails = async (productId) => {
    try {
        // Aquí puedes implementar la lógica para obtener los detalles completos
        // Por ahora, mostramos una notificación
        showNotification(`Mostrando detalles del producto #${productId}`, 'info');
        
        // Puedes implementar un modal aquí:
        // openProductModal(productId);
        
        console.log('Detalles del producto:', productId);
        
    } catch (error) {
        console.error('Error al mostrar detalles:', error);
        showError('Error al cargar los detalles del producto');
    }
};

// Función para crear modal de detalles (puedes implementarla después)
export const openProductModal = (product) => {
    // Implementación del modal de detalles
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${product.name}</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <img src="${product.photo_url || 'https://via.placeholder.com/500x300'}" 
                         alt="${product.name}" 
                         class="w-full h-64 object-cover rounded-lg mb-4"
                         onerror="this.src='https://via.placeholder.com/500x300?text=Imagen+no+disponible'">
                    <p class="text-gray-600 mb-4">${product.description || 'Sin descripción'}</p>
                    <div class="mb-4">
                        <h3 class="font-semibold text-gray-800 mb-2">Planes y precios:</h3>
                        ${Array.isArray(product.plans) ? product.plans.map(plan => `
                            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                <span class="font-medium">${plan.name}</span>
                                <div class="text-right">
                                    <div class="text-green-600 font-bold">${formatCurrency(plan.price_soles, 'PEN')}</div>
                                    <div class="text-blue-600 text-sm">${formatCurrency(plan.price_dollars, 'USD')}</div>
                                </div>
                            </div>
                        `).join('') : '<p class="text-gray-500">No hay planes disponibles</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Aquí iría la lógica para crear y mostrar el modal
};

// Exportar función de renderizado para compatibilidad
export const renderProductCard = (product) => {
    return createProductCard(product);
};

// Utilidad para animar la aparición de tarjetas
export const animateProductCards = () => {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
};

// Filtrado de productos
export const filterProducts = (products, filters = {}) => {
    if (!products) return [];
    
    return products.filter(product => {
        // Filtro por categoría
        if (filters.category && filters.category !== 'all') {
            if (product.category !== filters.category) return false;
        }
        
        // Filtro por búsqueda
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            const matchesName = product.name?.toLowerCase().includes(searchTerm);
            const matchesDescription = product.description?.toLowerCase().includes(searchTerm);
            const matchesCategory = product.category?.toLowerCase().includes(searchTerm);
            
            if (!matchesName && !matchesDescription && !matchesCategory) return false;
        }
        
        // Filtro por precio
        if (filters.minPrice || filters.maxPrice) {
            const hasValidPlan = product.plans?.some(plan => {
                const price = plan.price_soles || plan.price_dollars || 0;
                if (filters.minPrice && price < filters.minPrice) return false;
                if (filters.maxPrice && price > filters.maxPrice) return false;
                return true;
            });
            
            if (!hasValidPlan) return false;
        }
        
        return true;
    });
};

// Ordenar productos
export const sortProducts = (products, sortBy = 'name', direction = 'asc') => {
    if (!products) return [];
    
    return [...products].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'price':
                aValue = Math.min(...(a.plans?.map(plan => plan.price_soles) || [0]));
                bValue = Math.min(...(b.plans?.map(plan => plan.price_soles) || [0]));
                break;
            case 'category':
                aValue = a.category || '';
                bValue = b.category || '';
                break;
            case 'name':
            default:
                aValue = a.name || '';
                bValue = b.name || '';
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};
