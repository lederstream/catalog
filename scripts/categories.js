// scripts/categories.js
import { supabase } from './supabase.js';
import { showNotification, 
    validateRequired, 
    debounce,
    fadeIn,
    fadeOut,
    slideUp,
    slideDown
} from './utils.js';

// Estado de categorías
class CategoriesState {
    constructor() {
        this.categories = [];
        this.isLoading = false;
        this.listeners = [];
    }
    
    static getInstance() {
        if (!CategoriesState.instance) {
            CategoriesState.instance = new CategoriesState();
        }
        return CategoriesState.instance;
    }
    
    setCategories(categories) {
        this.categories = categories;
        this._notifyListeners();
    }
    
    addCategory(category) {
        this.categories.push(category);
        this._notifyListeners();
    }
    
    updateCategory(updatedCategory) {
        const index = this.categories.findIndex(cat => cat.id === updatedCategory.id);
        if (index !== -1) {
            this.categories[index] = updatedCategory;
            this._notifyListeners();
        }
    }
    
    removeCategory(id) {
        this.categories = this.categories.filter(cat => cat.id !== id);
        this._notifyListeners();
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    
    _notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.categories);
            } catch (error) {
                console.error('Error en categories listener:', error);
            }
        });
    }
}

let categoriesState = CategoriesState.getInstance();

// Cargar categorías desde Supabase
export async function loadCategories() {
    try {
        console.log('📂 Cargando categorías desde Supabase...');
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            // NO usar categorías por defecto - devolver array vacío
            if (error.code === 'PGRST204' || error.code === '42P01') {
                console.warn('Tabla categories no existe');
                const categories = [];
                return categories;
            }
            throw error;
        }

        const categories = data || [];
        console.log(`✅ ${categories.length} categorías cargadas`);
        return categories;
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        // NO usar datos de demostración
        const categories = [];
        showNotification('Error al cargar categorías', 'error');
        return categories;
    }
}

// Obtener categorías
export function getCategories() {
    return categoriesState.categories;
}

