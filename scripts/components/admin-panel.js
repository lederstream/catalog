// scripts/components/admin-panel.js
import { addCategory, renderCategoriesList } from '../categories.js';
import { openCategoriesModal } from '../modals.js';
import { validateRequired, validateUrl, validateNumber, showNotification, debounce } from '../utils.js';

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
            setupRealTimeValidation();
        }
        
        console.log('✅ Panel de administración inicializado');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showNotification('Error al inicializar el panel de administración', 'error');
    }
}

// Configurar validación en tiempo real
function setupRealTimeValidation() {
    const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');
    const photoUrlInput = document.getElementById('photo_url');
    
    if (nameInput) {
        nameInput.addEventListener('input', debounce(() => {
            validateField(nameInput, validateRequired, 'El nombre es requerido');
        }, 500));
    }
    
    if (descriptionInput) {
        descriptionInput.addEventListener('input', debounce(() => {
            validateField(descriptionInput, validateRequired, 'La descripción es requerida');
        }, 500));
    }
    
    if (photoUrlInput) {
        photoUrlInput.addEventListener('input', debounce(() => {
            if (photoUrlInput.value) {
                validateField(photoUrlInput, validateUrl, 'La URL de la imagen no es válida');
            }
        }, 500));
    }
}

// Validar campo individual
function validateField(field, validator, errorMessage) {
    const isValid = validator(field.value);
    const errorElement = document.getElementById(`${field.id}Error`);
    
    if (errorElement) {
        if (!isValid && field.value) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
            field.classList.add('border-red-500');
            field.classList.remove('border-green-500');
        } else {
            errorElement.classList.add('hidden');
            field.classList.remove('border-red-500');
            if (field.value && isValid) {
                field.classList.add('border-green-500');
            }
        }
    }
    
    return isValid;
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
        
        // Validar si hay una selección
        validateField(categorySelect, validateRequired, 'La categoría es requerida');
    } catch (error) {
        console.error('Error loading categories into select:', error);
        showNotification('Error al cargar categorías', 'error');
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
    
    // Cargar categorías en el selector
    loadCategoriesIntoSelect();
    
    console.log('✅ Formulario de producto configurado');
}

