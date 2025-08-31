import { supabase } from './supabase.js';
import { showNotification, formatCurrency } from './utils.js';
import { renderProductCard } from './components/product-card.js';

let products = [];

// Cargar productos desde Supabase CON JOIN
export async function loadProducts() {
    try {
        console.log('Cargando productos desde Supabase con JOIN...');
        
        // Cargar productos con JOIN a categories (ahora hay foreign key)
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar productos con JOIN:', error);
            
            // Si hay error, intentar sin JOIN como fallback
            console.warn('Intentando cargar productos sin JOIN...');
            const { data: simpleData, error: simpleError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (simpleError) {
                // Si la tabla products no existe, usar datos de muestra
                if (simpleError.code === 'PGRST204' || simpleError.code === '42P01') {
                    console.warn('Tabla products no existe, usando datos de muestra');
                    products = getSampleProducts();
                    return products;
                }
                throw simpleError;
            }
            
            products = simpleData || [];
            console.log('Productos cargados (sin JOIN):', products);
            return products;
        }

        products = data || [];
        console.log('Productos cargados con JOIN:', products);
        return products;
    } catch (error) {
        console.error('Error al cargar productos:', error);
        
        // En caso de error, usar datos de muestra
        products = getSampleProducts();
        showNotification('Usando datos de demostración', 'info');
        return products;
    }
}

// Datos de muestra para cuando no hay base de datos
function getSampleProducts() {
    return [
        {
            id: '1',
            name: 'Diseño de Logo Profesional',
            description: 'Diseño de logo moderno y profesional para tu marca',
            category_id: 1,
            categories: { id: 1, name: 'diseño' },
            photo_url: 'https://images.unsplash.com/photo-1567446537738-74804ee3a9bd?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básico', price_soles: 199, price_dollars: 50 },
                { name: 'Premium', price_soles: 399, price_dollars: 100 }
            ],
            created_at: new Date().toISOString()
        },
        {
            id: '2', 
            name: 'Sitio Web Responsive',
            description: 'Desarrollo de sitio web moderno y responsive',
            category_id: 3,
            categories: { id: 3, name: 'software' },
            photo_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&h=200&fit=crop',
            plans: [
                { name: 'Landing Page', price_soles: 799, price_dollars: 200 },
                { name: 'Sitio Completo', price_soles: 1599, price_dollars: 400 }
            ],
            created_at: new Date().toISOString()
        },
        {
            id: '3',
            name: 'Campaña de Marketing Digital',
            description: 'Campaña completa de marketing para redes sociales',
            category_id: 2,
            categories: { id: 2, name: 'marketing' },
            photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
            plans: [
                { name: 'Básica', price_soles: 999, price_dollars: 250 },
                { name: 'Completa', price_soles: 1999, price_dollars: 500 }
            ],
            created_at: new Date().toISOString()
        }
    ];
}

// Alias para compatibilidad con auth.js
export const loadAdminProducts = loadProducts;

// Obtener productos
export function getProducts() {
    return products;
}

// Filtrar productos por categoría y término de búsqueda
export function filterProducts(categoryId = 'all', searchTerm = '') {
    let filtered = [...products];

    // Filtrar por categoría (usando category_id O el nombre de la categoría)
    if (categoryId !== 'all') {
        filtered = filtered.filter(product => {
            const productCategoryId = product.category_id;
            const productCategoryName = product.categories?.name;
            
            return (
                productCategoryId == categoryId || 
                (productCategoryName && productCategoryName.toLowerCase() === categoryId.toLowerCase())
            );
        });
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product => {
            const categoryName = product.categories?.name;
            return (
                (product.name && product.name.toLowerCase().includes(term)) || 
                (product.description && product.description.toLowerCase().includes(term)) ||
                (categoryName && categoryName.toLowerCase().includes(term))
            );
        });
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
        if (!productData.name || !productData.description || !productData.photo_url) {
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

        const productToInsert = {
            name: productData.name,
            description: productData.description,
            photo_url: productData.photo_url,
            plans: productData.plans,
            created_at: new Date().toISOString()
        };

        // Agregar category_id (foreign key) - AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL
        if (productData.category_id) {
            // Convertir a número entero para evitar el error de foreign key
            productToInsert.category_id = parseInt(productData.category_id);
        }

        const { data, error } = await supabase
            .from('products')
            .insert([productToInsert])
            .select(`
                *,
                categories (*)
            `);

        if (error) {
            console.error('Error al agregar producto:', error);
            
            // Si hay error de tabla, agregar al array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                const newProduct = {
                    id: Date.now().toString(),
                    ...productToInsert,
                    categories: { name: 'General' }
                };
                products.unshift(newProduct);
                showNotification('Producto agregado (modo demostración)', 'success');
                return newProduct;
            }
            
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
        showNotification('Error al agregar producto', 'error');
        return null;
    }
}

