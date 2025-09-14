// scripts/pages/index.js
import { Utils } from '../core/utils.js';
import { getProductManager } from '../managers/product-manager.js';
import { getCategoryManager } from '../managers/category-manager.js';
import { initCatalogGrid, filterAndRenderProducts } from '../components/catalog-grid.js';

class IndexPage {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Inicializar managers
      window.productManager = await getProductManager();
      window.categoryManager = await getCategoryManager();
      
      // Configurar filtro de categorías
      this.setupCategoryFilter();
      
      // Inicializar la cuadrícula del catálogo
      initCatalogGrid();
      
      this.isInitialized = true;
      Utils.showNotification('Catálogo cargado correctamente', 'success');
    } catch (error) {
      console.error('Error initializing index page:', error);
      Utils.showNotification('Error al cargar el catálogo', 'error');
    }
  }

  setupCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter || !window.categoryManager) return;
    
    const categories = window.categoryManager.getCategories();
    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categoryFilter.appendChild(option);
    });
  }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
  window.indexPage = new IndexPage();
  await window.indexPage.initialize();
});
