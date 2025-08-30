// scripts/products.js
import { supabase } from './supabase.js';
import { showNotification, formatCurrency } from './utils.js';
import { renderProductCard } from './components/product-card.js';

let products = [];

// Cargar productos desde Supabase
export async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar productos:', error);
            showNotification('Error al cargar productos', 'error');
            return [];
        }

        products = data || [];
        return products;
    } catch (error) {
        console.error('Error inesperado al cargar productos:', error);
        showNotification('Error inesperado al cargar productos', 'error');
        return [];
    }
}

// Obtener productos
export function getProducts() {
    return products;
}

// Filtrar productos por categoría y término de búsqueda
export function filterProducts(categoryId = 'all', searchTerm = '') {
    let filtered = [...products];

    // Filtrar por categoría
    if (categoryId !== 'all') {
        filtered = filtered.filter(product => product.category_id === categoryId);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(term) || 
            product.description.toLowerCase().includes(term)
        );
    }

    return filtered;
}

// Obtener producto por ID
export function getProductById(id) {
    return products.find(product => product.id === id);
}

// Agregar un nuevo producto
export async function addProduct(productData) {
    try {
        // Validar datos del producto
        if (!productData.name || !productData.description || !productData.category_id || !productData.photo_url) {
            showNotification('Todos los campos obligatorios deben estar completos', 'error');
            return null;
        }

        // Validar que haya al menos un plan
        if (!productData.plans || productData.plans.length === 0) {
            showNotification('Debe agregar al menos un plan al producto', 'error');
            return null;
        }

        // Validar que cada plan tenga nombre y al menos un precio
        const invalidPlan = productData.plans.find(plan => 
            !plan.name || (!plan.price_soles && !plan.price_dollars)
        );

        if (invalidPlan) {
            showNotification('Cada plan debe tener un nombre y al menos un precio', 'error');
            return null;
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: productData.name,
                description: productData.description,
                category_id: productData.category_id,
                photo_url: productData.photo_url,
                plans: productData.plans
            }])
            .select(`
                *,
                categories (name)
            `);

        if (error) {
            console.error('Error al agregar producto:', error);
            showNotification('Error al agregar producto', 'error');
            return null;
        }

        if (data && data.length > 0) {
            products.unshift(data[0]);
            showNotification('Producto agregado correctamente', 'success');
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al agregar producto:', error);
        showNotification('Error inesperado al agregar producto', 'error');
        return null;
    }
}

// Actualizar un producto
export async function updateProduct(id, productData) {
    try {
        // Validar datos del producto
        if (!productData.name || !productData.description || !productData.category_id || !productData.photo_url) {
            showNotification('Todos los campos obligatorios deben estar completos', 'error');
            return null;
        }

        // Validar que haya al menos un plan
        if (!productData.plans || productData.plans.length === 0) {
            showNotification('Debe agregar al menos un plan al producto', 'error');
            return null;
        }

        // Validar que cada plan tenga nombre y al menos un precio
        const invalidPlan = productData.plans.find(plan => 
            !plan.name || (!plan.price_soles && !plan.price_dollars)
        );

        if (invalidPlan) {
            showNotification('Cada plan debe tener un nombre y al menos un precio', 'error');
            return null;
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                name: productData.name,
                description: productData.description,
                category_id: productData.category_id,
                photo_url: productData.photo_url,
                plans: productData.plans,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                categories (name)
            `);

        if (error) {
            console.error('Error al actualizar producto:', error);
            showNotification('Error al actualizar producto', 'error');
            return null;
        }

        if (data && data.length > 0) {
            // Actualizar en la lista local
            const index = products.findIndex(product => product.id === id);
            if (index !== -1) {
                products[index] = data[0];
            }
            showNotification('Producto actualizado correctamente', 'success');
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al actualizar producto:', error);
        showNotification('Error inesperado al actualizar producto', 'error');
        return null;
    }
}

// Eliminar un producto
export async function deleteProduct(id) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar producto:', error);
            showNotification('Error al eliminar producto', 'error');
            return false;
        }

        // Eliminar de la lista local
        products = products.filter(product => product.id !== id);
        showNotification('Producto eliminado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error inesperado al eliminar producto:', error);
        showNotification('Error inesperado al eliminar producto', 'error');
        return false;
    }
}

// Renderizar productos en el grid público
export function renderProductsGrid(products, container) {
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search fa-3x text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No se encontraron productos</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => renderProductCard(product)).join('');
}

// Renderizar lista de productos en el panel de administración
export function renderAdminProductsList(products, container) {
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="py-6 text-center text-gray-500">
                    No hay productos. Agrega tu primer producto usando el formulario arriba.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">
                <img src="${product.photo_url}" alt="${product.name}" class="w-12 h-12 object-cover rounded">
            </td>
            <td class="py-3 px-4 font-medium">${product.name}</td>
            <td class="py-3 px-4">${product.categories?.name || 'Sin categoría'}</td>
            <td class="py-3 px-4">
                ${product.plans ? product.plans.map(plan => `
                    <div class="text-sm">
                        <span class="font-medium">${plan.name}:</span>
                        ${plan.price_soles ? `S/ ${formatCurrency(plan.price_soles)}` : ''}
                        ${plan.price_soles && plan.price_dollars ? ' • ' : ''}
                        ${plan.price_dollars ? `$ ${formatCurrency(plan.price_dollars)}` : ''}
                    </div>
                `).join('') : 'Sin planes'}
            </td>
            <td class="py-3 px-4">
                <div class="flex space-x-2">
                    <button class="edit-product text-blue-500 hover:text-blue-700" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-product text-red-500 hover:text-red-700" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Agregar event listeners para los botones de editar y eliminar
    container.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (typeof window.editProduct === 'function') {
                window.editProduct(id);
            }
        });
    });

    container.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                deleteProduct(id).then(success => {
                    if (success) {
                        // Recargar la lista de productos
                        if (typeof window.loadAdminProducts === 'function') {
                            window.loadAdminProducts();
                        }
                    }
                });
            }
        });
    });
}