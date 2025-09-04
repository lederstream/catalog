// scripts/products.js - CORREGIDO Y MEJORADO
import { supabase } from './supabase.js';
import { showNotification, formatCurrency } from './utils.js';

let products = [];

export async function loadProducts() {
    try {
        console.log('📦 Cargando productos desde Supabase...');
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (*),
                plans (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === 'PGRST204' || error.code === '42P01') {
                console.warn('Tabla products no existe');
                products = [];
                return products;
            }
            throw error;
        }

        products = data || [];
        console.log(`✅ ${products.length} productos cargados`);
        return products;
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showNotification('Error al cargar productos', 'error');
        return [];
    }
}

export function getProducts() {
    return products;
}

export function getProductById(id) {
    return products.find(product => product.id == id);
}

export function filterProducts(category = 'all', search = '') {
    let filtered = [...products];

    if (category !== 'all') {
        filtered = filtered.filter(product => product.category_id == category);
    }

    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.categories && product.categories.name.toLowerCase().includes(searchLower))
        );
    }

    return filtered;
}

export function renderProductsGrid(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor ${containerId} no encontrado`);
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
                <p class="text-gray-500">Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
            <img src="${product.photo_url || 'https://via.placeholder.com/300x200'}" 
                 alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-lg font-semibold">${product.name}</h3>
                <p class="text-gray-600">${product.description || 'Sin descripción'}</p>
                <div class="mt-2 text-blue-600 font-bold">
                    ${formatCurrency(getProductMinPrice(product))}
                </div>
            </div>
        </div>
    `).join('');
}

function getProductMinPrice(product) {
    if (!product.plans || product.plans.length === 0) return 0;
    const prices = product.plans.map(plan => 
        Math.min(
            plan.price_soles || Infinity,
            plan.price_dollars || Infinity
        )
    ).filter(price => price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
}
