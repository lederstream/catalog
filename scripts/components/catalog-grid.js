// scripts/components/catalog-grid.js
import { Utils } from '../core/utils.js';
import { createProductCard, addProductCardEventListeners, animateProductsEntry } from './product-card.js';

class CatalogState {
  constructor() {
    this.currentView = localStorage.getItem('catalogView') || 'grid';
    this.sortBy = localStorage.getItem('catalogSortBy') || 'name';
    this.sortOrder = localStorage.getItem('catalogSortOrder') || 'asc';
    this.filters = {
      category: localStorage.getItem('catalogFilterCategory') || 'all',
      search: localStorage.getItem('catalogFilterSearch') || '',
      priceRange: JSON.parse(localStorage.getItem('catalogFilterPriceRange') || '[0, 10000]')
    };
    this.currentPage = parseInt(localStorage.getItem('catalogCurrentPage') || '1');
  }
  
  saveState() {
    localStorage.setItem('catalogView', this.currentView);
    localStorage.setItem('catalogSortBy', this.sortBy);
    localStorage.setItem('catalogSortOrder', this.sortOrder);
    localStorage.setItem('catalogFilterCategory', this.filters.category);
    localStorage.setItem('catalogFilterSearch', this.filters.search);
    localStorage.setItem('catalogFilterPriceRange', JSON.stringify(this.filters.priceRange));
    localStorage.setItem('catalogCurrentPage', this.currentPage.toString());
  }
}

const CONFIG = {
  ITEMS_PER_PAGE: 12
};

export function initCatalogGrid() {
  const catalogState = new CatalogState();
  window.catalogState = catalogState;
  
  setupCatalogFilters(catalogState);
  setupViewControls(catalogState);
  setupSorting(catalogState);
  setupPagination(catalogState);
}

function setupCatalogFilters(catalogState) {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchInput) {
    searchInput.value = catalogState.filters.search;
    searchInput.addEventListener('input', Utils.debounce((e) => {
      catalogState.filters.search = e.target.value.toLowerCase().trim();
      catalogState.currentPage = 1;
      catalogState.saveState();
      filterAndRenderProducts(catalogState);
      
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', !catalogState.filters.search);
      }
    }, 300));
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.classList.toggle('hidden', !catalogState.filters.search);
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        catalogState.filters.search = '';
        catalogState.currentPage = 1;
        catalogState.saveState();
        filterAndRenderProducts(catalogState);
        clearSearchBtn.classList.add('hidden');
      }
    });
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      catalogState.filters.category = e.target.value;
      catalogState.currentPage = 1;
      catalogState.saveState();
      filterAndRenderProducts(catalogState);
    });
  }
}

function setupViewControls(catalogState) {
  const gridViewBtn = document.getElementById('gridViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  const productsGrid = document.getElementById('productsGrid');
  
  if (productsGrid) {
    productsGrid.dataset.view = catalogState.currentView;
  }
  
  if (gridViewBtn && listViewBtn) {
    updateViewButtons(catalogState.currentView);
    
    gridViewBtn.addEventListener('click', () => {
      catalogState.currentView = 'grid';
      catalogState.saveState();
      updateViewButtons('grid');
      filterAndRenderProducts(catalogState);
    });
    
    listViewBtn.addEventListener('click', () => {
      catalogState.currentView = 'list';
      catalogState.saveState();
      updateViewButtons('list');
      filterAndRenderProducts(catalogState);
    });
  }
  
  function updateViewButtons(view) {
    const isGridView = view === 'grid';
    gridViewBtn.classList.toggle('bg-blue-600', isGridView);
    gridViewBtn.classList.toggle('text-white', isGridView);
    listViewBtn.classList.toggle('bg-blue-600', !isGridView);
    listViewBtn.classList.toggle('text-white', !isGridView);
    
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
      productsGrid.dataset.view = view;
    }
  }
}

function setupSorting(catalogState) {
  const sortSelect = document.getElementById('sortSelect');
  const sortOrderBtn = document.getElementById('sortOrderBtn');
  
  if (sortSelect && sortOrderBtn) {
    sortSelect.value = catalogState.sortBy;
    updateSortOrderIcon(catalogState.sortOrder);
    
    sortSelect.addEventListener('change', (e) => {
      catalogState.sortBy = e.target.value;
      catalogState.saveState();
      filterAndRenderProducts(catalogState);
    });
    
    sortOrderBtn.addEventListener('click', () => {
      catalogState.sortOrder = catalogState.sortOrder === 'asc' ? 'desc' : 'asc';
      catalogState.saveState();
      updateSortOrderIcon(catalogState.sortOrder);
      filterAndRenderProducts(catalogState);
    });
  }
  
  function updateSortOrderIcon(order) {
    const icon = sortOrderBtn.querySelector('i');
    if (icon) {
      icon.className = order === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    }
  }
}

