import { showConfirmationModal } from '../modals.js';
import { Utils } from '../utils.js';

// Inicializar panel de administración
export function initAdminPanel() {
    console.log('🔄 Inicializando panel de administración...');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar formulario de producto
    setupProductForm();
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
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
        }
    }
}
