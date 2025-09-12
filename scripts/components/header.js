// scripts/components/header.js
import { isUserLoggedIn, getCurrentUser } from '../core/auth.js';

// Renderizar header
export function renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const isLoggedIn = isUserLoggedIn();
    const user = getCurrentUser();

    header.innerHTML = `
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center">
                <h1 class="text-xl md:text-2xl font-bold text-blue-700">DigitalCatalog</h1>
                <nav class="ml-8 hidden md:block">
                    <ul class="flex space-x-6">
                        <li><a href="#" class="text-gray-700 hover:text-blue-600">Inicio</a></li>
                        <li><a href="#catalog" class="text-gray-700 hover:text-blue-600">Catálogo</a></li>
                        <li><a href="#admin" class="text-gray-700 hover:text-blue-600">Admin</a></li>
                        <li><a href="#contact" class="text-gray-700 hover:text-blue-600">Contacto</a></li>
                    </ul>
                </nav>
            </div>
            <div class="flex items-center">
                ${isLoggedIn ? `
                    <span class="hidden md:inline mr-4 text-gray-700">Hola, ${user?.email || 'Usuario'}</span>
                    <button id="mobileLogoutBtn" class="md:hidden text-gray-700 mr-2">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                    <button id="logoutBtn" class="hidden md:flex items-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-300">
                        <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                    </button>
                ` : `
                    <a href="#admin" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-300">
                        Iniciar Sesión
                    </a>
                `}
                <button id="mobileMenuBtn" class="md:hidden ml-4 text-gray-700">
                    <i class="fas fa-bars text-xl"></i>
                </button>
            </div>
        </div>
        <!-- Menú móvil -->
        <div id="mobileMenu" class="md:hidden hidden bg-white border-t">
            <nav class="container mx-auto px-4 py-3">
                <ul class="space-y-3">
                    <li><a href="#" class="block text-gray-700 hover:text-blue-600">Inicio</a></li>
                    <li><a href="#catalog" class="block text-gray-700 hover:text-blue-600">Catálogo</a></li>
                    <li><a href="#admin" class="block text-gray-700 hover:text-blue-600">Admin</a></li>
                    <li><a href="#contact" class="block text-gray-700 hover:text-blue-600">Contacto</a></li>
                    ${isLoggedIn ? `
                    <li>
                        <button class="w-full text-left text-red-600 hover:text-red-800 mobile-logout-btn">
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

    // Menú móvil
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Cerrar menú móvil al hacer clic en un enlace
    const mobileLinks = document.querySelectorAll('#mobileMenu a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
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
                mobileMenu.classList.add('hidden');
            }
        }
    });
}

// Actualizar header cuando cambie el estado de autenticación
export function updateHeader() {
    renderHeader();
}

// Hacer funciones disponibles globalmente
window.updateHeader = updateHeader;
