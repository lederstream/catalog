// scripts/products.js

import { supabase } from './supabase.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import { renderProductCard } from './components/product-card.js';

// Variables globales
let allProducts = [];
let currentEditingProduct = null;

// Inicializar productos
export const initializeProducts = async () => {
    try {
        await loadProducts();
        setupEventListeners();
    } catch (error) {
        showError('Error al inicializar productos: ' + error.message);
    }
};

// Cargar productos desde Supabase (para uso general)
export const loadProducts = async () => {
    try {
        showLoadingState();
        
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = products || [];
        renderProducts(allProducts);
        renderAdminProducts(allProducts);
        
        return allProducts;
    } catch (error) {
        showError('Error al cargar productos: ' + error.message);
        return [];
    } finally {
        hideLoadingState();
    }
};

// Alias para loadAdminProducts (lo que auth.js espera)
export const loadAdminProducts = loadProducts;

// Renderizar productos en el catálogo
export const renderProducts = (products) => {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">No hay productos disponibles</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-item" data-category="${product.category || ''}">
            ${renderProductCard(product)}
        </div>
    `).join('');
};

// Renderizar productos en el panel de administración
export const renderAdminProducts = (products) => {
    const adminProductsList = document.getElementById('adminProductsList');
    if (!adminProductsList) return;

    if (!products || products.length === 0) {
        adminProductsList.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
                    <i class="fas fa-box-open text-2xl mb-2"></i>
                    <p>No hay productos registrados</p>
                </td>
            </tr>
        `;
        return;
    }

    adminProductsList.innerHTML = products.map(product => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="py-3 px-4">
                <img src="${product.photo_url || 'https://via.placeholder.com/50x50'}" 
                     alt="${product.name}" 
                     class="w-12 h-12 object-cover rounded"
                     onerror="this.src='https://via.placeholder.com/50x50'">
            </td>
            <td class="py-3 px-4 font-medium">${product.name}</td>
            <td class="py-3 px-4">${product.category || 'Sin categoría'}</td>
            <td class="py-3 px-4 text-sm">
                ${product.plans ? product.plans.map(plan => plan.name).join(', ') : 'Sin planes'}
            </td>
            <td class="py-3 px-4">
                <div class="flex space-x-2">
                    <button class="edit-product p-2 text-blue-600 hover:bg-blue-100 rounded" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-product p-2 text-red-600 hover:bg-red-100 rounded" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Agregar event listeners para los botones
    addProductActionListeners();
};

// Configurar event listeners
const setupEventListeners = () => {
    const productForm = document.getElementById('productForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    // Formulario de producto
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Botón cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Filtro de categoría
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }

    // Preview de imagen
    const photoUrlInput = document.getElementById('photo_url');
    if (photoUrlInput) {
        photoUrlInput.addEventListener('blur', updateImagePreview);
    }
};

// Manejar envío del formulario
const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    try {
        const formData = getFormData();
        const errors = validateProductForm(formData);
        
        if (errors.length > 0) {
            errors.forEach(error => showError(error));
            return;
        }

        if (currentEditingProduct) {
            await updateProduct(currentEditingProduct.id, formData);
            showSuccess('Producto actualizado correctamente');
        } else {
            await createProduct(formData);
            showSuccess('Producto creado correctamente');
        }

        resetForm();
        await loadProducts();
        
    } catch (error) {
        showError('Error al guardar producto: ' + error.message);
    }
};

// Obtener datos del formulario
const getFormData = () => {
    const plans = [];
    const planItems = document.querySelectorAll('.plan-item');
    
    planItems.forEach(item => {
        const name = item.querySelector('.plan-name').value;
        const price_soles = parseFloat(item.querySelector('.plan-price-soles').value) || 0;
        const price_dollars = parseFloat(item.querySelector('.plan-price-dollars').value) || 0;
        
        if (name) {
            plans.push({ name, price_soles, price_dollars });
        }
    });

    return {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        photo_url: document.getElementById('photo_url').value,
        plans: plans
    };
};

// Validar formulario de producto
const validateProductForm = (formData) => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('El nombre del producto es requerido');
    if (!formData.category) errors.push('La categoría es requerida');
    if (!formData.description.trim()) errors.push('La descripción es requerida');
    if (!formData.photo_url.trim()) errors.push('La URL de la imagen es requerida');
    if (formData.plans.length === 0) errors.push('Debe agregar al menos un plan');
    
    // Validar URL de imagen
    try {
        new URL(formData.photo_url);
    } catch {
        errors.push('La URL de la imagen no es válida');
    }
    
    return errors;
};

// Crear producto
const createProduct = async (productData) => {
    const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

    if (error) throw error;
    return data[0];
};

// Actualizar producto
const updateProduct = async (productId, productData) => {
    const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select();

    if (error) throw error;
    return data[0];
};

