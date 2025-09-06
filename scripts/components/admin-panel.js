// scripts/components/admin-panel.js
import { addCategory, renderCategoriesList, openCategoryModal } from '../categories.js';
import { showConfirmationModal } from '../modals.js';
import { Utils } from '../utils.js';

// Inicializar panel de administración
export function initAdminPanel() {
    try {
        // Botón para gestionar categorías
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', () => {
                // Abrir modal de categorías
                openCategoryModal();
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

        // Configurar formulario de producto solo si el usuario está autenticado
        if (typeof window.isAuthenticated === 'function' && window.isAuthenticated()) {
            setupProductForm();
            
            // Cargar productos en el panel de administración
            loadAdminProducts();
        }
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        Utils.showError('❌ Error al inicializar el panel de administración');
    }
}

// Cargar productos en el panel de administración
async function loadAdminProducts() {
    try {
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
            
            if (typeof window.renderAdminProductsList === 'function') {
                const adminProductsList = document.getElementById('adminProductsList');
                if (adminProductsList) {
                    const products = window.getProducts ? window.getProducts() : [];
                    window.renderAdminProductsList(products, adminProductsList);
                }
            }
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
        Utils.showError('❌ Error al cargar productos en el panel de administración');
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

        // Guardar la selección actual si existe
        const currentValue = categorySelect.value;
        
        // Limpiar y poblar el selector
        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
        
        // Restaurar la selección anterior si existe
        if (currentValue) {
            categorySelect.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading categories into select:', error);
    }
}

// Configurar el formulario de producto
export function setupProductForm() {
    const productForm = document.getElementById('productForm');
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const photoUrlInput = document.getElementById('photo_url');

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
        photoUrlInput.addEventListener('input', Utils.debounce((e) => {
            updateImagePreview(e.target.value);
        }, 300));
        
        // Validar URL en tiempo real
        photoUrlInput.addEventListener('blur', (e) => {
            if (e.target.value && !Utils.validateUrl(e.target.value)) {
                Utils.showError('❌ La URL de la imagen no es válida');
                e.target.focus();
            }
        });
    }
    
    // Cargar categorías en el selector
    loadCategoriesIntoSelect();
}

// Agregar fila de plan
function addPlanRow() {
    const plansContainer = document.getElementById('plansContainer');
    if (!plansContainer) return;

    const planId = Date.now();
    const planItem = document.createElement('div');
    planItem.className = 'plan-item flex items-center gap-3 mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300 hover:border-blue-300';
    planItem.innerHTML = `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del plan</label>
                <input type="text" placeholder="Ej: Básico, Premium" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                       required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio S/.</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio $</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
            </div>
        </div>
        <button type="button" class="remove-plan mt-6 text-red-500 hover:text-red-700 p-2 transition-colors duration-200 transform hover:scale-110" 
                title="Eliminar plan">
            <i class="fas fa-times-circle"></i>
        </button>
    `;

    // Agregar event listener para eliminar plan
    const removeBtn = planItem.querySelector('.remove-plan');
    removeBtn.addEventListener('click', () => {
        const planItems = document.querySelectorAll('.plan-item');
        if (planItems.length > 1) {
            // Animación de eliminación
            planItem.style.opacity = '0';
            planItem.style.height = `${planItem.offsetHeight}px`;
            
            setTimeout(() => {
                planItem.style.height = '0';
                planItem.style.marginBottom = '0';
                planItem.style.paddingTop = '0';
                planItem.style.paddingBottom = '0';
                planItem.style.overflow = 'hidden';
                
                setTimeout(() => {
                    planItem.remove();
                }, 300);
            }, 50);
        } else {
            Utils.showWarning('⚠️ Debe haber al menos un plan');
        }
    });

    plansContainer.appendChild(planItem);
    
    // Animación de entrada
    setTimeout(() => {
        planItem.style.transform = 'translateY(0)';
        planItem.style.opacity = '1';
    }, 10);
    
    // Enfocar el primer campo del nuevo plan
    const firstInput = planItem.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Validar formulario de producto
function validateProductForm(formData) {
    const errors = [];
    
    if (!Utils.validateRequired(formData.name)) {
        errors.push('El nombre del producto es requerido');
    }
    
    if (!Utils.validateRequired(formData.category_id)) {
        errors.push('La categoría es requerida');
    }
    
    if (!Utils.validateRequired(formData.description)) {
        errors.push('La descripción es requerida');
    }
    
    if (!Utils.validateUrl(formData.photo_url)) {
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
            
            if (!Utils.validateRequired(name)) {
                errors.push(`El nombre del plan ${index + 1} es requerido`);
            }
            
            const hasSoles = Utils.validateNumber(priceSoles) && parseFloat(priceSoles) >= 0;
            const hasDollars = Utils.validateNumber(priceDollars) && parseFloat(priceDollars) >= 0;
            
            if (!hasSoles && !hasDollars) {
                errors.push(`El plan ${index + 1} debe tener al menos un precio válido (soles o dólares)`);
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
        validationErrors.forEach(error => Utils.showError(`❌ ${error}`));
        
        // Resaltar campos con error
        validationErrors.forEach(error => {
            if (error.includes('nombre')) {
                document.getElementById('name').classList.add('border-red-500');
            }
            if (error.includes('categoría')) {
                document.getElementById('category').classList.add('border-red-500');
            }
            if (error.includes('descripción')) {
                document.getElementById('description').classList.add('border-red-500');
            }
            if (error.includes('imagen')) {
                document.getElementById('photo_url').classList.add('border-red-500');
            }
        });
        
        return;
    }

    try {
        let result;
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75');
        
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
            // Animación de éxito
            submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Éxito!';
            submitBtn.classList.remove('bg-blue-600', 'opacity-75');
            submitBtn.classList.add('bg-green-600');
            
            setTimeout(() => {
                Utils.showSuccess(productId ? '✅ Producto actualizado correctamente' : '✅ Producto agregado correctamente');
                resetForm();
                
                // Recargar productos en el panel de administración
                loadAdminProducts();
                
                // Restaurar botón después de 2 segundos
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('bg-green-600');
                    submitBtn.classList.add('bg-blue-600');
                }, 2000);
            }, 500);
        }
    } catch (error) {
        console.error('Error al procesar el producto:', error);
        Utils.showError(`❌ Error al procesar el producto: ${error.message}`);
        
        // Restaurar botón
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = productId ? 'Actualizar Producto' : 'Agregar Producto';
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75');
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
        
        // Recargar categorías en el selector
        loadCategoriesIntoSelect();
        
        // Enfocar el primer campo
        const firstInput = productForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Remover clases de error
        const errorInputs = productForm.querySelectorAll('.border-red-500');
        errorInputs.forEach(input => input.classList.remove('border-red-500'));
    }
}

