// scripts/managers/category-manager.js
import { supabaseClient } from '../supabase.js';
import { Utils } from '../core/utils.js';

class CategoryManager {
  constructor() {
    this.categories = [];
  }

  async loadCategories() {
    try {
      this.categories = await supabaseClient.getCategories();
      return this.categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  getCategories() {
    return this.categories;
  }

  getCategoryById(id) {
    return this.categories.find(category => category.id == id);
  }

  getCategoryName(categoryId) {
    if (!categoryId) return 'General';
    const category = this.categories.find(c => c.id == categoryId);
    return category ? category.name : `Categoría ${categoryId}`;
  }

  async addCategory(categoryData) {
    try {
      const newCategory = await supabaseClient.addCategory(categoryData);
      if (newCategory) {
        this.categories.push(newCategory);
        return newCategory;
      }
      return null;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const success = await supabaseClient.deleteCategory(id);
      if (success) {
        this.categories = this.categories.filter(c => c.id !== id);
      }
      return success;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

let categoryManagerInstance = null;

export async function getCategoryManager() {
  if (!categoryManagerInstance) {
    categoryManagerInstance = new CategoryManager();
    await categoryManagerInstance.loadCategories();
  }
  return categoryManagerInstance;
}
