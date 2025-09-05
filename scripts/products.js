// scripts/products.js
import { supabase } from './supabase.js';
import { showNotification, formatCurrency } from './utils.js';

let products = [];

export async function loadProducts() {
    try {
        console.log('📦 Cargando productos desde Supabase...');
        
        // Obtener productos con información de categoría
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar productos:', error);
            
            if (error.code === 'PGRST204' || error.code === '42P01') {
                console.warn('Tabla products no existe');
                products = [];
                return products;
            }
            
            throw error;
        }

        // Procesar los planes que están en formato JSONB
        products = (data || []).map(product => {
            try {
                // Asegurarse de que plans sea un array válido
                let plans = [];
                if (product.plans && typeof product.plans === 'string') {
                    plans = JSON.parse(product.plans);
                } else if (Array.isArray(product.plans)) {
                    plans = product.plans;
                } else if (product.plans && typeof product.plans === 'object') {
                    plans = [product.plans];
                }
                
                return {
                    ...product,
                    plans: plans || []
                };
            } catch (parseError) {
                console.warn('Error parseando planes del producto:', parseError);
                return {
                    ...product,
                    plans: []
                };
            }
        });

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
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <img src="${product.photo_url || 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'}" 
                 alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${product.categories?.name || 'Sin categoría'}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-3">${product.description || 'Sin descripción'}</p>
                <div class="mt-2 text-blue-600 font-bold">
                    ${formatCurrency(getProductMinPrice(product))}
                </div>
                ${product.plans && product.plans.length > 0 ? `
                    <div class="mt-2 text-xs text-gray-500">
                        ${product.plans.length} plan${product.plans.length !== 1 ? 'es' : ''} disponible${product.plans.length !== 1 ? 's' : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

export function getProductMinPrice(product) {
    if (!product.plans || product.plans.length === 0) return 0;
    
    try {
        const prices = product.plans
            .filter(plan => plan && typeof plan === 'object')
            .map(plan => {
                const soles = parseFloat(plan.price_soles) || Infinity;
                const dollars = parseFloat(plan.price_dollars) || Infinity;
                return Math.min(soles, dollars);
            })
            .filter(price => price > 0 && isFinite(price));
        
        return prices.length > 0 ? Math.min(...prices) : 0;
    } catch (error) {
        console.warn('Error calculando precio mínimo:', error);
        return 0;
    }
}

// Función para agregar producto
export async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: productData.name,
                description: productData.description,
                category_id: productData.category_id,
                photo_url: productData.photo_url,
                plans: productData.plans || [],
                created_at: new Date().toISOString()
            }])
            .select(`
                *,
                categories (*)
            `);

        if (error) throw error;

        if (data && data.length > 0) {
            const newProduct = {
                ...data[0],
                plans: Array.isArray(data[0].plans) ? data[0].plans : JSON.parse(data[0].plans || '[]')
            };
            
            products.unshift(newProduct);
            showNotification('✅ Producto agregado correctamente', 'success');
            return newProduct;
        }
        
        return null;
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showNotification('Error al agregar producto', 'error');
        return null;
    }
}

// Función para actualizar producto
export async function updateProduct(id, productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: productData.name,
                description: productData.description,
                category_id: productData.category_id,
                photo_url: productData.photo_url,
                plans: productData.plans || [],
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                categories (*)
            `);

        if (error) throw error;

        if (data && data.length > 0) {
            const updatedProduct = {
                ...data[0],
                plans: Array.isArray(data[0].plans) ? data[0].plans : JSON.parse(data[0].plans || '[]')
            };
            
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) {
                products[index] = updatedProduct;
            }
            
            showNotification('✅ Producto actualizado correctamente', 'success');
            return updatedProduct;
        }
        
        return null;
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        showNotification('Error al actualizar producto', 'error');
        return null;
    }
}

// Función para eliminar producto
export async function deleteProduct(id) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        products = products.filter(p => p.id !== id);
        showNotification('✅ Producto eliminado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showNotification('Error al eliminar producto', 'error');
        return false;
    }
}
