// scripts/components/modals.js
import { Utils } from '../core/utils.js';
import { productManager } from '../managers/product-manager.js';
import { categoryManager } from '../managers/category-manager.js';

class ModalManager {
    constructor() {
        this.currentModal = null;
        this.setupModalEvents();
    }

    setupModalEvents() {
        // Close modal on click outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.hideModal();
            }
        });

        // Close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });
    }

    showModal(modalId) {
        // Hide current modal if any
        if (this.currentModal) {
            this.hideModal();
        }

        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        this.currentModal = modalId;

        // Add overflow hidden to body to prevent scrolling
        document.body.style.overflow = 'hidden';

        // Focus on first input if exists
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hideModal() {
        if (!this.currentModal) return;

        const modal = document.getElementById(this.currentModal);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }

        this.currentModal = null;
        document.body.style.overflow = 'auto';
    }
}

class ProductModal {
    constructor() {
        this.modalId = 'productModal';
        this.formId = 'productForm';
        this.isEditing = false;
        this.currentProductId = null;
        this.setupEvents();
    }

    setupEvents() {
        const form = document.getElementById(this.formId);
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelProductBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modalManager.hideModal();
            });
        }

        // Image preview
        const imageUrlInput = document.getElementById('photo_url');
        if (imageUrlInput) {
            imageUrlInput.addEventListener('input', Utils.debounce(() => {
                this.updateImagePreview();
            }, 300));
        }

        // Add plan button
        const addPlanBtn = document.getElementById('addPlanBtn');
        if (addPlanBtn) {
            addPlanBtn.addEventListener('click', () => {
                this.addPlanField();
            });
        }

        // Image search button
        const searchImageBtn = document.getElementById('searchImageBtn');
        if (searchImageBtn) {
            searchImageBtn.addEventListener('click', () => {
                this.openImageSearch();
            });
        }

        // Initialize with one plan field
        this.addPlanField();
    }

    open(product = null) {
        this.isEditing = !!product;
        this.currentProductId = product?.id || null;

        // Update modal title
        const title = document.getElementById('productModalTitle');
        if (title) {
            title.textContent = this.isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto';
        }

        // Update submit button text
        const submitText = document.getElementById('submitProductText');
        if (submitText) {
            submitText.textContent = this.isEditing ? 'Actualizar Producto' : 'Agregar Producto';
        }

        // Reset form
        this.resetForm();

        // Fill form if editing
        if (this.isEditing) {
            this.fillForm(product);
        }

        // Load categories
        this.loadCategories();

        // Show modal
        modalManager.showModal(this.modalId);
    }

    resetForm() {
        const form = document.getElementById(this.formId);
        if (form) {
            form.reset();
        }

        // Clear plans
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            plansContainer.innerHTML = '';
        }

        // Reset image preview
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
        }

        // Add one plan field
        this.addPlanField();
    }

    fillForm(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('name').value = product.name;
        document.getElementById('category').value = product.category_id || '';
        document.getElementById('description').value = product.description;
        document.getElementById('photo_url').value = product.photo_url;

        // Update image preview
        this.updateImagePreview();

        // Fill plans
        const plansContainer = document.getElementById('plansContainer');
        if (plansContainer) {
            plansContainer.innerHTML = '';

            const plans = typeof product.plans === 'string' ? 
                JSON.parse(product.plans) : (product.plans || []);

            plans.forEach(plan => {
                this.addPlanField(plan.name, plan.price_soles);
            });
        }
    }

    async loadCategories() {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;

        await categoryManager.loadCategories();
        const categories = categoryManager.getCategories();

        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>' +
            categories.map(cat => 
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');
    }

    addPlanField(name = '', price = '') {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;

        const planId = Date.now();
        const planField = document.createElement('div');
        planField.className = 'flex gap-2 items-start';
        planField.innerHTML = `
            <div class="flex-grow">
                <input type="text" placeholder="Nombre del plan" 
                       class="w-full px-3 py-2 border rounded-lg" 
                       value="${name}" 
                       name="plan_names[]" required>
            </div>
            <div class="w-32">
                <input type="number" placeholder="Precio" step="0.01" min="0"
                       class="w-full px-3 py-2 border rounded-lg" 
                       value="${price}" 
                       name="plan_prices[]" required>
            </div>
            <button type="button" class="remove-plan px-3 py-2 text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        `;

        plansContainer.appendChild(planField);

        // Add remove event
        const removeBtn = planField.querySelector('.remove-plan');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                // Don't remove if it's the only plan
                if (plansContainer.children.length > 1) {
                    planField.remove();
                }
            });
        }
    }

    updateImagePreview() {
        const imageUrl = document.getElementById('photo_url').value;
        const imagePreview = document.getElementById('imagePreview');

        if (!imagePreview) return;

        if (imageUrl) {
            imagePreview.innerHTML = `
                <img src="${imageUrl}" alt="Vista previa" 
                     class="w-full h-full object-contain"
                     onerror="this.style.display='none'; this.parentNode.innerHTML='<p class=\\'text-red-500\\'>Error al cargar la imagen</p>'">
            `;
        } else {
            imagePreview.innerHTML = '<p class="text-gray-500">La imagen aparecerá aquí</p>';
        }
    }

    openImageSearch() {
        modalManager.showModal('imageSearchModal');
        
        // Focus on search input
        setTimeout(() => {
            const searchInput = document.getElementById('imageSearchQuery');
            if (searchInput) searchInput.focus();
        }, 100);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            Utils.showLoading(this.isEditing ? 'Updating product...' : 'Creating product...');
            
            // Get form data
            const formData = new FormData(e.target);
            const productData = {
                name: formData.get('name'),
                category_id: formData.get('category'),
                description: formData.get('description'),
                photo_url: formData.get('photo_url')
            };
            
            // Get plans
            const planNames = formData.getAll('plan_names[]');
            const planPrices = formData.getAll('plan_prices[]');
            const plans = planNames.map((name, index) => ({
                name: name,
                price_soles: parseFloat(planPrices[index]) || 0
            }));
            
            productData.plans = plans;
            
            let result;
            if (this.isEditing) {
                productData.id = this.currentProductId;
                result = await productManager.updateProduct(productData);
            } else {
                result = await productManager.createProduct(productData);
            }
            
            if (result.success) {
                Utils.showSuccess(this.isEditing ? 'Product updated successfully' : 'Product created successfully');
                modalManager.hideModal();
                
                // Reload products
                if (window.adminPage) {
                    await window.adminPage.loadData();
                }
            } else {
                Utils.showError(result.error || 'Error saving product');
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            Utils.showError('Error saving product');
        } finally {
            Utils.hideLoading();
        }
    }
}

// Initialize modal manager and product modal
export const modalManager = new ModalManager();
export const productModal = new ProductModal();
