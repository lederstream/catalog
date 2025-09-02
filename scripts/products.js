// scripts/products.js
import { supabase } from './supabase.js';
import { showNotification, formatCurrency, validateUrl, validateRequired, validateNumber } from './utils.js';

let products = [];

// Cargar productos desde Supabase
export async function loadProducts() {
    try {
        console.log('📦 Cargando productos desde Supabase...');
        
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories:category_id (name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar productos:', error);
            showNotification('Error al cargar los productos', 'error');
            return [];
        }

        products = data || [];
        console.log(`✅ ${products.length} productos cargados`);
        return products;
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showNotification('Error al cargar los productos', 'error');
        return [];
    }
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

    if (categoryId !== 'all') {
        filtered = filtered.filter(product => {
            const productCategoryId = product.category_id;
            return productCategoryId == categoryId;
        });
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product => {
            const searchableText = `${product.name || ''} ${product.description || ''}`.toLowerCase();
            return searchableText.includes(term);
        });
    }

    return filtered;
}

// Obtener producto por ID
export function getProductById(id) {
    return products.find(product => product.id == id);
}

// Validar datos del producto
function validateProductData(productData) {
    const errors = [];
    
    if (!validateRequired(productData.name)) {
        errors.push('El nombre del producto es requerido');
    }
    
    if (!validateRequired(productData.description)) {
        errors.push('La descripción es requerida');
    }
    
    if (!validateUrl(productData.photo_url)) {
        errors.push('La URL de la imagen no es válida');
    }
    
    if (!productData.plans || productData.plans.length === 0) {
        errors.push('Debe agregar al menos un plan');
    } else {
        productData.plans.forEach((plan, index) => {
            if (!validateRequired(plan.name)) {
                errors.push(`El nombre del plan ${index + 1} es requerido`);
            }
            
            const hasSoles = validateNumber(plan.price_soles) && parseFloat(plan.price_soles) >= 0;
            const hasDollars = validateNumber(plan.price_dollars) && parseFloat(plan.price_dollars) >= 0;
            
            if (!hasSoles && !hasDollars) {
                errors.push(`El plan ${index + 1} debe tener al menos un precio (soles o dólares)`);
            }
        });
    }
    
    return errors;
}