// Agregar fila de plan con animación
function addPlanRow() {
    const plansContainer = document.getElementById('plansContainer');
    if (!plansContainer) return;

    const planId = Date.now() + Math.random().toString(36).substr(2, 5);
    const planItem = document.createElement('div');
    planItem.className = 'plan-item flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg opacity-0 transform scale-95 transition-all duration-300';
    planItem.innerHTML = `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
                <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <div class="plan-name-error text-red-500 text-xs mt-1 hidden"></div>
            </div>
            <div>
                <input type="number" step="0.01" min="0" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <div class="plan-price-soles-error text-red-500 text-xs mt-1 hidden"></div>
            </div>
            <div>
                <input type="number" step="0.01" min="0" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <div class="plan-price-dollars-error text-red-500 text-xs mt-1 hidden"></div>
            </div>
        </div>
        <button type="button" class="remove-plan text-red-500 hover:text-red-700 p-2 transition-colors duration-200 hover:scale-110" title="Eliminar plan">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Agregar event listener para eliminar plan
    const removeBtn = planItem.querySelector('.remove-plan');
    removeBtn.addEventListener('click', () => {
        const planItems = document.querySelectorAll('.plan-item');
        if (planItems.length > 1) {
            // Animación de salida
            planItem.style.opacity = '0';
            planItem.style.transform = 'scale(0.9) translateX(20px)';
            setTimeout(() => {
                planItem.remove();
                showNotification('Plan eliminado', 'info');
            }, 300);
        } else {
            showNotification('Debe haber al menos un plan', 'warning');
        }
    });

    // Agregar validación en tiempo real para los campos del plan
    const nameInput = planItem.querySelector('.plan-name');
    const priceSolesInput = planItem.querySelector('.plan-price-soles');
    const priceDollarsInput = planItem.querySelector('.plan-price-dollars');
    
    if (nameInput) {
        nameInput.addEventListener('input', debounce(() => {
            validatePlanField(nameInput, validateRequired, 'El nombre del plan es requerido');
        }, 500));
    }
    
    if (priceSolesInput) {
        priceSolesInput.addEventListener('input', debounce(() => {
            validatePlanField(priceSolesInput, (value) => !value || validateNumber(value), 'El precio debe ser un número válido');
        }, 500));
    }
    
    if (priceDollarsInput) {
        priceDollarsInput.addEventListener('input', debounce(() => {
            validatePlanField(priceDollarsInput, (value) => !value || validateNumber(value), 'El precio debe ser un número válido');
        }, 500));
    }

    plansContainer.appendChild(planItem);
    
    // Animación de entrada
    setTimeout(() => {
        planItem.style.opacity = '1';
        planItem.style.transform = 'scale(1)';
    }, 10);
    
    // Enfocar el primer campo del nuevo plan
    const firstInput = planItem.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Validar campo de plan
function validatePlanField(field, validator, errorMessage) {
    const isValid = validator(field.value);
    const errorElement = field.nextElementSibling;
    
    if (errorElement && errorElement.classList.contains('hidden')) {
        if (!isValid && field.value) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
            field.classList.add('border-red-500');
            field.classList.remove('border-green-500');
        } else {
            errorElement.classList.add('hidden');
            field.classList.remove('border-red-500');
            if (field.value && isValid) {
                field.classList.add('border-green-500');
            }
        }
    }
    
    return isValid;
}

// Validar formulario de producto
function validateProductForm(formData) {
    const errors = [];
    
    if (!validateRequired(formData.name)) {
        errors.push('El nombre del producto es requerido');
    }
    
    if (!validateRequired(formData.category_id)) {
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
        
        // Mostrar errores específicos en los campos
        if (!validateRequired(name)) {
            document.getElementById('name').classList.add('border-red-500');
        }
        if (!validateRequired(category)) {
            document.getElementById('category').classList.add('border-red-500');
        }
        if (!validateRequired(description)) {
            document.getElementById('description').classList.add('border-red-500');
        }
        if (!validateUrl(photo_url)) {
            document.getElementById('photo_url').classList.add('border-red-500');
        }
        
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
            
            // Animación de éxito
            const form = document.getElementById('productForm');
            form.classList.add('bg-green-50');
            setTimeout(() => {
                form.classList.remove('bg-green-50');
                resetForm();
            }, 1000);
            
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

// Resetear formulario con animación
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
        
        // Limpiar estilos de validación
        const inputs = productForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('border-red-500', 'border-green-500');
            const errorElement = document.getElementById(`${input.id}Error`);
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
        });
        
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            // Animación de eliminación para planes existentes
            const planItems = plansContainer.querySelectorAll('.plan-item');
            planItems.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9) translateX(-20px)';
                setTimeout(() => {
                    item.remove();
                }, index * 50);
            });
            
            // Agregar nuevo plan después de la animación
            setTimeout(() => {
                addPlanRow();
            }, planItems.length * 50 + 100);
        }
        
        updateImagePreview('');
        
        // Recargar categorías en el selector
        loadCategoriesIntoSelect();
        
        // Enfocar el primer campo
        const firstInput = productForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
}

// Actualizar vista previa de imagen con animación
function updateImagePreview(url) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    // Animación de desvanecimiento
    imagePreview.style.opacity = '0';
    
    setTimeout(() => {
        if (url && url.trim() !== '') {
            imagePreview.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                    <img src="${url}" 
                         alt="Vista previa" 
                         class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                         onerror="this.parentElement.innerHTML='<p class=\\"text-red-500 p-4\\">Error al cargar imagen</p>'">
                </div>
            `;
        } else {
            imagePreview.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg text-gray-500">
                    <i class="fas fa-image text-3xl mb-2 opacity-50"></i>
                    <p class="text-sm">La imagen aparecerá aquí</p>
                </div>
            `;
        }
        
        // Restaurar opacidad con animación
        setTimeout(() => {
            imagePreview.style.opacity = '1';
        }, 50);
    }, 300);
}

// Preparar formulario para edición con animación
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
        // Animación de eliminación para planes existentes
        const existingPlans = plansContainer.querySelectorAll('.plan-item');
        existingPlans.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9) translateX(-20px)';
            setTimeout(() => {
                item.remove();
            }, index * 50);
        });
        
        // Agregar planes del producto después de la animación
        setTimeout(() => {
            if (product.plans && product.plans.length > 0) {
                product.plans.forEach((plan, index) => {
                    setTimeout(() => {
                        const planItem = document.createElement('div');
                        planItem.className = 'plan-item flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg opacity-0 transform scale-95 transition-all duration-300';
                        planItem.innerHTML = `
                            <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                    <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="${plan.name || ''}" required>
                                    <div class="plan-name-error text-red-500 text-xs mt-1 hidden"></div>
                                </div>
                                <div>
                                    <input type="number" step="0.01" min="0" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent" value="${plan.price_soles || ''}">
                                    <div class="plan-price-soles-error text-red-500 text-xs mt-1 hidden"></div>
                                </div>
                                <div>
                                    <input type="number" step="0.01" min="0" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="${plan.price_dollars || ''}">
                                    <div class="plan-price-dollars-error text-red-500 text-xs mt-1 hidden"></div>
                                </div>
                            </div>
                            <button type="button" class="remove-plan text-red-500 hover:text-red-700 p-2 transition-colors duration-200 hover:scale-110" title="Eliminar plan">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        
                        const removeBtn = planItem.querySelector('.remove-plan');
                        removeBtn.addEventListener('click', () => {
                            if (document.querySelectorAll('.plan-item').length > 1) {
                                // Animación de salida
                                planItem.style.opacity = '0';
                                planItem.style.transform = 'scale(0.9) translateX(20px)';
                                setTimeout(() => {
                                    planItem.remove();
                                }, 300);
                            }
                        });
                        
                        // Agregar validación en tiempo real
                        const nameInput = planItem.querySelector('.plan-name');
                        const priceSolesInput = planItem.querySelector('.plan-price-soles');
                        const priceDollarsInput = planItem.querySelector('.plan-price-dollars');
                        
                        if (nameInput) {
                            nameInput.addEventListener('input', debounce(() => {
                                validatePlanField(nameInput, validateRequired, 'El nombre del plan es requerido');
                            }, 500));
                        }
                        
                        if (priceSolesInput) {
                            priceSolesInput.addEventListener('input', debounce(() => {
                                validatePlanField(priceSolesInput, (value) => !value || validateNumber(value), 'El precio debe ser un número válido');
                            }, 500));
                        }
                        
                        if (priceDollarsInput) {
                            priceDollarsInput.addEventListener('input', debounce(() => {
                                validatePlanField(priceDollarsInput, (value) => !value || validateNumber(value), 'El precio debe ser un número válido');
                            }, 500));
                        }
                        
                        plansContainer.appendChild(planItem);
                        
                        // Animación de entrada
                        setTimeout(() => {
                            planItem.style.opacity = '1';
                            planItem.style.transform = 'scale(1)';
                        }, 10);
                    }, index * 100);
                });
            } else {
                addPlanRow();
            }
        }, existingPlans.length * 50 + 100);
    }
    
    // Scroll al formulario con animación suave
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Enfocar el primer campo
    const firstInput = productForm.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
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
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;