// Agregar una nueva categoría
export async function addCategory(name) {
    try {
        if (!validateRequired(name)) {
            showNotification('El nombre de la categoría no puede estar vacío', 'error');
            return null;
        }

        // Validar que no exista una categoría con el mismo nombre
        const normalizedName = name.trim().toLowerCase();
        const exists = categories.some(cat => 
            cat.name.toLowerCase() === normalizedName
        );
        
        if (exists) {
            showNotification('Ya existe una categoría con ese nombre', 'error');
            return null;
        }

        const { data, error } = await supabase
            .from('categories')
            .insert([{ 
                name: name.trim(),
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Error al agregar categoría:', error);
            showNotification('Error al agregar categoría', 'error');
            return null;
        }

        if (data && data.length > 0) {
            categories.push(data[0]);
            showNotification('Categoría agregada correctamente', 'success');
            
            // Actualizar el selector de categorías
            updateCategorySelect();
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al agregar categoría:', error);
        showNotification('Error al agregar categoría', 'error');
        return null;
    }
}

// Obtener icono para categoría
function getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    
    const iconMap = {
        'diseño': 'fas fa-paint-brush',
        'design': 'fas fa-paint-brush',
        'marketing': 'fas fa-chart-line',
        'desarrollo': 'fas fa-code',
        'development': 'fas fa-code',
        'software': 'fas fa-code',
        'consultoría': 'fas fa-handshake',
        'consulting': 'fas fa-handshake',
        'video': 'fas fa-video',
        'photo': 'fas fa-camera',
        'web': 'fas fa-globe',
        'mobile': 'fas fa-mobile-alt',
        'cloud': 'fas fa-cloud',
        'data': 'fas fa-database',
        'analytics': 'fas fa-chart-bar',
        'writing': 'fas fa-pen',
        'translation': 'fas fa-language',
        'music': 'fas fa-music',
        'business': 'fas fa-briefcase',
        'finance': 'fas fa-dollar-sign',
        'health': 'fas fa-heart',
        'education': 'fas fa-graduation-cap'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (name.includes(key)) {
            return icon;
        }
    }
    
    return 'fas fa-tag';
}

// Obtener color para categoría
function getCategoryColor() {
    const colors = [
        'bg-blue-100 text-blue-800',
        'bg-green-100 text-green-800',
        'bg-purple-100 text-purple-800',
        'bg-orange-100 text-orange-800',
        'bg-red-100 text-red-800',
        'bg-yellow-100 text-yellow-800',
        'bg-indigo-100 text-indigo-800',
        'bg-pink-100 text-pink-800',
        'bg-teal-100 text-teal-800'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Eliminar una categoría
export async function deleteCategory(id) {
    try {
        // Verificar si hay productos en esta categoría
        try {
            const { data: products, error: checkError } = await supabase
                .from('products')
                .select('id')
                .eq('category_id', id)
                .limit(1);

            if (checkError && checkError.code !== 'PGRST204' && checkError.code !== '42P01') {
                throw checkError;
            }

            if (products && products.length > 0) {
                showNotification('❌ No se puede eliminar la categoría porque tiene productos asociados', 'error');
                return false;
            }
        } catch (checkError) {
            // Si hay error al verificar productos, continuar
            console.warn('Error al verificar productos:', checkError);
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar categoría:', error);
            
            // Si hay error de tabla, eliminar del array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                categoriesState.removeCategory(id);
                showNotification('✅ Categoría eliminada (modo demostración)', 'success');
                
                // Actualizar el selector de categorías
                updateCategorySelect();
                return true;
            }
            
            showNotification('❌ Error al eliminar categoría', 'error');
            return false;
        }

        // Eliminar de la lista local
        categoriesState.removeCategory(id);
        showNotification('✅ Categoría eliminada correctamente', 'success');
        
        // Actualizar el selector de categorías
        updateCategorySelect();
        return true;
    } catch (error) {
        console.error('Error inesperado al eliminar categoría:', error);
        showNotification('❌ Error inesperado al eliminar categoría', 'error');
        return false;
    }
}

// Actualizar una categoría
export async function updateCategory(id, name, description = '') {
    try {
        if (!validateRequired(name)) {
            showNotification('❌ El nombre de la categoría no puede estar vacío', 'error');
            return null;
        }

        // Validar que no exista otra categoría con el mismo nombre
        const normalizedName = name.trim().toLowerCase();
        const exists = categoriesState.categories.some(cat => 
            cat.id !== id && cat.name.toLowerCase() === normalizedName
        );
        
        if (exists) {
            showNotification('❌ Ya existe otra categoría con ese nombre', 'error');
            return null;
        }

        const updateData = {
            name: name.trim(),
            description: description.trim(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error al actualizar categoría:', error);
            
            // Si hay error de tabla, actualizar en el array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                const category = categoriesState.categories.find(cat => cat.id === id);
                if (category) {
                    const updatedCategory = { ...category, ...updateData };
                    categoriesState.updateCategory(updatedCategory);
                    showNotification('✅ Categoría actualizada (modo demostración)', 'success');
                    
                    // Actualizar el selector de categorías
                    updateCategorySelect();
                    return updatedCategory;
                }
            }
            
            showNotification('❌ Error al actualizar categoría', 'error');
            return null;
        }

        if (data && data.length > 0) {
            // Actualizar en la lista local
            categoriesState.updateCategory(data[0]);
            showNotification('✅ Categoría actualizada correctamente', 'success');
            
            // Actualizar el selector de categorías
            updateCategorySelect();
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al actualizar categoría:', error);
        showNotification('❌ Error inesperado al actualizar categoría', 'error');
        return null;
    }
}

// Actualizar selector de categorías en formularios
export function updateCategorySelect() {
    const categorySelects = document.querySelectorAll('select[id="category"], select[name="category_id"]');
    
    categorySelects.forEach(select => {
        const currentValue = select.value;
        
        // Limpiar y poblar el selector
        select.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        categoriesState.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            if (cat.isDemo) {
                option.dataset.demo = 'true';
            }
            select.appendChild(option);
        });
        
        // Restaurar la selección anterior si existe
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// Renderizar lista de categorías en el modal
export function renderCategoriesList(container) {
    if (!container) {
        console.error('Contenedor de categorías no encontrado');
        return;
    }

    if (categoriesState.categories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 fade-in-up">
                <i class="fas fa-tags text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No hay categorías</p>
                <p class="text-sm text-gray-400 mt-1">Agrega tu primera categoría</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categoriesState.categories.map((category, index) => `
        <div class="category-item flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-300 fade-in-up" 
             style="animation-delay: ${index * 50}ms"
             data-category-id="${category.id}">
            <div class="flex items-center space-x-3">
                <span class="${category.color} w-10 h-10 rounded-full flex items-center justify-center">
                    <i class="${category.icon}"></i>
                </span>
                <div>
                    <h4 class="font-semibold text-gray-800">${category.name}</h4>
                    ${category.description ? `<p class="text-sm text-gray-500 mt-1">${category.description}</p>` : ''}
                </div>
            </div>
            <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button class="edit-category-btn bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 transform hover:scale-105" 
                        data-id="${category.id}"
                        title="Editar categoría">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-category-btn bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors duration-200 transform hover:scale-105" 
                        data-id="${category.id}"
                        title="Eliminar categoría">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners para los botones
    setupCategoryItemListeners(container);
}

// Configurar event listeners para items de categoría
function setupCategoryItemListeners(container) {
    // Botones de editar
    container.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.currentTarget.dataset.id);
            const category = categoriesState.categories.find(cat => cat.id === id);
            
            if (category) {
                openEditCategoryModal(category);
            }
        });
    });

    // Botones de eliminar
    container.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.currentTarget.dataset.id);
            const category = categoriesState.categories.find(cat => cat.id === id);
            
            if (category) {
                openDeleteCategoryModal(category);
            }
        });
    });

    // Hover effects
    container.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const buttons = item.querySelector('.flex.space-x-2');
            buttons.classList.remove('opacity-0');
        });
        
        item.addEventListener('mouseleave', () => {
            const buttons = item.querySelector('.flex.space-x-2');
            buttons.classList.add('opacity-0');
        });
    });
}

// Abrir modal de edición de categoría
function openEditCategoryModal(category) {
    // Crear modal de edición
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 edit-category-modal">
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Editar categoría</h3>
                        <button class="close-modal text-gray-500 hover:text-gray-700 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="editCategoryForm" class="space-y-4">
                        <input type="hidden" name="id" value="${category.id}">
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input type="text" name="name" value="${category.name}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                            <textarea name="description" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows="3">${category.description || ''}</textarea>
                        </div>
                        
                        <div class="flex space-x-3 pt-4">
                            <button type="button" class="flex-1 close-modal px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Guardar cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al documento
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Mostrar modal con animación
    const modal = modalContainer.querySelector('.edit-category-modal');
    fadeIn(modal);
    
    // Configurar event listeners del modal
    setupEditCategoryModalListeners(modalContainer, category);
}

// Configurar event listeners del modal de edición
function setupEditCategoryModalListeners(modalContainer, category) {
    const form = modalContainer.querySelector('#editCategoryForm');
    const closeButtons = modalContainer.querySelectorAll('.close-modal');
    
    // Enviar formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const id = parseInt(formData.get('id'));
        const name = formData.get('name').trim();
        const description = formData.get('description').trim();
        
        const result = await updateCategory(id, name, description);
        if (result) {
            // Cerrar modal
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
            });
            
            // Volver a renderizar la lista
            const categoriesList = document.getElementById('categoriesList');
            if (categoriesList) {
                renderCategoriesList(categoriesList);
            }
        }
    });
    
    // Cerrar modal
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
            });
        });
    });
    
    // Cerrar al hacer clic fuera
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
            });
        }
    });
    
    // Cerrar con Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
                document.removeEventListener('keydown', handleEscape);
            });
        }
    };
    
    document.addEventListener('keydown', handleEscape);
}

// Abrir modal de confirmación de eliminación
function openDeleteCategoryModal(category) {
    // Crear modal de confirmación
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 delete-category-modal">
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="p-6">
                    <div class="text-center mb-4">
                        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">¿Eliminar categoría?</h3>
                        <p class="text-gray-600">¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.</p>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button class="flex-1 cancel-delete px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            Cancelar
                        </button>
                        <button class="flex-1 confirm-delete px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al documento
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Mostrar modal con animación
    const modal = modalContainer.querySelector('.delete-category-modal');
    fadeIn(modal);
    
    // Configurar event listeners del modal
    setupDeleteCategoryModalListeners(modalContainer, category);
}

// Configurar event listeners del modal de eliminación
function setupDeleteCategoryModalListeners(modalContainer, category) {
    const confirmBtn = modalContainer.querySelector('.confirm-delete');
    const cancelBtn = modalContainer.querySelector('.cancel-delete');
    
    // Confirmar eliminación
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        confirmBtn.disabled = true;
        
        const success = await deleteCategory(category.id);
        if (success) {
            // Cerrar modal
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
            });
            
            // Volver a renderizar la lista
            const categoriesList = document.getElementById('categoriesList');
            if (categoriesList) {
                renderCategoriesList(categoriesList);
            }
        } else {
            // Restaurar botón
            confirmBtn.innerHTML = 'Eliminar';
            confirmBtn.disabled = false;
        }
    });
    
    // Cancelar eliminación
    cancelBtn.addEventListener('click', () => {
        fadeOut(modalContainer).then(() => {
            modalContainer.remove();
        });
    });
    
    // Cerrar al hacer clic fuera
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
            });
        }
    });
    
    // Cerrar con Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            fadeOut(modalContainer).then(() => {
                modalContainer.remove();
                document.removeEventListener('keydown', handleEscape);
            });
        }
    };
    
    document.addEventListener('keydown', handleEscape);
}

// Cargar categorías en selector
export function loadCategoriesIntoSelect() {
    return new Promise(async (resolve) => {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) {
            console.warn('Selector de categorías no encontrado');
            resolve();
            return;
        }

        try {
            // Asegurarse de que las categorías estén cargadas
            if (categoriesState.categories.length === 0) {
                await loadCategories();
            }

            // Guardar la selección actual si existe
            const currentValue = categorySelect.value;
            
            // Limpiar y poblar el selector
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            
            categoriesState.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                if (cat.isDemo) {
                    option.dataset.demo = 'true';
                }
                categorySelect.appendChild(option);
            });
            
            // Restaurar la selección anterior si existe
            if (currentValue) {
                categorySelect.value = currentValue;
            }
            
            resolve();
        } catch (error) {
            console.error('Error loading categories into select:', error);
            resolve();
        }
    });
}

// Inicializar funcionalidad de categorías
export function initCategories() {
    console.log('📂 Inicializando gestión de categorías...');
    
    // Cargar categorías al iniciar
    loadCategories();
    
    // Escuchar cambios en las categorías
    categoriesState.addListener((categories) => {
        // Actualizar selectores en todo momento
        updateCategorySelect();
    });
    
    console.log('✅ Gestión de categorías inicializada');
}

// Hacer funciones disponibles globalmente
window.loadCategories = loadCategories;
window.getCategories = getCategories;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.updateCategory = updateCategory;
window.renderCategoriesList = renderCategoriesList;
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;
window.initCategories = initCategories;

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategories);
} else {
    setTimeout(initCategories, 0);
}
