import { supabase } from './supabase.js';
import { showNotification } from './utils.js';

let categories = [];

export async function loadCategories() {
    try {
        console.log('📂 Cargando categorías desde Supabase...');
        
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error al cargar categorías:', error);
            
            if (error.code === 'PGRST204' || error.code === '42P01') {
                console.warn('Tabla categories no existe');
                categories = [];
                return categories;
            }
            
            throw error;
        }

        categories = data || [];
        console.log(`✅ ${categories.length} categorías cargadas`);
        return categories;
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showNotification('Error al cargar categorías', 'error');
        return [];
    }
}

export function getCategories() {
    return categories;
}

export function getCategoryById(id) {
    return categories.find(category => category.id == id);
}

export async function addCategory(categoryData) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon || 'fas fa-tag',
                color: categoryData.color || 'blue',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            const newCategory = data[0];
            categories.push(newCategory);
            showNotification('✅ Categoría agregada correctamente', 'success');
            return newCategory;
        }
        
        return null;
    } catch (error) {
        console.error('Error al agregar categoría:', error);
        showNotification('Error al agregar categoría', 'error');
        return null;
    }
}

export async function updateCategory(id, categoryData) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .update({
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon,
                color: categoryData.color,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            const updatedCategory = data[0];
            const index = categories.findIndex(c => c.id === id);
            if (index !== -1) {
                categories[index] = updatedCategory;
            }
            
            showNotification('✅ Categoría actualizada correctamente', 'success');
            return updatedCategory;
        }
        
        return null;
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        showNotification('Error al actualizar categoría', 'error');
        return null;
    }
}

export async function deleteCategory(id) {
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        categories = categories.filter(c => c.id !== id);
        showNotification('✅ Categoría eliminada correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showNotification('Error al eliminar categoría', 'error');
        return false;
    }
}

export function renderCategoriesList(container) {
    if (!container) {
        console.error('Contenedor de categorías no encontrado');
        return;
    }

    if (!categories || categories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-tags text-3xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No hay categorías</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getColorClass(category.color)}">
                    <i class="${category.icon || 'fas fa-tag'} text-white"></i>
                </div>
                <div>
                    <h4 class="font-medium text-gray-800">${category.name}</h4>
                    ${category.description ? `<p class="text-sm text-gray-500">${category.description}</p>` : ''}
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="edit-category p-2 text-blue-600 hover:text-blue-800" data-id="${category.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-category p-2 text-red-600 hover:text-red-800" data-id="${category.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners
    container.querySelectorAll('.edit-category').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.dataset.id;
            // Implementar edición de categoría
            showNotification('✏️ Editar categoría - Función en desarrollo', 'info');
        });
    });

    container.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.dataset.id;
            const category = categories.find(c => c.id == categoryId);
            
            if (category) {
                if (typeof window.showConfirmationModal === 'function') {
                    window.showConfirmationModal({
                        title: 'Eliminar categoría',
                        message: `¿Estás seguro de que deseas eliminar "${category.name}"?`,
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        type: 'danger',
                        onConfirm: () => {
                            deleteCategory(categoryId).then(success => {
                                if (success) {
                                    renderCategoriesList(container);
                                }
                            });
                        }
                    });
                }
            }
        });
    });
}

function getColorClass(color) {
    const colorMap = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
        pink: 'bg-pink-500',
        indigo: 'bg-indigo-500',
        teal: 'bg-teal-500',
        orange: 'bg-orange-500'
    };
    
    return colorMap[color] || 'bg-blue-500';
}

// Inicialización
export function initCategories() {
    console.log('📂 Inicializando gestión de categorías...');
    return loadCategories().then(() => {
        console.log('✅ Gestión de categorías inicializada');
        return categories;
    });
}

// Hacer funciones disponibles globalmente
window.loadCategories = loadCategories;
window.getCategories = getCategories;
window.getCategoryById = getCategoryById;
window.addCategory = addCategory;
window.updateCategory = updateCategory;
window.deleteCategory = deleteCategory;
window.renderCategoriesList = renderCategoriesList;
window.initCategories = initCategories;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategories);
} else {
    setTimeout(initCategories, 0);
}
