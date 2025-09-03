// scripts/products.js - Versión corregida
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
                categories (*)
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

    // Filtrar por categoría
    if (category !== 'all') {
        filtered = filtered.filter(product => product.category_id == category);
    }

    // Filtrar por búsqueda
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower))
        );
    }

    return filtered;
}

// Función para formatear precios correctamente
export function formatProductPrices(product) {
    if (!product || !product.plans) return product;
    
    return {
        ...product,
        plans: product.plans.map(plan => ({
            ...plan,
            // Asegurar que los precios sean números
            price_soles: typeof plan.price_soles === 'string' ? 
                        parseFloat(plan.price_soles) || 0 : 
                        (plan.price_soles || 0),
            price_dollars: typeof plan.price_dollars === 'string' ? 
                          parseFloat(plan.price_dollars) || 0 : 
                          (plan.price_dollars || 0),
            // Formatear para visualización
            formatted_soles: formatCurrency(plan.price_soles || 0, 'PEN'),
            formatted_dollars: formatCurrency(plan.price_dollars || 0, 'USD')
        }))
    };
}

// Función para renderizar precios en el formato correcto
export function renderPrice(amount, currency = 'PEN') {
    if (!amount && amount !== 0) return 'Precio no disponible';
    
    const symbols = {
        'PEN': 'S/',
        'USD': '$'
    };
    
    const symbol = symbols[currency] || '';
    const formattedAmount = typeof amount === 'number' ? 
                           amount.toFixed(2) : 
                           parseFloat(amount || 0).toFixed(2);
    
    return `${symbol} ${formattedAmount}`;
}

// Hacer funciones disponibles globalmente
window.loadProducts = loadProducts;
window.getProducts = getProducts;
window.getProductById = getProductById;
window.filterProducts = filterProducts;
window.formatProductPrices = formatProductPrices;
window.renderPrice = renderPrice;