// Actualizar vista previa de imagen
function updateImagePreview(url) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    if (url && url.trim() !== '') {
        imagePreview.innerHTML = `
            <div class="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative group">
                <img src="${url}" 
                     alt="Vista previa" 
                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     onerror="this.parentElement.innerHTML='<div class=\\"w-full h-full flex items-center justify-center\\"><p class=\\"text-red-500 p-4 text-center\\">❌ Error al cargar imagen</p></div>'">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
            </div>
        `;
    } else {
        imagePreview.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                <div class="text-center">
                    <i class="fas fa-image text-2xl mb-2"></i>
                    <p class="text-sm">La imagen aparecerá aquí</p>
                </div>
            </div>
        `;
    }
}

// Preparar formulario para edición
export function prepareEditForm(product) {
    if (!product) return;

    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('photo_url').value = product.photo_url || '';
    
    // Cargar categorías antes de establecer el valor
    loadCategoriesIntoSelect().then(() => {
        if (product.category_id) {
            document.getElementById('category').value = product.category_id;
        }
    });
    
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
                planItem.className = 'plan-item flex items-center gap-3 mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200';
                planItem.innerHTML = `
                    <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del plan</label>
                            <input type="text" placeholder="Ej: Básico, Premium" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                   value="${plan.name || ''}" 
                                   required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio S/.</label>
                            <input type="number" step="0.01" min="0" placeholder="0.00" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                   value="${plan.price_soles || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio $</label>
                            <input type="number" step="0.01" min="0" placeholder="0.00" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                   value="${plan.price_dollars || ''}">
                        </div>
                    </div>
                    <button type="button" class="remove-plan mt-6 text-red-500 hover:text-red-700 p-2 transition-colors duration-200" 
                            title="Eliminar plan">
                        <i class="fas fa-times-circle"></i>
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
        Utils.showError('❌ Error: Función no disponible');
        return;
    }
    
    const product = window.getProductById(id);
    if (product) {
        prepareEditForm(product);
    } else {
        console.error('Producto no encontrado:', id);
        Utils.showError('❌ Producto no encontrado');
    }
}

// Hacer funciones disponibles globalmente
window.prepareEditForm = prepareEditForm;
window.resetProductForm = resetForm;
window.initAdminPanel = initAdminPanel;
window.setupProductForm = setupProductForm;
window.editProduct = editProduct;
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.isAuthenticated === 'function' && window.isAuthenticated()) {
            initAdminPanel();
        }
    });
}
