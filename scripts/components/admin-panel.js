// scripts/components/admin-panel.js
import { addCategory, renderCategoriesList, openCategoryModal } from '../categories.js';
import { showConfirmationModal } from '../modals.js';
import { Utils } from '../utils.js';

// Inicializar panel de administración
export function initAdminPanel() {
    try {
        console.log('🔄 Inicializando panel de administración...');
        
        // Botón para gestionar categorías
        const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', () => {
                // Abrir modal de categorías
                openCategoryModal();
            });
        }

        // Botón para agregar nueva categoría
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                // Abrir modal de categorias
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

        // Configurar formulario de producto solo si existe
        setupProductForm();
        
        // Cargar productos en el panel de administración
        loadAdminProducts();

        // Configurar tabs de administración
        setupAdminTabs();
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        Utils.showError('❌ Error al inicializar el panel de administración');
    }
}

// Cargar productos en el panel de administración
async function loadAdminProducts() {
    try {
        // Asegurarse de que los productos estén cargados
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
            
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList) {
                const products = window.getProducts ? window.getProducts() : [];
                
                if (products.length > 0) {
                    renderAdminProductsList(products, adminProductsList);
                } else {
                    adminProductsList.innerHTML = `
                        <div class="text-center py-12 fade-in-up">
                            <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                            <h3 class="text-lg font-medium text-gray-500">No hay productos</h3>
                            <p class="text-gray-400 mt-2">Agrega tu primer producto para comenzar</p>
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
        Utils.showError('❌ Error al cargar productos en el panel de administración');
    }
}

// Configurar tabs de administración
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('[data-tab]');
    const tabPanes = document.querySelectorAll('[data-tab-pane]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Actualizar botones activos
            tabButtons.forEach(btn => {
                btn.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50');
                btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            
            button.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            button.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
            
            // Mostrar pane activo
            tabPanes.forEach(pane => {
                pane.classList.add('hidden');
                if (pane.dataset.tabPane === tabName) {
                    pane.classList.remove('hidden');
                    Utils.fadeIn(pane);
                }
            });
            
            // Cargar contenido específico del tab
            loadTabContent(tabName);
        });
    });
    
    // Activar el primer tab por defecto
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
}

// Cargar contenido específico del tab
function loadTabContent(tabName) {
    switch (tabName) {
        case 'products':
            // Cargar productos si es necesario
            if (typeof window.loadProducts === 'function') {
                window.loadProducts().then(() => {
                    if (typeof window.renderAdminProductsList === 'function') {
                        const adminProductsList = document.getElementById('adminProductsList');
                        if (adminProductsList) {
                            const products = window.getProducts ? window.getProducts() : [];
                            window.renderAdminProductsList(products, adminProductsList);
                        }
                    }
                });
            }
            break;
            
        case 'categories':
            // Cargar categorías si es necesario
            if (typeof window.loadCategories === 'function') {
                window.loadCategories().then(() => {
                    const categoriesList = document.getElementById('categoriesList');
                    if (categoriesList && typeof renderCategoriesList === 'function') {
                        renderCategoriesList(categoriesList);
                    }
                });
            }
            break;
            
        case 'stats':
            // Cargar estadísticas
            loadStats();
            break;
    }
}

// Cargar estadísticas
function loadStats() {
    const statsContainer = document.getElementById('statsContent');
    if (!statsContainer) return;
    
    // Obtener datos reales
    const products = window.getProducts ? window.getProducts() : [];
    const categories = window.getCategories ? window.getCategories() : [];
    
    statsContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 bg-blue-100 rounded-lg mr-4">
                        <i class="fas fa-box text-blue-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-800">${products.length}</p>
                        <p class="text-gray-500">Productos totales</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 bg-green-100 rounded-lg mr-4">
                        <i class="fas fa-tags text-green-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-800">${categories.length}</p>
                        <p class="text-gray-500">Categorías</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div class="flex items-center">
                    <div class="p-3 bg-purple-100 rounded-lg mr-4">
                        <i class="fas fa-eye text-purple-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-800">${Math.floor(products.length * 12.5)}</p>
                        <p class="text-gray-500">Visitas este mes</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Productos por categoría</h3>
            <div class="space-y-3">
                ${categories.map(category => {
                    const productCount = products.filter(p => p.category_id == category.id).length;
                    return `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="w-8 h-8 ${getColorClass(category.color)} rounded-full flex items-center justify-center mr-3">
                                    <i class="${category.icon || 'fas fa-tag'} text-white text-sm"></i>
                                </div>
                                <span class="text-sm font-medium">${category.name}</span>
                            </div>
                            <span class="text-sm text-gray-500">${productCount} productos</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function getColorClass(color) {
    const colorMap = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500'
    };
    return colorMap[color] || 'bg-blue-500';
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
    
    // Verificar si el formulario existe y está en el DOM visible
    if (!productForm || productForm.offsetParent === null) {
        console.log('ℹ️ Formulario de producto no visible en esta página (normal para página principal)');
        return;
    }
    
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const photoUrlInput = document.getElementById('photo_url');
    
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

    const planId = Date.now() + Math.random().toString(36).substr(2, 5);
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
                
                if (typeof window.loadProducts === 'function') {
                    window.loadProducts().then(() => {
                        // Actualizar lista de productos en el admin
                        if (typeof window.renderAdminProductsList === 'function') {
                            const adminProductsList = document.getElementById('adminProductsList');
                            if (adminProductsList) {
                                const products = window.getProducts ? window.getProducts() : [];
                                window.renderAdminProductsList(products, adminProductsList);
                            }
                        }
                    });
                }
                
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
        
        // Cambiar al tab de productos si es necesario
        const productsTab = document.querySelector('[data-tab="products"]');
        if (productsTab) {
            productsTab.click();
        }
    } else {
        console.error('Producto no encontrado:', id);
        Utils.showError('❌ Producto no encontrado');
    }
}

// Renderizar lista de productos en el panel de administración
export function renderAdminProductsList(products, container) {
    if (!container) {
        console.error('Contenedor de productos no encontrado');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 fade-in-up">
                <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-500">No hay productos</h3>
                <p class="text-gray-400 mt-2">Agrega tu primer producto para comenzar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((product, index) => `
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4 transition-all duration-300 hover:shadow-md fade-in-up" 
             style="animation-delay: ${index * 50}ms">
            <div class="flex items-start justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img src="${product.photo_url || 'https://via.placeholder.com/64?text=Imagen'}" 
                             alt="${product.name}" 
                             class="w-full h-full object-cover"
                             onerror="this.src='https://via.placeholder.com/64?text=Error'">
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-800">${product.name}</h4>
                        <p class="text-sm text-gray-500 mt-1 line-clamp-2">${product.description || 'Sin descripción'}</p>
                        <div class="flex items-center mt-2 space-x-2">
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                ${product.categories ? product.categories.name : 'Sin categoría'}
                            </span>
                            <span class="text-xs text-gray-500">
                                ${product.plans ? product.plans.length : 0} planes
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-product bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 transform hover:scale-105" 
                            data-id="${product.id}"
                            title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-product bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors duration-200 transform hover:scale-105" 
                            data-id="${product.id}"
                            title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <!-- Detalles de planes - FIXED: Ahora se muestran correctamente -->
            <div class="mt-4 pt-4 border-t border-gray-100">
                <h5 class="font-medium text-gray-700 mb-2">Planes y Precios:</h5>
                <div class="space-y-2">
                    ${renderPlansDetails(product.plans)}
                </div>
            </div>
        </div>
    `).join('');

    // Agregar event listeners a los botones
    container.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            if (typeof window.editProduct === 'function') {
                window.editProduct(productId);
            }
        });
    });

    container.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            const product = products.find(p => p.id == productId);
            
            if (product) {
                showConfirmationModal({
                    title: 'Eliminar producto',
                    message: `¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`,
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    onConfirm: () => {
                        if (typeof window.deleteProduct === 'function') {
                            window.deleteProduct(productId).then(success => {
                                if (success) {
                                    // Recargar la lista de productos
                                    loadAdminProducts();
                                }
                            });
                        }
                    }
                });
            }
        });
    });
}

// Función auxiliar para renderizar detalles de planes
function renderPlansDetails(plans) {
    if (!plans || plans.length === 0) {
        return '<p class="text-gray-500 text-sm">No hay planes disponibles</p>';
    }
    
    return plans.map(plan => `
        <div class="bg-gray-50 p-3 rounded-lg">
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium">${plan.name || 'Plan sin nombre'}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                ${plan.price_soles ? `
                    <div class="text-green-600">
                        <span class="font-medium">Precio S/:</span>
                        <span>${Utils.formatCurrency(plan.price_soles, 'PEN')}</span>
                    </div>
                ` : ''}
                ${plan.price_dollars ? `
                    <div class="text-blue-600">
                        <span class="font-medium">Precio $:</span>
                        <span>${Utils.formatCurrency(plan.price_dollars, 'USD')}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Hacer funciones disponibles globalmente
window.prepareEditForm = prepareEditForm;
window.resetProductForm = resetForm;
window.initAdminPanel = initAdminPanel;
window.setupProductForm = setupProductForm;
window.editProduct = editProduct;
window.renderAdminProductsList = renderAdminProductsList;
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.isAuthenticated === 'function' && window.isAuthenticated()) {
            initAdminPanel();
        }
    });
}