// Eliminar producto
export const deleteProduct = async (productId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;
        
        showSuccess('Producto eliminado correctamente');
        await loadProducts();
        
    } catch (error) {
        showError('Error al eliminar producto: ' + error.message);
    }
};

// Editar producto
export const editProduct = async (productId) => {
    try {
        const product = allProducts.find(p => p.id === productId);
        if (!product) throw new Error('Producto no encontrado');

        currentEditingProduct = product;
        populateForm(product);
        showEditMode();
        
    } catch (error) {
        showError('Error al cargar producto: ' + error.message);
    }
};

// Llenar formulario con datos del producto
const populateForm = (product) => {
    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name || '';
    document.getElementById('category').value = product.category || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('photo_url').value = product.photo_url || '';
    
    // Llenar planes
    const plansContainer = document.getElementById('plansContainer');
    plansContainer.innerHTML = '';
    
    if (product.plans && product.plans.length > 0) {
        product.plans.forEach(plan => {
            addPlanItem(plan);
        });
    } else {
        addPlanItem();
    }
    
    updateImagePreview();
};

// Mostrar modo edición
const showEditMode = () => {
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('submitText').textContent = 'Actualizar Producto';
    document.getElementById('cancelBtn').classList.remove('hidden');
    
    // Scroll to form
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
};

// Resetear formulario
const resetForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    
    const plansContainer = document.getElementById('plansContainer');
    plansContainer.innerHTML = '';
    addPlanItem();
    
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submitText').textContent = 'Agregar Producto';
    document.getElementById('cancelBtn').classList.add('hidden');
    document.getElementById('imagePreview').innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
    
    currentEditingProduct = null;
};

// Agregar item de plan
export const addPlanItem = (plan = {}) => {
    const plansContainer = document.getElementById('plansContainer');
    const planItem = document.createElement('div');
    planItem.className = 'plan-item flex items-center space-x-2';
    
    planItem.innerHTML = `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
            <input type="text" placeholder="Nombre del plan" 
                   class="plan-name px-3 py-2 border rounded-lg" 
                   value="${plan.name || ''}" required>
            <input type="number" step="0.01" placeholder="Precio S/." 
                   class="plan-price-soles px-3 py-2 border rounded-lg" 
                   value="${plan.price_soles || ''}" min="0" required>
            <input type="number" step="0.01" placeholder="Precio $" 
                   class="plan-price-dollars px-3 py-2 border rounded-lg" 
                   value="${plan.price_dollars || ''}" min="0" required>
        </div>
        <button type="button" class="remove-plan ml-2 text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    plansContainer.appendChild(planItem);
    
    // Event listener para eliminar plan
    const removeBtn = planItem.querySelector('.remove-plan');
    removeBtn.addEventListener('click', () => {
        if (document.querySelectorAll('.plan-item').length > 1) {
            planItem.remove();
        }
    });
};

// Actualizar preview de imagen
const updateImagePreview = () => {
    const imageUrl = document.getElementById('photo_url').value;
    const imagePreview = document.getElementById('imagePreview');
    
    if (!imageUrl) {
        imagePreview.innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
        return;
    }
    
    imagePreview.innerHTML = `
        <img src="${imageUrl}" 
             alt="Vista previa" 
             class="w-full h-full object-cover"
             onerror="this.innerHTML='<p class=\\"text-red-500\\">Error al cargar imagen</p>'">
    `;
};

// Manejar búsqueda
const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderProducts(allProducts);
        return;
    }
    
    const filteredProducts = allProducts.filter(product =>
        product.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm)
    );
    
    renderProducts(filteredProducts);
};

// Manejar filtro de categoría
const handleCategoryFilter = (e) => {
    const category = e.target.value;
    
    if (category === 'all') {
        renderProducts(allProducts);
        return;
    }
    
    const filteredProducts = allProducts.filter(product =>
        product.category === category
    );
    
    renderProducts(filteredProducts);
};

// Agregar event listeners para acciones de producto
const addProductActionListeners = () => {
    // Botones editar
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            editProduct(productId);
        });
    });
    
    // Botones eliminar
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            deleteProduct(productId);
        });
    });
};

// Mostrar estado de carga
const showLoadingState = () => {
    const productsGrid = document.getElementById('productsGrid');
    const adminProductsList = document.getElementById('adminProductsList');
    
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="loading-spinner"></div>
                <p class="mt-4">Cargando productos...</p>
            </div>
        `;
    }
    
    if (adminProductsList) {
        adminProductsList.innerHTML = `
            <tr>
                <td colspan="5" class="py-4 text-center text-gray-500">
                    <div class="loading-spinner mx-auto"></div>
                    <p class="mt-2">Cargando productos...</p>
                </td>
            </tr>
        `;
    }
};

// Ocultar estado de carga
const hideLoadingState = () => {
    // El contenido se reemplazará con los productos reales
};

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Exportar allProducts para uso externo si es necesario
export const getAllProducts = () => allProducts;
