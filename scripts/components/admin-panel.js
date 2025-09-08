// scripts/components/admin-panel.js - VERSIÓN FINAL
import { renderCategoriesList, openCategoryModal } from '../categories.js';
import { showConfirmationModal } from '../modals.js';
import { Utils } from '../utils.js';
import { getProductManager } from '../products.js';

// Inicializar panel de administración
export function initAdminPanel() {
    try {
        console.log('🔄 Inicializando panel de administración...');
        
        setupEventListeners();
        setupProductForm();
        loadAdminProducts();
        setupAdminTabs();
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
    }
}

function setupEventListeners() {
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const logoutBtn = document.getElementById('logoutBtn');

if (manageCategoriesBtn) manageCategoriesBtn.addEventListener('click', () => {
        openCategoryModal();
    });
    
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => {
        openCategoryModal();
    });
    
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
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

async function loadAdminProducts() {
    try {
        const manager = await getProductManager();
        await manager.loadProducts();
        const adminProductsList = document.getElementById('adminProductsList');
        
        if (adminProductsList) {
            const products = manager.getProducts();
            if (products.length > 0) manager.renderAdminProductsList(products, adminProductsList);
            else adminProductsList.innerHTML = getEmptyProductsHTML();
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
    }
}

function getEmptyProductsHTML() {
    return `
        <div class="text-center py-12 fade-in-up">
            <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-500">No hay productos</h3>
            <p class="text-gray-400 mt-2">Agrega tu primer producto para comenzar</p>
        </div>
    `;
}

function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('[data-tab]');
    const tabPanes = document.querySelectorAll('[data-tab-pane]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            tabButtons.forEach(btn => {
                btn.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50');
                btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            
            button.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            button.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
            
            tabPanes.forEach(pane => {
                pane.classList.add('hidden');
                if (pane.dataset.tabPane === tabName) {
                    pane.classList.remove('hidden');
                    Utils.fadeIn(pane);
                }
            });
            
            loadTabContent(tabName);
        });
    });
    
    if (tabButtons.length > 0) tabButtons[0].click();
}

async function loadTabContent(tabName) {
    const manager = await getProductManager();
    
    switch (tabName) {
        case 'products':
            await manager.loadProducts();
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList) manager.renderAdminProductsList(manager.getProducts(), adminProductsList);
            break;
            
        case 'categories':
            if (typeof window.loadCategories === 'function') {
                await window.loadCategories();
                const categoriesList = document.getElementById('categoriesList');
                if (categoriesList && typeof renderCategoriesList === 'function') renderCategoriesList(categoriesList);
            }
            break;
            
        case 'stats':
            loadStats();
            break;
    }
}

async function loadStats() {
    const statsContainer = document.getElementById('statsContent');
    if (!statsContainer) return;
    
    const manager = await getProductManager();
    const products = manager.getProducts();
    const categories = window.getCategories ? window.getCategories() : [];
    
    statsContainer.innerHTML = getStatsHTML(products, categories);
}

