import { Utils } from './core/utils.js';

const SUPABASE_URL = 'https://fwmpcglrwgfougbgxvnt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bXBjZ2xyd2dmb3VnYmd4dm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzI2MzQsImV4cCI6MjA3MTE0ODYzNH0.gbW0YSUmBxGyI0XmSckKvOszNME3b4RIt5HLZa4Amjc';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseClient = {
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      Utils.showNotification('Error al cargar categorías', 'error');
      return [];
    }
  },

  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting products:', error);
      Utils.showNotification('Error al cargar productos', 'error');
      return [];
    }
  },

  async addProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select('*, categories(*)');
      
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select('*, categories(*)');
      
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async addCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select();
      
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  async deleteCategory(id) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};