// Actualizar un producto
export async function updateProduct(id, productData) {
    try {
        // Validar datos del producto
        if (!productData.name || !productData.description || !productData.photo_url) {
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

        const updateData = {
            name: productData.name,
            description: productData.description,
            photo_url: productData.photo_url,
            plans: productData.plans,
            updated_at: new Date().toISOString()
        };

        // Agregar category_id (foreign key) - AQUÍ TAMBIÉN LA CORRECCIÓN
        if (productData.category_id) {
            updateData.category_id = parseInt(productData.category_id);
        }

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                categories (*)
            `);

        if (error) {
            console.error('Error al actualizar producto:', error);
            
            // Si hay error de tabla, actualizar en el array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                const index = products.findIndex(product => product.id === id);
                if (index !== -1) {
                    products[index] = { ...products[index], ...updateData };
                    showNotification('Producto actualizado (modo demostración)', 'success');
                    return products[index];
                }
            }
            
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
        showNotification('Error al actualizar producto', 'error');
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
            
            // Si hay error de tabla, eliminar del array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                products = products.filter(product => product.id !== id);
                showNotification('Producto eliminado (modo demostración)', 'success');
                return true;
            }
            
            showNotification('Error al eliminar producto', 'error');
            return false;
        }

        // Eliminar de la lista local
        products = products.filter(product => product.id !== id);
        showNotification('Producto eliminado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error inesperado al eliminar producto:', error);
        showNotification('Error al eliminar producto', 'error');
        return false;
    }
}

// Renderizar productos en el grid público
export function renderProductsGrid(productsToRender, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!productsToRender || productsToRender.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search fa-3x text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No se encontraron productos</p>
                <p class="text-sm text-gray-400">Intenta con otros filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = productsToRender.map(product => renderProductCard(product)).join('');
}

// Renderizar lista de productos en el panel de administración
export function renderAdminProductsList(productsToRender, container) {
    if (!container) return;

    if (!productsToRender || productsToRender.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-box-open text-2xl mb-2"></i>
                    <p>No hay productos registrados</p>
                    <p class="text-sm">Agrega tu primer producto usando el formulario</p>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = productsToRender.map(product => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">
                <img src="${product.photo_url || 'https://via.placeholder.com/50x50?text=Imagen'}" 
                     alt="${product.name}" 
                     class="w-12 h-12 object-cover rounded"
                     onerror="this.src='https://via.placeholder.com/50x50?text=Error'">
            </td>
            <td class="py-3 px-4 font-medium">${product.name || 'Sin nombre'}</td>
            <td class="py-3 px-4">${getCategoryName(product)}</td>
            <td class="py-3 px-4">
                ${product.plans ? product.plans.map(plan => `
                    <div class="text-sm mb-1">
                        <span class="font-medium">${plan.name}:</span>
                        ${plan.price_soles ? `S/ ${formatCurrency(plan.price_soles)}` : ''}
                        ${plan.price_soles && plan.price_dollars ? ' • ' : ''}
                        ${plan.price_dollars ? `$ ${formatCurrency(plan.price_dollars)}` : ''}
                    </div>
                `).join('') : 'Sin planes'}
            </td>
            <td class="py-3 px-4">
                <div class="flex space-x-2">
                    <button class="edit-product text-blue-500 hover:text-blue-700 p-1" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-product text-red-500 hover:text-red-700 p-1" data-id="${product.id}">
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
                        loadProducts().then(() => {
                            if (typeof window.renderAdminProductsList === 'function') {
                                const adminList = document.getElementById('adminProductsList');
                                if (adminList) {
                                    window.renderAdminProductsList(products, adminList);
                                }
                            }
                        });
                    }
                });
            }
        });
    });
}

// Helper para obtener nombre de categoría
function getCategoryName(product) {
    if (product.categories && product.categories.name) {
        return product.categories.name;
    }
    if (product.category_id) {
        return `Categoría ${product.category_id}`;
    }
    return 'Sin categoría';
}

// Hacer funciones disponibles globalmente
window.loadProducts = loadProducts;
window.loadAdminProducts = loadProducts;
window.renderProductsGrid = renderProductsGrid;
window.renderAdminProductsList = renderAdminProductsList;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.getProductById = getProductById;