function getStatsHTML(products, categories) {
    return `
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
    const colorMap = { blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-yellow-500', purple: 'bg-purple-500' };
    return colorMap[color] || 'bg-blue-500';
}

export async function loadCategoriesIntoSelect() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;

    try {
        let categories = [];
        if (window.categoryManager && typeof window.categoryManager.getCategories === 'function') {
            categories = window.categoryManager.getCategories();
        } else if (typeof window.getCategories === 'function') {
            categories = window.getCategories();
        } else if (typeof window.loadCategories === 'function') {
            categories = await window.loadCategories();
        }

        const currentValue = categorySelect.value;
        const productId = document.getElementById('productId')?.value;
        
        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } else {
            categorySelect.innerHTML = '<option value="">No hay categorías disponibles</option>';
        }
        
        if (productId && currentValue) {
            setTimeout(() => {
                if (categorySelect.querySelector(`option[value="${currentValue}"]`)) {
                    categorySelect.value = currentValue;
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Error loading categories into select:', error);
        categorySelect.innerHTML = '<option value="">Error cargando categorías</option>';
    }
}

export function setupProductForm() {
    const productForm = document.getElementById('productForm');
    if (!productForm || productForm.offsetParent === null) return;
    
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const photoUrlInput = document.getElementById('photo_url');
    const categorySelect = document.getElementById('category');
    
    if (!categorySelect) return;
    
    if (addPlanBtn) addPlanBtn.addEventListener('click', addPlanRow);
    if (cancelBtn) cancelBtn.addEventListener('click', resetForm);
    
    productForm.addEventListener('submit', handleProductSubmit);
    addPlanRow();

    if (photoUrlInput) {
        photoUrlInput.addEventListener('input', Utils.debounce((e) => updateImagePreview(e.target.value), 300));
        photoUrlInput.addEventListener('blur', (e) => {
            if (e.target.value && !Utils.validateUrl(e.target.value)) {
                Utils.showError('❌ La URL de la imagen no es válida');
                e.target.focus();
            }
        });
    }
    
    loadCategoriesIntoSelect();
    ensureFormFieldsAreEditable();
}

function ensureFormFieldsAreEditable() {
    const formElements = document.querySelectorAll('#productForm input, #productForm select, #productForm textarea');
    
    formElements.forEach(element => {
        element.removeAttribute('readonly');
        element.removeAttribute('disabled');
        element.classList.remove('pointer-events-none');
        element.style.pointerEvents = 'auto';
        
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        newElement.addEventListener('mousedown', (e) => e.stopPropagation());
        newElement.addEventListener('click', (e) => e.stopPropagation());
        newElement.addEventListener('focus', (e) => e.stopPropagation());
    });
}

function addPlanRow(planData = null) {
    const plansContainer = document.getElementById('plansContainer');
    if (!plansContainer) return;

    const planItem = document.createElement('div');
    planItem.className = 'plan-item flex items-center gap-3 mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300 hover:border-blue-300';
    planItem.innerHTML = getPlanRowHTML(planData);

    const removeBtn = planItem.querySelector('.remove-plan');
    removeBtn.addEventListener('click', () => removePlanRow(planItem));

    plansContainer.appendChild(planItem);
    
    setTimeout(() => {
        planItem.style.transform = 'translateY(0)';
        planItem.style.opacity = '1';
    }, 10);
    
    const firstInput = planItem.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    
    ensureFormFieldsAreEditable();
}

function getPlanRowHTML(planData) {
    return `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del plan</label>
                <input type="text" placeholder="Ej: Básico, Premium" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-name focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                       value="${planData?.name || ''}" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio S/.</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-price-soles focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                       value="${planData?.price_soles !== undefined && planData?.price_soles !== null ? planData.price_soles : ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio $</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg plan-price-dollars focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                       value="${planData?.price_dollars !== undefined && planData?.price_dollars !== null ? planData.price_dollars : ''}">
            </div>
        </div>
        <button type="button" class="remove-plan mt-6 text-red-500 hover:text-red-700 p-2 transition-colors duration-200 transform hover:scale-110" title="Eliminar plan">
            <i class="fas fa-times-circle"></i>
        </button>
    `;
}

function removePlanRow(planItem) {
    const planItems = document.querySelectorAll('.plan-item');
    if (planItems.length > 1) {
        planItem.style.opacity = '0';
        planItem.style.height = `${planItem.offsetHeight}px`;
        
        setTimeout(() => {
            planItem.style.height = '0';
            planItem.style.marginBottom = '0';
            planItem.style.paddingTop = '0';
            planItem.style.paddingBottom = '0';
            planItem.style.overflow = 'hidden';
            
            setTimeout(() => planItem.remove(), 300);
        }, 50);
    } else {
        Utils.showWarning('⚠️ Debe haber al menos un plan');
    }
}

function validateProductForm(formData) {
    const errors = [];
    
    if (!Utils.validateRequired(formData.name)) errors.push('El nombre del producto es requerido');
    if (!formData.category_id || formData.category_id === "") errors.push('La categoría es requerida');
    if (!Utils.validateRequired(formData.description)) errors.push('La descripción es requerida');
    if (!Utils.validateUrl(formData.photo_url)) errors.push('La URL de la imagen no es válida');
    
    const planItems = document.querySelectorAll('.plan-item');
    if (planItems.length === 0) errors.push('Debe agregar al menos un plan');
    else validatePlans(planItems, errors);
    
    return errors;
}

function validatePlans(planItems, errors) {
    planItems.forEach((item, index) => {
        const name = item.querySelector('.plan-name').value;
        const priceSoles = item.querySelector('.plan-price-soles').value;
        const priceDollars = item.querySelector('.plan-price-dollars').value;
        
        if (!Utils.validateRequired(name)) errors.push(`El nombre del plan ${index + 1} es requerido`);
        
        const hasSoles = priceSoles && !isNaN(parseFloat(priceSoles)) && parseFloat(priceSoles) >= 0;
        const hasDollars = priceDollars && !isNaN(parseFloat(priceDollars)) && parseFloat(priceDollars) >= 0;
        
        if (!hasSoles && !hasDollars) errors.push(`El plan ${index + 1} debe tener al menos un precio válido`);
    });
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const photo_url = document.getElementById('photo_url').value;

    const plans = getPlansFromForm();
    const productData = { name, description, category_id: category, photo_url, plans };

    const validationErrors = validateProductForm(productData);
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => Utils.showError(`❌ ${error}`));
        highlightErrorFields(validationErrors);
        return;
    }

    try {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75');
        
        const manager = await getProductManager();
        const result = productId ? await manager.updateProduct(productId, productData) : await manager.addProduct(productData);

        if (result) handleSuccess(submitBtn, originalText, productId);
    } catch (error) {
        handleError(error);
    }
}

function getPlansFromForm() {
    const plans = [];
    document.querySelectorAll('.plan-item').forEach(item => {
        const name = item.querySelector('.plan-name').value.trim();
        const priceSoles = item.querySelector('.plan-price-soles').value;
        const priceDollars = item.querySelector('.plan-price-dollars').value;

        const hasValidSoles = priceSoles && !isNaN(parseFloat(priceSoles)) && parseFloat(priceSoles) > 0;
        const hasValidDollars = priceDollars && !isNaN(parseFloat(priceDollars)) && parseFloat(priceDollars) > 0;

        if (name && (hasValidSoles || hasValidDollars)) {
            plans.push({
                name: name,
                price_soles: hasValidSoles ? parseFloat(priceSoles) : null,
                price_dollars: hasValidDollars ? parseFloat(priceDollars) : null
            });
        }
    });
    return plans;
}

function highlightErrorFields(errors) {
    errors.forEach(error => {
        if (error.includes('nombre')) document.getElementById('name').classList.add('border-red-500');
        if (error.includes('categoría')) document.getElementById('category').classList.add('border-red-500');
        if (error.includes('descripción')) document.getElementById('description').classList.add('border-red-500');
        if (error.includes('imagen')) document.getElementById('photo_url').classList.add('border-red-500');
    });
}

function handleSuccess(submitBtn, originalText, productId) {
    submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Éxito!';
    submitBtn.classList.remove('bg-blue-600', 'opacity-75');
    submitBtn.classList.add('bg-green-600');
    
    setTimeout(() => {
        Utils.showSuccess(productId ? '✅ Producto actualizado correctamente' : '✅ Producto agregado correctamente');
        resetForm();
        loadAdminProducts();
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('bg-green-600');
            submitBtn.classList.add('bg-blue-600');
        }, 2000);
    }, 500);
}

function handleError(error) {
    console.error('Error al procesar el producto:', error);
    Utils.showError(`❌ Error al procesar el producto: ${error.message}`);
    
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = document.getElementById('productId').value ? 'Actualizar Producto' : 'Agregar Producto';
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75');
    }
}

export function resetForm() {
    const productForm = document.getElementById('productForm');
    if (!productForm) return;
    
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
    loadCategoriesIntoSelect();
    
    const nameInput = document.getElementById('name');
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
    
    const errorInputs = productForm.querySelectorAll('.border-red-500');
    errorInputs.forEach(input => input.classList.remove('border-red-500'));
    
    ensureFormFieldsAreEditable();
}

function updateImagePreview(url) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    if (url && url.trim() !== '') {
        imagePreview.innerHTML = `
            <div class="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
                <img src="${url}" 
                     alt="Vista previa" 
                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjNmMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmaWxsPSIjOTk5Ij7imqAgRXJyb3IgY2FyZ2FuZG8gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg=='">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 pointer-events-none"></div>
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

function parsePlans(plans) {
    if (!plans) return [];
    
    try {
        if (Array.isArray(plans)) return plans.filter(plan => plan && typeof plan === 'object');
        if (typeof plans === 'string') {
            try { return JSON.parse(plans); } catch (e) { return []; }
        }
        if (typeof plans === 'object' && plans !== null) return [plans];
        return [];
    } catch (error) {
        return [];
    }
}

export function fixFormSelection() {
    const formElements = document.querySelectorAll('#productForm input, #productForm select, #productForm textarea');
    
    formElements.forEach(element => {
        const clone = element.cloneNode(true);
        element.parentNode.replaceChild(clone, element);
        
        clone.addEventListener('mousedown', (e) => e.stopPropagation());
        clone.addEventListener('click', (e) => e.stopPropagation());
        clone.addEventListener('focus', (e) => e.stopPropagation());
    });
    
    const labels = document.querySelectorAll('#productForm label');
    labels.forEach(label => label.addEventListener('click', (e) => e.stopPropagation()));
}

export async function prepareEditForm(product) {
    if (!product) return;

    document.getElementById('productId').value = product.id;
    
    const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');
    const photoUrlInput = document.getElementById('photo_url');
    
    if (nameInput) nameInput.value = product.name || '';
    if (descriptionInput) descriptionInput.value = product.description || '';
    if (photoUrlInput) photoUrlInput.value = product.photo_url || '';
    
    await loadCategoriesIntoSelect();
    
    if (product.category_id) {
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const optionToSelect = Array.from(categorySelect.options).find(option => option.value == product.category_id);
            if (optionToSelect) categorySelect.value = product.category_id;
        }
    }
    
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
        
        if (product.plans) {
            let validPlans = [];
            if (window.productManager && typeof window.productManager.parsePlans === 'function') {
                validPlans = window.productManager.parsePlans(product.plans);
            } else {
                validPlans = parsePlans(product.plans);
            }
            
            if (validPlans.length > 0) validPlans.forEach(plan => addPlanRow(plan));
            else addPlanRow();
        } else {
            addPlanRow();
        }
    }
    
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nameInput = document.getElementById('name');
        if (nameInput) setTimeout(() => nameInput.focus(), 100);
    }
    
    ensureFormFieldsAreEditable();
    setTimeout(fixFormSelection, 100);
}

export async function editProduct(id) {
    try {
        const manager = window.productManager || await getProductManager();
        const product = manager.getProductById(id);
        
        if (product) {
            await prepareEditForm(product);
            const productsTab = document.querySelector('[data-tab="products"]');
            if (productsTab) productsTab.click();
            Utils.showSuccess(`Editando: ${product.name}`);
        } else {
            Utils.showError('❌ Producto no encontrado');
        }
    } catch (error) {
        console.error('Error al editar producto:', error);
        Utils.showError('❌ Error: No se pudo cargar el producto para edición');
    }
}

// Hacer funciones disponibles globalmente
window.prepareEditForm = prepareEditForm;
window.resetProductForm = resetForm;
window.initAdminPanel = initAdminPanel;
window.setupProductForm = setupProductForm;
window.editProduct = editProduct;
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.isAuthenticated === 'function' && window.isAuthenticated()) {
            initAdminPanel();
        }
    });
}
