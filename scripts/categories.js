// scripts/categories.js - Gestión de categorías mejorada
import { supabase } from './supabase.js';
import { showNotification, validateRequired, debounce } from './utils.js';

let categories = [];

// Cargar categorías desde Supabase
export async function loadCategories() {
    try {
        console.log('📂 Cargando categorías desde Supabase...');
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            // Si la tabla no existe, usar categorías por defecto
            if (error.code === 'PGRST204' || error.code === '42P01') {
                console.warn('Tabla categories no existe, usando categorías por defecto');
                categories = getDefaultCategories();
                return categories;
            }
            throw error;
        }

        categories = data || [];
        console.log(`✅ ${categories.length} categorías cargadas`);
        return categories;
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        
        // En caso de error, usar categorías por defecto
        categories = getDefaultCategories();
        showNotification('Usando categorías de demostración', 'info');
        return categories;
    }
}

// Categorías por defecto
function getDefaultCategories() {
    return [
        { id: 1, name: 'Diseño', created_at: new Date().toISOString(), icon: 'fas fa-paint-brush' },
        { id: 2, name: 'Marketing', created_at: new Date().toISOString(), icon: 'fas fa-chart-line' },
        { id: 3, name: 'Desarrollo', created_at: new Date().toISOString(), icon: 'fas fa-code' },
        { id: 4, name: 'Consultoría', created_at: new Date().toISOString(), icon: 'fas fa-handshake' }
    ];
}

// Obtener categorías
export function getCategories() {
    return categories;
}

// Agregar una nueva categoría
export async function addCategory(name) {
    try {
        if (!name || name.trim() === '') {
            showNotification('El nombre de la categoría no puede estar vacío', 'error');
            return null;
        }

        // Validar que no exista una categoría con el mismo nombre
        const normalizedName = name.trim().toLowerCase();
        const exists = categories.some(cat => cat.name.toLowerCase() === normalizedName);
        
        if (exists) {
            showNotification('Ya existe una categoría con ese nombre', 'error');
            return null;
        }

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name: name.trim() }])
            .select();

        if (error) {
            console.error('Error al agregar categoría:', error);
            
            // Si hay error de tabla, agregar al array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                const newCategory = {
                    id: Date.now(),
                    name: name.trim(),
                    created_at: new Date().toISOString(),
                    icon: getCategoryIcon(name.trim())
                };
                categories.push(newCategory);
                showNotification('Categoría agregada (modo demostración)', 'success');
                
                // Actualizar el selector de categorías
                updateCategorySelect();
                return newCategory;
            }
            
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
    
    if (name.includes('diseño') || name.includes('design')) return 'fas fa-paint-brush';
    if (name.includes('marketing')) return 'fas fa-chart-line';
    if (name.includes('desarrollo') || name.includes('development') || name.includes('software')) return 'fas fa-code';
    if (name.includes('consultoría') || name.includes('consulting')) return 'fas fa-handshake';
    if (name.includes('video') || name.includes('photo')) return 'fas fa-video';
    if (name.includes('web')) return 'fas fa-globe';
    if (name.includes('mobile')) return 'fas fa-mobile-alt';
    if (name.includes('cloud')) return 'fas fa-cloud';
    if (name.includes('data') || name.includes('analytics')) return 'fas fa-database';
    
    return 'fas fa-tag';
}

// Eliminar una categoría
export async function deleteCategory(id) {
    try {
        // Verificar si hay productos en esta categoría (solo si la tabla existe)
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
                showNotification('No se puede eliminar la categoría porque tiene productos asociados', 'error');
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
                categories = categories.filter(cat => cat.id !== id);
                showNotification('Categoría eliminada (modo demostración)', 'success');
                
                // Actualizar el selector de categorías
                updateCategorySelect();
                return true;
            }
            
            showNotification('Error al eliminar categoría', 'error');
            return false;
        }

        // Eliminar de la lista local
        categories = categories.filter(cat => cat.id !== id);
        showNotification('Categoría eliminada correctamente', 'success');
        
        // Actualizar el selector de categorías
        updateCategorySelect();
        return true;
    } catch (error) {
        console.error('Error inesperado al eliminar categoría:', error);
        showNotification('Error inesperado al eliminar categoría', 'error');
        return false;
    }
}

