// scripts/components/admin-panel.js
import { addCategory, renderCategoriesList } from '../categories.js';
import { openCategoriesModal } from '../modals.js';

// Inicializar panel de administración
export function initAdminPanel() {
    // Botón para gestionar categorías
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', () => {
            openCategoriesModal();
            // Cargar y renderizar categorías
            renderCategoriesList(document.getElementById('categoriesList'));
        });
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof window.handleLogout === 'function') {
                window.handleLogout();
            }
        });
    }

    // Configurar formulario de producto
    setupProductForm();
}

// Configurar el formulario de producto
export function setupProductForm() {
    const productForm = document.getElementById('productForm');
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const photoUrlInput = document.getElementById('photo_url');
    const searchImageBtn = document.getElementById('searchImageBtn');

    if (!productForm) return;

    // Agregar nuevo plan
    if (addPlanBtn) {
        addPlanBtn.addEventListener('click', addPlanRow);
    }

    // Cancelar edición
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    // Enviar formulario
    productForm.addEventListener('submit', handleProductSubmit);

    // Inicializar con un plan
    addPlanRow();

    // Configurar vista previa de imagen
    if (photoUrlInput) {
        photoUrlInput.addEventListener('input', (e) => {
            updateImagePreview(e.target.value);
        });
    }

    // Botón de búsqueda de imagen
    if (searchImageBtn) {
        searchImageBtn.addEventListener('click', () => {
            if (typeof window.openImageSearchModal === 'function') {
                window.openImageSearchModal();
            }
        });
    }
}

// Agregar fila de plan
function addPlanRow() {
    const plansContainer = document.getElementById('plansContainer');
    if (!plansContainer) return;

    const planItem = document.createElement('div');
    planItem.className = 'plan-item flex items-center gap-2 mb-2';
    planItem.innerHTML = `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
            <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name" required>
            <input type="number" step="0.01" min="0" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles">
            <input type="number" step="0.01" min="0" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars">
        </div>
        <button type="button" class="remove-plan text-red-500 hover:text-red-700 p-2">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Agregar event listener para eliminar plan
    const removeBtn = planItem.querySelector('.remove-plan');
    removeBtn.addEventListener('click', () => {
        // No permitir eliminar si solo queda un plan
        if (document.querySelectorAll('.plan-item').length > 1) {
            planItem.remove();
        }
    });

    plansContainer.appendChild(planItem);
}

// Manejar envío del formulario de producto
async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const photo_url = document.getElementById('photo_url').value;

    // Validaciones básicas
    if (!name || !description || !category || !photo_url) {
        showNotification('Por favor completa todos los campos obligatorios', 'error');
        return;
    }

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

    // Validar que haya al menos un plan
    if (plans.length === 0) {
        showNotification('Debe agregar al menos un plan', 'error');
        return;
    }

    const productData = {
        name,
        description,
        category_id: category,
        photo_url,
        plans
    };

    try {
        let result;
        if (productId) {
            // Editar producto existente
            if (typeof window.updateProduct === 'function') {
                result = await window.updateProduct(productId, productData);
            }
        } else {
            // Agregar nuevo producto
            if (typeof window.addProduct === 'function') {
                result = await window.addProduct(productData);
            }
        }

        if (result) {
            showNotification(productId ? 'Producto actualizado correctamente' : 'Producto agregado correctamente', 'success');
            resetForm();
            
            // Recargar productos
            if (typeof window.loadProducts === 'function') {
                await window.loadProducts();
            }
        }
    } catch (error) {
        console.error('Error al procesar el producto:', error);
        showNotification('Error al procesar el producto: ' + error.message, 'error');
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
            addPlanRow();
        }
        
        // Limpiar vista previa de imagen
        updateImagePreview('');
    }
}

// Actualizar vista previa de imagen
function updateImagePreview(url) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    if (url && url.trim() !== '') {
        imagePreview.innerHTML = `
            <img src="${url}" 
                 alt="Vista previa" 
                 class="w-full h-full object-contain"
                 onerror="this.parentElement.innerHTML='<p class=\\"text-red-500\\">Error al cargar imagen</p>'">
        `;
    } else {
        imagePreview.innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
    }
}

// Preparar formulario para edición
export function prepareEditForm(product) {
    if (!product) return;

    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name || '';
    document.getElementById('category').value = product.category_id || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('photo_url').value = product.photo_url || '';
    
    const formTitle = document.getElementById('formTitle');
    const submitText = document.getElementById('submitText');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (formTitle) formTitle.textContent = 'Editar Producto';
    if (submitText) submitText.textContent = 'Actualizar Producto';
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    
    // Actualizar vista previa de imagen
    updateImagePreview(product.photo_url);
    
    // Llenar planes
    const plansContainer = document.getElementById('plansContainer');
    if (plansContainer) {
        plansContainer.innerHTML = '';
        
        if (product.plans && product.plans.length > 0) {
            product.plans.forEach(plan => {
                const planItem = document.createElement('div');
                planItem.className = 'plan-item flex items-center gap-2 mb-2';
                planItem.innerHTML = `
                    <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name" value="${plan.name || ''}" required>
                        <input type="number" step="0.01" min="0" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles" value="${plan.price_soles || ''}">
                        <input type="number" step="0.01" min="0" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars" value="${plan.price_dollars || ''}">
                    </div>
                    <button type="button" class="remove-plan text-red-500 hover:text-red-700 p-2">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Agregar event listener para eliminar plan
                const removeBtn = planItem.querySelector('.remove-plan');
                removeBtn.addEventListener('click', () => {
                    if (document.querySelectorAll('.plan-item').length > 1) {
                        planItem.remove();
                    }
                });
                
                plansContainer.appendChild(planItem);
            });
        } else {
            addPlanRow();
        }
    }
    
    // Scroll al formulario
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Helper function para mostrar notificaciones
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type}: ${message}`);
    }
}

// Hacer funciones disponibles globalmente
window.prepareEditForm = prepareEditForm;
window.resetProductForm = resetForm;