// Agregar un nuevo producto
export async function addProduct(productData) {
    try {
        // Validar datos
        const validationErrors = validateProductData(productData);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => showNotification(error, 'error'));
            return null;
        }

        const productToInsert = {
            name: productData.name.trim(),
            description: productData.description.trim(),
            photo_url: productData.photo_url.trim(),
            plans: productData.plans.map(plan => ({
                name: plan.name.trim(),
                price_soles: plan.price_soles ? parseFloat(plan.price_soles) : 0,
                price_dollars: plan.price_dollars ? parseFloat(plan.price_dollars) : 0
            })),
            created_at: new Date().toISOString()
        };

        if (productData.category_id) {
            productToInsert.category_id = parseInt(productData.category_id);
        }

        const { data, error } = await supabase
            .from('products')
            .insert([productToInsert])
            .select(`
                *,
                categories:category_id (name)
            `);

        if (error) {
            console.error('Error al agregar producto:', error);
            showNotification('Error al agregar producto: ' + error.message, 'error');
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
        // Validar datos
        const validationErrors = validateProductData(productData);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => showNotification(error, 'error'));
            return null;
        }

        const updateData = {
            name: productData.name.trim(),
            description: productData.description.trim(),
            photo_url: productData.photo_url.trim(),
            plans: productData.plans.map(plan => ({
                name: plan.name.trim(),
                price_soles: plan.price_soles ? parseFloat(plan.price_soles) : 0,
                price_dollars: plan.price_dollars ? parseFloat(plan.price_dollars) : 0
            })),
            updated_at: new Date().toISOString()
        };

        if (productData.category_id) {
            updateData.category_id = parseInt(productData.category_id);
        }

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                categories:category_id (name)
            `);

        if (error) {
            console.error('Error al actualizar producto:', error);
            showNotification('Error al actualizar producto: ' + error.message, 'error');
            return null;
        }

        if (data && data.length > 0) {
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
            showNotification('Error al eliminar producto: ' + error.message, 'error');
            return false;
        }

        products = products.filter(product => product.id !== id);
        showNotification('Producto eliminado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error inesperado al eliminar producto:', error);
        showNotification('Error al eliminar producto', 'error');
        return false;
    }
}

// Renderizar productos en el grid público con efectos mejorados
export function renderProductsGrid(productsToRender, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor con ID ${containerId} no encontrado`);
        return;
    }

    if (!productsToRender || productsToRender.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 animate-fade-in">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600">No se encontraron productos</p>
                <p class="text-sm text-gray-500 mt-1">Agrega productos desde el panel de administración</p>
            </div>
        `;
        return;
    }

    // Renderizado mejorado de productos con efectos visuales
    container.innerHTML = productsToRender.map(product => `
        <div class="product-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
            <div class="h-48 bg-gray-100 overflow-hidden relative">
                <div class="image-container w-full h-full relative overflow-hidden">
                    <img src="${product.photo_url || 'https://via.placeholder.com/300x200?text=Sin+imagen'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Error+imagen'">
                    <div class="image-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
                        <div class="p-4 w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <div class="flex justify-between items-center">
                                <span class="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">${getCategoryName(product)}</span>
                                <div class="flex space-x-1">
                                    ${product.plans && product.plans.length > 0 ? `
                                        <span class="bg-green-500 text-white text-xs px-2 py-1 rounded">S/ ${formatCurrency(product.plans[0].price_soles || 0)}</span>
                                        <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded">$ ${formatCurrency(product.plans[0].price_dollars || 0)}</span>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-5">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">${product.name || 'Producto sin nombre'}</h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || 'Sin descripción'}</p>
                
                <div class="mb-3">
                    <h4 class="font-medium text-gray-700 text-sm mb-2 flex items-center">
                        <i class="fas fa-list-alt mr-2 text-blue-500 text-xs"></i>Planes disponibles:
                    </h4>
                    ${product.plans && product.plans.length > 0 ? 
                        product.plans.slice(0, 2).map(plan => `
                            <div class="flex justify-between items-center text-sm mb-2 p-2 bg-gray-50 rounded-lg">
                                <span class="font-medium">${plan.name}</span>
                                <div class="flex flex-col items-end">
                                    ${plan.price_soles ? `
                                        <span class="text-green-600 font-bold flex items-center">
                                            <span class="text-xs mr-1">S/</span>${formatCurrency(plan.price_soles)}
                                        </span>
                                    ` : ''}
                                    ${plan.price_dollars ? `
                                        <span class="text-blue-600 text-sm flex items-center">
                                            <span class="text-xs mr-1">$</span>${formatCurrency(plan.price_dollars)}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('') : 
                        '<span class="text-gray-500 text-sm">No hay planes disponibles</span>'
                    }
                    ${product.plans && product.plans.length > 2 ? 
                        `<div class="text-xs text-gray-500 mt-1 text-center">+${product.plans.length - 2} plan(s) más</div>` : ''
                    }
                </div>
                
                <button class="view-details-btn w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center group/btn" 
                        data-product-id="${product.id}">
                    <i class="fas fa-eye mr-2 group-hover/btn:animate-pulse"></i>
                    Ver detalles
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners
    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.productId;
            if (productId && typeof window.showProductDetails === 'function') {
                window.showProductDetails(productId);
            }
        });
    });
    
    // Animar la entrada de las tarjetas
    const productCards = container.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
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
        <tr class="border-b hover:bg-gray-50 transition-colors duration-150 group">
            <td class="py-3 px-4">
                <div class="w-12 h-12 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-200">
                    <img src="${product.photo_url || 'https://via.placeholder.com/50x50?text=Imagen'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                         onerror="this.src='https://via.placeholder.com/50x50?text=Error'">
                </div>
            </td>
            <td class="py-3 px-4 font-medium group-hover:text-blue-600 transition-colors duration-200">${product.name || 'Sin nombre'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    ${getCategoryName(product)}
                </span>
            </td>
            <td class="py-3 px-4">
                ${product.plans ? product.plans.slice(0, 2).map(plan => `
                    <div class="text-sm mb-1">
                        <span class="font-medium">${plan.name}:</span>
                        <div class="flex space-x-2 mt-1">
                            ${plan.price_soles ? `
                                <span class="text-green-600 font-bold flex items-center">
                                    <span class="text-xs mr-1">S/</span>${formatCurrency(plan.price_soles)}
                                </span>
                            ` : ''}
                            ${plan.price_dollars ? `
                                <span class="text-blue-600 flex items-center">
                                    <span class="text-xs mr-1">$</span>${formatCurrency(plan.price_dollars)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : 'Sin planes'}
                ${product.plans && product.plans.length > 2 ? 
                    `<div class="text-xs text-gray-500">+${product.plans.length - 2} planes más</div>` : ''}
            </td>
            <td class="py-3 px-4">
                <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button class="edit-product text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-110" 
                            data-id="${product.id}" title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-product text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-110" 
                            data-id="${product.id}" title="Eliminar producto">
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
            
            // Efecto de clic
            e.currentTarget.classList.add('scale-95');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-95');
            }, 150);
            
            if (typeof window.editProduct === 'function') {
                window.editProduct(id);
            }
        });
    });

    container.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            
            // Efecto de clic
            e.currentTarget.classList.add('scale-95');
            setTimeout(() => {
                e.currentTarget.classList.remove('scale-95');
            }, 150);
            
            if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                deleteProduct(id).then(success => {
                    if (success) {
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
    if (product.category_id && typeof window.getCategories === 'function') {
        try {
            const categories = window.getCategories();
            if (categories && Array.isArray(categories)) {
                const category = categories.find(cat => cat.id == product.category_id);
                return category ? category.name : `Categoría ${product.category_id}`;
            }
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
        }
    }
    return 'Sin categoría';
}

// Helper para obtener nombre de categoría por ID
function getCategoryNameById(categoryId) {
    if (!categoryId) return 'Sin categoría';
    
    if (typeof window.getCategories === 'function') {
        try {
            const categories = window.getCategories();
            if (categories && Array.isArray(categories)) {
                const category = categories.find(cat => cat.id == categoryId);
                return category ? category.name : `Categoría ${categoryId}`;
            }
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
        }
    }
    return `Categoría ${categoryId}`;
}

// Hacer funciones disponibles globalmente
window.loadProducts = loadProducts;
window.loadAdminProducts = loadProducts;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.getProductById = getProductById;
window.renderAdminProductsList = renderAdminProductsList;
window.filterProducts = filterProducts;
window.renderProductsGrid = renderProductsGrid;
