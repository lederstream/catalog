// scripts/components/admin-panel.js
import { showConfirmationModal } from '../modals.js';
import { Utils } from '../utils.js';

// Inicializar panel de administración
export function initAdminPanel() {
    try {
        console.log('🔄 Inicializando panel de administración...');
        
        // Configurar event listeners
        setupEventListeners();
        
        // Configurar formulario de producto
        setupProductForm();
        
        // Cargar categorías en el selector
        loadCategoriesIntoSelect();
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        Utils.showError('❌ Error al inicializar el panel de administración');
    }
}

function setupEventListeners() {
    // Botón para gestionar categorías
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', () => {
            if (typeof window.openCategoryModal === 'function') {
                window.openCategoryModal();
            }
        });
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof window.handleLogout === 'function') {
                showConfirmationModal({
                    title: 'Cerrar sesión',
                    message: '¿Estás seguro de que deseas cerrar sesión?',
                    confirmText: 'Cerrar sesión',
                    cancelText: 'Cancelar',
                    type: 'warning',
                    onConfirm: () => window.handleLogout()
                });
            }
        });
    }
}

// Configurar el formulario de producto
function setupProductForm() {
    const productForm = document.getElementById('productForm');
    if (!productForm) return;
    
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const photoUrlInput = document.getElementById('photo_url');
    
    // Agregar nuevo plan
    if (addPlanBtn) {
        addPlanBtn.addEventListener('click', () => {
            if (typeof window.productManager !== 'undefined') {
                window.productManager.addPlanRow();
            }
        });
    }

    // Cancelar edición
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    // Enviar formulario
    productForm.addEventListener('submit', handleProductSubmit);

    // Configurar vista previa de imagen
    if (photoUrlInput) {
        photoUrlInput.addEventListener('input', Utils.debounce((e) => {
            updateImagePreview(e.target.value);
        }, 300));
    }
}

// Cargar categorías en el selector del formulario
async function loadCategoriesIntoSelect() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;

    try {
        // Obtener categorías
        let categories = [];
        if (typeof window.getCategories === 'function') {
            categories = window.getCategories();
        } else if (typeof window.loadCategories === 'function') {
            categories = await window.loadCategories();
        }

        // Limpiar y poblar el selector
        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories into select:', error);
    }
}

// Manejar envío del formulario de producto
async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const photo_url = document.getElementById('photo_url').value;

    // Recopilar planes
    const plans = [];
    document.querySelectorAll('.plan-item').forEach(item => {
        const name = item.querySelector('.plan-name').value;
        const price_soles = item.querySelector('.plan-price-soles').value;
        const price_dollars = item.querySelector('.plan-price-dollars').value;

        if (name && (price_soles || price_dollars)) {
            plans.push({
                name: name.trim(),
                price_soles: price_soles ? parseFloat(price_soles) : 0,
                price_dollars: price_dollars ? parseFloat(price_dollars) : 0
            });
        }
    });

    const productData = {
        name,
        description,
        category_id: category,
        photo_url,
        plans
    };

    try {
        if (productId) {
            // Editar producto existente
            if (typeof window.updateProduct === 'function') {
                await window.updateProduct(productId, productData);
                Utils.showSuccess('✅ Producto actualizado correctamente');
            }
        } else {
            // Agregar nuevo producto
            if (typeof window.addProduct === 'function') {
                await window.addProduct(productData);
                Utils.showSuccess('✅ Producto agregado correctamente');
            }
        }
        
        // Resetear formulario
        resetForm();
        
        // Recargar lista de productos
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList && typeof window.renderAdminProductsList === 'function') {
                window.renderAdminProductsList(window.getProducts(), adminProductsList);
            }
        }
        
    } catch (error) {
        console.error('Error al procesar el producto:', error);
        Utils.showError(`❌ Error al procesar el producto: ${error.message}`);
    }
}

// Resetear formulario
function resetForm() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.reset();
        document.getElementById('productId').value = '';
        
        const formTitle = document.getElementById('formTitle');
        const submitText = document.getElementById('submitText');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (formTitle) formTitle.textContent = 'Agregar Nuevo Producto';
        if (submitText) submitText.textContent = 'Agregar Producto';
        if (cancelBtn) cancelBtn.classList.add('hidden');
        
        // Limpiar planes y agregar uno vacío
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            plansContainer.innerHTML = '';
            if (typeof window.productManager !== 'undefined') {
                window.productManager.addPlanRow();
            }
        }
        
        // Limpiar vista previa
        updateImagePreview('');
    }
}

// Actualizar vista previa de imagen
function updateImagePreview(url) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    if (url && url.trim() !== '') {
        imagePreview.innerHTML = `
            <div class="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                <img src="${url}" 
                     alt="Vista previa" 
                     class="w-full h-full object-cover"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Error+al+cargar+imagen'">
            </div>
        `;
    } else {
        imagePreview.innerHTML = `
            <div class="w-full h-full flex items-center justify-center text-gray-500">
                <p>La imagen aparecerá aquí</p>
            </div>
        `;
    }
}
