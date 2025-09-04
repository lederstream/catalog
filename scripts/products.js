// scripts/products.js
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

// NUEVA: Función para renderizar grid de productos
export function renderProductsGrid(products, containerId) {
    // Implementación consistente
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Usar la función createProductCard del mismo archivo
    container.innerHTML = products.map(product => 
        createProductCard(product)
    ).join('');
}

// Función auxiliar interna
function createProductCard(product) {
    // Implementación simple y consistente
    return `
        <div class="product-card">
            <img src="${product.photo_url}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
        </div>
    `;
}

// Función auxiliar para obtener precio mínimo
function getProductMinPrice(product) {
    if (!product.plans || product.plans.length === 0) return 0;
    return Math.min(...product.plans.map(plan => plan.price_soles || Infinity));
}

// Hacer funciones disponibles globalmente
window.loadProducts = loadProducts;
window.getProducts = getProducts;
window.getProductById = getProductById;
window.filterProducts = filterProducts;
window.renderProductsGrid = renderProductsGrid;
