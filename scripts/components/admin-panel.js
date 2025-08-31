// scripts/components/admin-panel.js
import { addCategory, renderCategoriesList } from '../categories.js';
import { openCategoriesModal } from '../modals.js';
import { validateRequired, validateUrl, validateNumber, showNotification } from '../utils.js';

// Inicializar panel de administración
export function initAdminPanel() {
    try {
        console.log('🛠️ Inicializando panel de administración...');
        
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

        // Configurar formulario de producto solo si el usuario está autenticado
        if (typeof window.isAuthenticated === 'function' && window.isAuthenticated()) {
            setupProductForm();
        }
        
        console.log('✅ Panel de administración inicializado');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showNotification('Error al inicializar el panel de administración', 'error');
    }
}

// Configurar el formulario de producto
export function setupProductForm() {
    const productForm = document.getElementById('productForm');
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const photoUrlInput = document.getElementById('photo_url');
    const searchImageBtn = document.getElementById('searchImageBtn');

    if (!productForm) {
        console.error('Formulario de producto no encontrado');
        return;
    }

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
        
        // Validar URL en tiempo real
        photoUrlInput.addEventListener('blur', (e) => {
            if (e.target.value && !validateUrl(e.target.value)) {
                showNotification('La URL de la imagen no es válida', 'error');
                e.target.focus();
            }
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
    
    console.log('✅ Formulario de producto configurado');
}

// Agregar fila de plan
function addPlanRow() {
    const plansContainer = document.getElementById('plansContainer');
    if (!plansContainer) return;

    const planId = Date.now() + Math.random().toString(36).substr(2, 5);
    const planItem = document.createElement('div');
    planItem.className = 'plan-item flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg';
    planItem.innerHTML = `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
            <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
            <input type="number" step="0.01" min="0" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <input type="number" step="0.01" min="0" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        </div>
        <button type="button" class="remove-plan text-red-500 hover:text-red-700 p-2 transition-colors duration-200" title="Eliminar plan">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Agregar event listener para eliminar plan
    const removeBtn = planItem.querySelector('.remove-plan');
    removeBtn.addEventListener('click', () => {
        const planItems = document.querySelectorAll('.plan-item');
        if (planItems.length > 1) {
            planItem.remove();
            showNotification('Plan eliminado', 'info');
        } else {
            showNotification('Debe haber al menos un plan', 'warning');
        }
    });

    plansContainer.appendChild(planItem);
    
    // Enfocar el primer campo del nuevo plan
    const firstInput = planItem.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Validar formulario de producto
function validateProductForm(formData) {
    const errors = [];
    
    if (!validateRequired(formData.name)) {
        errors.push('El nombre del producto es requerido');
    }
    
    if (!validateRequired(formData.category)) {
        errors.push('La categoría es requerida');
    }
    
    if (!validateRequired(formData.description)) {
        errors.push('La descripción es requerida');
    }
    
    if (!validateUrl(formData.photo_url)) {
        errors.push('La URL de la imagen no es válida');
    }
    
    // Validar planes
    const planItems = document.querySelectorAll('.plan-item');
    if (planItems.length === 0) {
        errors.push('Debe agregar al menos un plan');
    } else {
        planItems.forEach((item, index) => {
            const name = item.querySelector('.plan-name').value;
            const priceSoles = item.querySelector('.plan-price-soles').value;
            const priceDollars = item.querySelector('.plan-price-dollars').value;
            
            if (!validateRequired(name)) {
                errors.push(`El nombre del plan ${index + 1} es requerido`);
            }
            
            const hasSoles = validateNumber(priceSoles) && parseFloat(priceSoles) >= 0;
            const hasDollars = validateNumber(priceDollars) && parseFloat(priceDollars) >= 0;
            
            if (!hasSoles && !hasDollars) {
                errors.push(`El plan ${index + 1} debe tener al menos un precio (soles o dólares)`);
            }
        });
    }
    
    return errors;
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

    // Validar formulario
    const validationErrors = validateProductForm(productData);
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => showNotification(error, 'error'));
        return;
    }

    try {
        let result;
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        
        if (productId) {
            if (typeof window.updateProduct === 'function') {
                result = await window.updateProduct(productId, productData);
            }
        } else {
            if (typeof window.addProduct === 'function') {
                result = await window.addProduct(productData);
            }
        }

        if (result) {
            showNotification(productId ? 'Producto actualizado correctamente' : 'Producto agregado correctamente', 'success');
            resetForm();
            
            if (typeof window.loadProducts === 'function') {
                await window.loadProducts();
            }
        }
    } catch (error) {
        console.error('Error al procesar el producto:', error);
        showNotification('Error al procesar el producto: ' + error.message, 'error');
    } finally {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = productId ? 'Actualizar Producto' : 'Agregar Producto';
            submitBtn.disabled = false;
        }
    }
}

// Resetear formulario
export function resetForm() {
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
        
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            plansContainer.innerHTML = '';
            addPlanRow();
        }
        
        updateImagePreview('');
        
        // Enfocar el primer campo
        const firstInput = productForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Actualizar vista previa de imagen
function updateImagePreview(url) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    if (url && url.trim() !== '') {
        imagePreview.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <img src="${url}" 
                     alt="Vista previa" 
                     class="w-full h-full object-contain"
                     onerror="this.parentElement.innerHTML='<p class=\\"text-red-500 p-4\\">Error al cargar imagen</p>'">
            </div>
        `;
    } else {
        imagePreview.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                <p>La imagen aparecerá aquí</p>
            </div>
        `;
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
    
    updateImagePreview(product.photo_url);
    
    const plansContainer = document.getElementById('plansContainer');
    if (plansContainer) {
        plansContainer.innerHTML = '';
        
        if (product.plans && product.plans.length > 0) {
            product.plans.forEach(plan => {
                const planItem = document.createElement('div');
                planItem.className = 'plan-item flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg';
                planItem.innerHTML = `
                    <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="${plan.name || ''}" required>
                        <input type="number" step="0.01" min="0" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent" value="${plan.price_soles || ''}">
                        <input type="number" step="0.01" min="0" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="${plan.price_dollars || ''}">
                    </div>
                    <button type="button" class="remove-plan text-red-500 hover:text-red-700 p-2 transition-colors duration-200" title="Eliminar plan">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
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
        productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Enfocar el primer campo
    const firstInput = productForm.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Función para editar producto
export function editProduct(id) {
    if (typeof window.getProductById !== 'function') {
        console.error('getProductById no está disponible');
        showNotification('Error: Función no disponible', 'error');
        return;
    }
    
    const product = window.getProductById(id);
    if (product) {
        prepareEditForm(product);
    } else {
        console.error('Producto no encontrado:', id);
        if (typeof window.showError === 'function') {
            window.showError('Producto no encontrado');
        }
    }
}

// Hacer funciones disponibles globalmente
window.prepareEditForm = prepareEditForm;
window.resetProductForm = resetForm;
window.initAdminPanel = initAdminPanel;
window.setupProductForm = setupProductForm;
window.editProduct = editProduct;