// Actualizar una categoría
export async function updateCategory(id, name) {
    try {
        if (!name || name.trim() === '') {
            showNotification('El nombre de la categoría no puede estar vacío', 'error');
            return null;
        }

        // Validar que no exista otra categoría con el mismo nombre
        const normalizedName = name.trim().toLowerCase();
        const exists = categories.some(cat => cat.id !== id && cat.name.toLowerCase() === normalizedName);
        
        if (exists) {
            showNotification('Ya existe otra categoría con ese nombre', 'error');
            return null;
        }

        const { data, error } = await supabase
            .from('categories')
            .update({ name: name.trim() })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error al actualizar categoría:', error);
            
            // Si hay error de tabla, actualizar en el array local
            if (error.code === 'PGRST204' || error.code === '42P01') {
                const index = categories.findIndex(cat => cat.id === id);
                if (index !== -1) {
                    categories[index].name = name.trim();
                    showNotification('Categoría actualizada (modo demostración)', 'success');
                    
                    // Actualizar el selector de categorías
                    updateCategorySelect();
                    return categories[index];
                }
            }
            
            showNotification('Error al actualizar categoría', 'error');
            return null;
        }

        if (data && data.length > 0) {
            // Actualizar en la lista local
            const index = categories.findIndex(cat => cat.id === id);
            if (index !== -1) {
                categories[index] = data[0];
            }
            showNotification('Categoría actualizada correctamente', 'success');
            
            // Actualizar el selector de categorías
            updateCategorySelect();
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al actualizar categoría:', error);
        showNotification('Error inesperado al actualizar categoría', 'error');
        return null;
    }
}

// Actualizar selector de categorías en formularios
function updateCategorySelect() {
    const categorySelects = document.querySelectorAll('select[id="category"], select[name="category_id"]');
    
    categorySelects.forEach(select => {
        const currentValue = select.value;
        
        // Limpiar y poblar el selector
        select.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
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

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 animate-pulse">
                <i class="fas fa-tags text-2xl text-gray-300 mb-2"></i>
                <p class="text-gray-500">No hay categorías</p>
                <p class="text-sm text-gray-400 mt-1">Agrega tu primera categoría</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map((category, index) => `
        <div class="flex items-center justify-between p-3 border-b hover:bg-gray-50 transition-colors duration-200 opacity-0 transform -translate-x-4" style="transition: opacity 0.3s ease, transform 0.3s ease; transition-delay: ${index * 50}ms">
            <div class="flex items-center">
                <i class="${category.icon || 'fas fa-tag'} mr-3 text-blue-500"></i>
                <span class="category-name font-medium">${category.name}</span>
            </div>
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button class="edit-category text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-110" data-id="${category.id}" title="Editar categoría">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-category text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-110" data-id="${category.id}" title="Eliminar categoría">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Animar la entrada de las categorías
    setTimeout(() => {
        const categoryElements = container.querySelectorAll('div');
        categoryElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.remove('opacity-0', '-translate-x-4');
            }, index * 50);
        });
    }, 10);

    // Agregar event listeners para los botones
    container.querySelectorAll('.edit-category').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const category = categories.find(cat => cat.id === id);
            if (category) {
                const newName = prompt('Editar nombre de categoría:', category.name);
                if (newName !== null && newName.trim() !== '') {
                    updateCategory(id, newName).then(updated => {
                        if (updated) {
                            renderCategoriesList(container);
                        }
                    });
                }
            }
        });
    });

    container.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const category = categories.find(cat => cat.id === id);
            
            if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
                // Animación de eliminación
                const element = e.currentTarget.closest('div');
                element.style.opacity = '0';
                element.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    deleteCategory(id).then(success => {
                        if (success) {
                            renderCategoriesList(container);
                        }
                    });
                }, 300);
            }
        });
    });
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
            if (categories.length === 0) {
                await loadCategories();
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
            
            resolve();
        } catch (error) {
            console.error('Error loading categories into select:', error);
            resolve();
        }
    });
}

// Hacer funciones disponibles globalmente
window.loadCategories = loadCategories;
window.getCategories = getCategories;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.updateCategory = updateCategory;
window.renderCategoriesList = renderCategoriesList;
window.loadCategoriesIntoSelect = loadCategoriesIntoSelect;
