// scripts/components/header.js
import { isUserLoggedIn, getCurrentUser } from '../auth.js';

// Renderizar header
export function renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const isLoggedIn = isUserLoggedIn();
    const user = getCurrentUser();

    header.innerHTML = `
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center">
                <a href="#" class="flex items-center group">
                    <h1 class="text-xl md:text-2xl font-bold text-blue-700 group-hover:text-blue-800 transition-colors duration-200">DigitalCatalog</h1>
                </a>
                <nav class="ml-8 hidden md:block">
                    <ul class="flex space-x-6">
                        <li><a href="#" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full">Inicio</a></li>
                        <li><a href="#catalog" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full">Catálogo</a></li>
                        <li><a href="#admin" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full">Admin</a></li>
                        <li><a href="#contact" class="text-gray-700 hover:text-blue-600 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full">Contacto</a></li>
                    </ul>
                </nav>
            </div>
            <div class="flex items-center">
                ${isLoggedIn ? `
                    <div class="hidden md:flex items-center mr-4">
                        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-2">
                            ${user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span class="text-gray-700">Hola, ${user?.email || 'Usuario'}</span>
                    </div>
                    <button id="mobileLogoutBtn" class="md:hidden text-gray-700 mr-2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                    <button id="logoutBtn" class="hidden md:flex items-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                        <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                    </button>
                ` : `
                    <a href="#admin" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                        Iniciar Sesión
                    </a>
                `}
                <button id="mobileMenuBtn" class="md:hidden ml-4 text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                    <i class="fas fa-bars text-xl"></i>
                </button>
            </div>
        </div>
        <!-- Menú móvil -->
        <div id="mobileMenu" class="md:hidden hidden bg-white border-t shadow-lg transform origin-top transition-all duration-300 scale-y-0 opacity-0">
            <nav class="container mx-auto px-4 py-3">
                <ul class="space-y-3">
                    <li><a href="#" class="block text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-50">Inicio</a></li>
                    <li><a href="#catalog" class="block text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-50">Catálogo</a></li>
                    <li><a href="#admin" class="block text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-50">Admin</a></li>
                    <li><a href="#contact" class="block text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2 px-3 rounded-lg hover:bg-blue-50">Contacto</a></li>
                    ${isLoggedIn ? `
                    <li>
                        <button class="w-full text-left text-red-600 hover:text-red-800 mobile-logout-btn py-2 px-3 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center">
                            <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                        </button>
                    </li>
                    ` : ''}
                </ul>
            </nav>
        </div>
    `;

    // Configurar event listeners
    setupHeaderEventListeners();
}

// Configurar event listeners del header
function setupHeaderEventListeners() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    // Menú móvil
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.remove('hidden');
                setTimeout(() => {
                    mobileMenu.classList.remove('scale-y-0', 'opacity-0');
                    mobileMenu.classList.add('scale-y-100', 'opacity-100');
                }, 10);
            } else {
                mobileMenu.classList.add('scale-y-0', 'opacity-0');
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            }
        });
    }

    // Cerrar sesión - versión desktop
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof window.handleLogout === 'function') {
                window.handleLogout();
            }
        });
    }

    // Cerrar sesión - versión móvil
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            if (typeof window.handleLogout === 'function') {
                window.handleLogout();
            }
        });
    }

    // Cerrar menú móvil al hacer clic en un enlace
    const mobileLinks = document.querySelectorAll('#mobileMenu a, #mobileMenu button');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.add('scale-y-0', 'opacity-0');
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            }
        });
    });

    // Cerrar menú móvil al hacer clic fuera
    document.addEventListener('click', (e) => {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn && 
                !mobileMenuBtn.contains(e.target)) {
                mobileMenu.classList.add('scale-y-0', 'opacity-0');
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            }
        }
    });

    // Efecto de scroll en el header
    let lastScrollY = window.scrollY;
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('shadow-md', 'bg-white/95', 'backdrop-blur-sm');
            header.classList.remove('bg-white');
        } else {
            header.classList.remove('shadow-md', 'bg-white/95', 'backdrop-blur-sm');
            header.classList.add('bg-white');
        }
        
        // Ocultar/mostrar header al hacer scroll
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = window.scrollY;
    });
}

// Actualizar header cuando cambie el estado de autenticación
export function updateHeader() {
    renderHeader();
}

// Hacer funciones disponibles globalmente
window.updateHeader = updateHeader;