function setupPagination(catalogState) {
  window.changePage = function(page) {
    if (page > 0) {
      catalogState.currentPage = page;
      catalogState.saveState();
      filterAndRenderProducts(catalogState);
    }
  };
}

export function filterAndRenderProducts(catalogState) {
  if (!window.productManager || !window.categoryManager) return;
  
  const products = window.productManager.getProducts();
  let filteredProducts = [...products];
  
  if (catalogState.filters.category !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.category_id == catalogState.filters.category
    );
  }
  
  if (catalogState.filters.search) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(catalogState.filters.search) || 
      (product.description && product.description.toLowerCase().includes(catalogState.filters.search))
    );
  }
  
  if (catalogState.filters.priceRange) {
    const [min, max] = catalogState.filters.priceRange;
    filteredProducts = filteredProducts.filter(product => {
      const minPrice = window.productManager.getProductMinPrice(product);
      return minPrice >= min && minPrice <= max && minPrice !== Infinity;
    });
  }
  
  filteredProducts = sortProducts(filteredProducts, catalogState.sortBy, catalogState.sortOrder);
  
  const startIndex = (catalogState.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + CONFIG.ITEMS_PER_PAGE);
  
  renderProductsGrid(paginatedProducts, 'productsGrid', catalogState.currentView);
  updateResultsCount(filteredProducts.length);
  updatePagination(filteredProducts.length, catalogState);
}

function sortProducts(products, field, order = 'asc') {
  if (!Array.isArray(products)) return [];
  
  return [...products].sort((a, b) => {
    let aValue, bValue;
    
    switch (field) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'price':
        aValue = window.productManager.getProductMinPrice(a);
        bValue = window.productManager.getProductMinPrice(b);
        break;
      case 'category':
        aValue = window.categoryManager.getCategoryName(a.category_id)?.toLowerCase() || '';
        bValue = window.categoryManager.getCategoryName(b.category_id)?.toLowerCase() || '';
        break;
      case 'date':
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
        break;
      default:
        aValue = a[field] || '';
        bValue = b[field] || '';
    }
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

function updateResultsCount(count) {
  const resultsCount = document.getElementById('resultsCount');
  if (resultsCount) {
    resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }
}

export function renderProductsGrid(products, containerId, view = 'grid') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16">
        <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
        <p class="text-gray-500 mb-4">Intenta con otros términos de búsqueda o categorías</p>
        <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
                onclick="window.resetFilters()">
          <i class="fas fa-refresh mr-2"></i>
          Limpiar filtros
        </button>
      </div>
    `;
    return;
  }
  
  const isListView = view === 'list';
  container.className = `grid ${isListView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`;
  
  container.innerHTML = products.map((product, index) => 
    createProductCard(product, isListView, index)
  ).join('');
  
  addProductCardEventListeners();
  animateProductsEntry();
}

function updatePagination(totalItems, catalogState) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);
  
  if (totalPages <= 1) {
    paginationContainer.classList.add('hidden');
    return;
  }
  
  paginationContainer.classList.remove('hidden');
  
  let paginationHTML = '';
  const currentPage = catalogState.currentPage;
  
  paginationHTML += `
    <button class="px-4 py-2 mx-1 border rounded-lg hover:bg-gray-50" 
            ${currentPage === 1 ? 'disabled' : ''} 
            onclick="changePage(${currentPage - 1})">
      Anterior
    </button>
  `;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHTML += `
        <button class="px-4 py-2 mx-1 border rounded-lg ${currentPage === i ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}" 
                onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<span class="px-2 py-2">...</span>`;
    }
  }
  
  paginationHTML += `
    <button class="px-4 py-2 mx-1 border rounded-lg hover:bg-gray-50" 
            ${currentPage === totalPages ? 'disabled' : ''} 
            onclick="changePage(${currentPage + 1})">
      Siguiente
    </button>
  `;
  
  paginationContainer.innerHTML = paginationHTML;
}

window.resetFilters = function() {
  const catalogState = window.catalogState;
  if (!catalogState) return;
  
  catalogState.filters = {
    category: 'all',
    search: '',
    priceRange: [0, 10000]
  };
  catalogState.currentPage = 1;
  catalogState.saveState();
  
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = 'all';
  if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
  
  filterAndRenderProducts(catalogState);
};
