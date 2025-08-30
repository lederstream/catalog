// scripts/categories.js
import { supabase } from './supabase.js';
import { showNotification } from './utils.js';

let categories = [];

// Cargar categorías desde Supabase
export async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error al cargar categorías:', error);
            showNotification('Error al cargar categorías', 'error');
            return [];
        }

        categories = data || [];
        return categories;
    } catch (error) {
        console.error('Error inesperado al cargar categorías:', error);
        showNotification('Error inesperado al cargar categorías', 'error');
        return [];
    }
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

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name: name.trim() }])
            .select();

        if (error) {
            console.error('Error al agregar categoría:', error);
            showNotification('Error al agregar categoría', 'error');
            return null;
        }

        if (data && data.length > 0) {
            categories.push(data[0]);
            showNotification('Categoría agregada correctamente', 'success');
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al agregar categoría:', error);
        showNotification('Error inesperado al agregar categoría', 'error');
        return null;
    }
}

// Eliminar una categoría
export async function deleteCategory(id) {
    try {
        // Verificar si hay productos en esta categoría
        const { data: products, error: checkError } = await supabase
            .from('products')
            .select('id')
            .eq('category_id', id)
            .limit(1);

        if (checkError) {
            console.error('Error al verificar productos:', checkError);
            showNotification('Error al verificar productos de la categoría', 'error');
            return false;
        }

        if (products && products.length > 0) {
            showNotification('No se puede eliminar la categoría porque tiene productos asociados', 'error');
            return false;
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar categoría:', error);
            showNotification('Error al eliminar categoría', 'error');
            return false;
        }

        // Eliminar de la lista local
        categories = categories.filter(cat => cat.id !== id);
        showNotification('Categoría eliminada correctamente', 'success');
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

        const { data, error } = await supabase
            .from('categories')
            .update({ name: name.trim() })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error al actualizar categoría:', error);
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
            return data[0];
        }

        return null;
    } catch (error) {
        console.error('Error inesperado al actualizar categoría:', error);
        showNotification('Error inesperado al actualizar categoría', 'error');
        return null;
    }
}

// Renderizar lista de categorías en el modal
export function renderCategoriesList(container) {
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay categorías</p>';
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="flex items-center justify-between p-3 border-b">
            <span class="category-name">${category.name}</span>
            <div class="flex space-x-2">
                <button class="edit-category text-blue-500 hover:text-blue-700" data-id="${category.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-category text-red-500 hover:text-red-700" data-id="${category.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

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
            if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
                deleteCategory(id).then(success => {
                    if (success) {
                        renderCategoriesList(container);
                    }
                });
            }
        });
    });
}