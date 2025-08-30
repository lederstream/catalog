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
            if (typeof window.logout === 'function') {
                window.logout();
            }
        });
    }
}

// Configurar el formulario de producto
export function setupProductForm() {
    const productForm = document.getElementById('productForm');
    const addPlanBtn = document.getElementById('addPlanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const formTitle = document.getElementById('formTitle');
    const submitText = document.getElementById('submitText');
    const productId = document.getElementById('productId');

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
    const photoUrlInput = document.getElementById('photo_url');
    if (photoUrlInput) {
        photoUrlInput.addEventListener('input', (e) => {
            if (typeof window.updateImagePreview === 'function') {
                window.updateImagePreview(e.target.value);
            }
        });
    }

    // Botón de búsqueda de imagen
    const searchImageBtn = document.getElementById('searchImageBtn');
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
    planItem.className = 'plan-item flex items-center gap-2';
    planItem.innerHTML = `
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
            <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name" required>
            <input type="number" step="0.01" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles">
            <input type="number" step="0.01" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars">
        </div>
        <button type="button" class="remove-plan text-red-500 hover:text-red-700">
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

    // Recopilar planes
    const plans = [];
    document.querySelectorAll('.plan-item').forEach(item => {
        const name = item.querySelector('.plan-name').value;
        const price_soles = item.querySelector('.plan-price-soles').value;
        const price_dollars = item.querySelector('.plan-price-dollars').value;

        if (name && (price_soles || price_dollars)) {
            plans.push({
                name: name.trim(),
                price_soles: price_soles ? parseFloat(price_soles) : null,
                price_dollars: price_dollars ? parseFloat(price_dollars) : null
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
            resetForm();
            // Recargar productos
            if (typeof window.loadAdminProducts === 'function') {
                window.loadAdminProducts();
            }
            if (typeof window.loadPublicProducts === 'function') {
                window.loadPublicProducts();
            }
        }
    } catch (error) {
        console.error('Error al procesar el producto:', error);
    }
}

// Resetear formulario
function resetForm() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
        document.getElementById('submitText').textContent = 'Agregar Producto';
        document.getElementById('cancelBtn').classList.add('hidden');
        
        // Limpiar planes y agregar uno vacío
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            plansContainer.innerHTML = '';
            addPlanRow();
        }
        
        // Limpiar vista previa de imagen
        if (typeof window.updateImagePreview === 'function') {
            window.updateImagePreview('');
        }
    }
}

// Preparar formulario para edición
export function prepareEditForm(product) {
    if (!product) return;

    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('category').value = product.category_id;
    document.getElementById('description').value = product.description;
    document.getElementById('photo_url').value = product.photo_url;
    
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('submitText').textContent = 'Actualizar Producto';
    document.getElementById('cancelBtn').classList.remove('hidden');
    
    // Actualizar vista previa de imagen
    if (typeof window.updateImagePreview === 'function') {
        window.updateImagePreview(product.photo_url);
    }
    
    // Llenar planes
    const plansContainer = document.getElementById('plansContainer');
    if (plansContainer) {
        plansContainer.innerHTML = '';
        
        if (product.plans && product.plans.length > 0) {
            product.plans.forEach(plan => {
                const planItem = document.createElement('div');
                planItem.className = 'plan-item flex items-center gap-2';
                planItem.innerHTML = `
                    <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input type="text" placeholder="Nombre del plan" class="px-3 py-2 border rounded-lg plan-name" value="${plan.name || ''}" required>
                        <input type="number" step="0.01" placeholder="Precio S/." class="px-3 py-2 border rounded-lg plan-price-soles" value="${plan.price_soles || ''}">
                        <input type="number" step="0.01" placeholder="Precio $" class="px-3 py-2 border rounded-lg plan-price-dollars" value="${plan.price_dollars || ''}">
                    </div>
                    <button type="button" class="remove-plan text-red-500 hover:text-red-700">
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
            });
        } else {
            addPlanRow();
        }
    }
    
    // Scroll al formulario
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}