// scripts/auth.js
// scripts/auth.js
import { supabase } from './supabase.js';
import { Utils } from './utils.js';

// Estado de autenticación
class AuthState {
    constructor() {
        this.currentUser = null;
        this.authInitialized = false;
        this.session = null;
        this.authListeners = [];
    }
    
    static getInstance() {
        if (!AuthState.instance) {
            AuthState.instance = new AuthState();
        }
        return AuthState.instance;
    }
    
    setUser(user) {
        const previousUser = this.currentUser;
        this.currentUser = user;
        
        if (user) {
            localStorage.setItem('authUser', JSON.stringify({
                id: user.id,
                email: user.email,
                lastLogin: new Date().toISOString()
            }));
        } else {
            localStorage.removeItem('authUser');
        }
        
        // Notificar a los listeners
        this._notifyAuthChange(previousUser, user);
    }
    
    restoreUser() {
        try {
            const savedUser = localStorage.getItem('authUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                this.currentUser = { id: userData.id, email: userData.email };
                return true;
            }
        } catch (error) {
            console.warn('Error restoring user from localStorage:', error);
        }
        return false;
    }
    
    addAuthListener(callback) {
        this.authListeners.push(callback);
    }
    
    removeAuthListener(callback) {
        this.authListeners = this.authListeners.filter(listener => listener !== callback);
    }
    
    _notifyAuthChange(previousUser, currentUser) {
        this.authListeners.forEach(listener => {
            try {
                listener(previousUser, currentUser);
            } catch (error) {
                console.error('Error en auth listener:', error);
            }
        });
    }
}

// Variables globales para compatibilidad
let currentUser = null;
let authInitialized = false;

// Verificar autenticación al cargar
export const checkAuth = async () => {
    const authState = AuthState.getInstance();
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error obteniendo sesión:', error);
            // Intentar restaurar desde localStorage
            if (authState.restoreUser()) {
                currentUser = authState.currentUser;
                return true;
            }
            return false;
        }
        
        if (session) {
            authState.setUser(session.user);
            authState.session = session;
            currentUser = session.user;
            console.log('✅ Usuario autenticado:', session.user.email);
            await showAdminPanel();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking auth:', error);
        Utils.showError('❌ Error al verificar la autenticación');
        return false;
    }
};

// Manejar login
export const handleLogin = async (email, password) => {
    const authState = AuthState.getInstance();
    
    if (!Utils.validateRequired(email) || !Utils.validateRequired(password)) {
        Utils.showError('📝 Por favor completa todos los campos');
        return false;
    }
    
    if (!Utils.validateEmail(email)) {
        Utils.showError('📧 Por favor ingresa un email válido');
        return false;
    }
    
    try {
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn?.innerHTML;
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            loginBtn.disabled = true;
            loginBtn.classList.add('opacity-75');
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        
        if (error) throw error;
        
        authState.setUser(data.user);
        authState.session = data.session;
        currentUser = data.user;
        
        // Animación de éxito
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-check"></i> ¡Éxito!';
            loginBtn.classList.remove('opacity-75');
            loginBtn.classList.add('bg-green-600');
            
            setTimeout(async () => {
                await showAdminPanel();
                Utils.showSuccess('✅ Sesión iniciada correctamente');
                
                // Restaurar botón después de 2 segundos
                setTimeout(() => {
                    if (loginBtn) {
                        loginBtn.innerHTML = originalText;
                        loginBtn.disabled = false;
                        loginBtn.classList.remove('bg-green-600');
                    }
                }, 2000);
            }, 500);
        }
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: data.user, isAuthenticated: true } 
        }));
        
        return true;
    } catch (error) {
        console.error('Error logging in:', error);
        
        // Restaurar botón
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = 'Iniciar Sesión';
            loginBtn.disabled = false;
            loginBtn.classList.remove('opacity-75');
        }
        
        if (error.message.includes('Invalid login credentials')) {
            Utils.showError('🔐 Credenciales inválidas');
        } else if (error.message.includes('Email not confirmed')) {
            Utils.showWarning('📧 Por favor confirma tu email antes de iniciar sesión');
        } else if (error.message.includes('Failed to fetch')) {
            Utils.showError('📶 Error de conexión. Verifica tu conexión a internet.');
        } else {
            Utils.showError('❌ Error al iniciar sesión: ' + error.message);
        }
        
        return false;
    }
};

// Manejar registro
export const handleRegister = async () => {
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    if (!Utils.validateRequired(email) || !Utils.validateRequired(password) || !Utils.validateRequired(confirmPassword)) {
        Utils.showError('📝 Por favor completa todos los campos');
        return;
    }
    
    if (!Utils.validateEmail(email)) {
        Utils.showError('📧 Por favor ingresa un email válido');
        return;
    }
    
    if (password.length < 6) {
        Utils.showError('🔒 La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== confirmPassword) {
        Utils.showError('🔒 Las contraseñas no coinciden');
        return;
    }
    
    try {
        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn?.innerHTML;
        
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
            registerBtn.disabled = true;
            registerBtn.classList.add('opacity-75');
        }
        
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    role: 'admin',
                    created_at: new Date().toISOString()
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user?.identities?.length === 0) {
            Utils.showWarning('📧 Este email ya está registrado');
            return;
        }
        
        // Animación de éxito
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-check"></i> ¡Cuenta creada!';
            registerBtn.classList.remove('opacity-75');
            registerBtn.classList.add('bg-green-600');
            
            setTimeout(() => {
                Utils.showSuccess('✅ Cuenta creada exitosamente. Revisa tu email para confirmar.');
                showLoginForm();
                
                // Restaurar botón después de 2 segundos
                setTimeout(() => {
                    if (registerBtn) {
                        registerBtn.innerHTML = originalText;
                        registerBtn.disabled = false;
                        registerBtn.classList.remove('bg-green-600');
                    }
                }, 2000);
            }, 500);
        }
        
    } catch (error) {
        console.error('Error registering:', error);
        
        // Restaurar botón
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.innerHTML = 'Crear Cuenta';
            registerBtn.disabled = false;
            registerBtn.classList.remove('opacity-75');
        }
        
        if (error.message.includes('User already registered')) {
            Utils.showError('📧 Este usuario ya está registrado');
        } else if (error.message.includes('Password should be at least 6 characters')) {
            Utils.showError('🔒 La contraseña debe tener al menos 6 caracteres');
        } else if (error.message.includes('Invalid email')) {
            Utils.showError('📧 El formato del email no es válido');
        } else if (error.message.includes('Failed to fetch')) {
            Utils.showError('📶 Error de conexión. Verifica tu conexión a internet.');
        } else {
            Utils.showError('❌ Error al crear la cuenta: ' + error.message);
        }
    }
};

// Manejar logout
export const handleLogout = async () => {
    try {
        const logoutBtn = document.getElementById('logoutBtn');
        const originalText = logoutBtn?.innerHTML;
        
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando...';
            logoutBtn.disabled = true;
        }
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        const authState = AuthState.getInstance();
        authState.setUser(null);
        currentUser = null;
        
        // Animación de salida
        await Utils.fadeOut(document.getElementById('adminPanel'));
        hideAdminPanel();
        
        Utils.showSuccess('👋 Sesión cerrada correctamente');
        
        // Restaurar botón
        if (logoutBtn) {
            logoutBtn.innerHTML = originalText;
            logoutBtn.disabled = false;
        }
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: null, isAuthenticated: false } 
        }));
        
    } catch (error) {
        console.error('Error logging out:', error);
        Utils.showError('❌ Error al cerrar sesión');
        
        // Restaurar botón en caso de error
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.innerHTML = 'Cerrar Sesión';
            logoutBtn.disabled = false;
        }
    }
};

// Mostrar panel de administración
const showAdminPanel = async () => {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginForm) {
        await Utils.fadeOut(loginForm);
        loginForm.classList.add('hidden');
    }
    
    if (registerForm) {
        registerForm.classList.add('hidden');
    }
    
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
        await Utils.fadeIn(adminPanel);
    }
    
    try {
        // Esperar a que los componentes estén disponibles
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Cargar datos de administración
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
        }
        
        if (typeof window.loadCategories === 'function') {
            await window.loadCategories();
        }
        
        // Configurar formulario de productos si existe
        if (typeof window.setupProductForm === 'function') {
            window.setupProductForm();
        }
        
        // Renderizar lista de productos en el panel de administración
        if (typeof window.renderAdminProductsList === 'function') {
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList) {
                const products = window.getProducts ? window.getProducts() : [];
                window.renderAdminProductsList(products, adminProductsList);
            }
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        Utils.showError('❌ Error al cargar datos de administración');
    }
};

// Ocultar panel de administración
const hideAdminPanel = () => {
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    
    if (adminPanel) adminPanel.classList.add('hidden');
    if (loginForm) {
        loginForm.classList.remove('hidden');
        Utils.fadeIn(loginForm);
    }
};

// Mostrar formulario de login
export const showLoginForm = () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        Utils.fadeOut(registerForm).then(() => {
            registerForm.classList.add('hidden');
        });
    }
    
    if (loginForm) {
        loginForm.classList.remove('hidden');
        Utils.fadeIn(loginForm).then(() => {
            // Enfocar el primer campo
            const emailInput = loginForm.querySelector('input[type="email"]');
            if (emailInput) emailInput.focus();
        });
    }
};

// Mostrar formulario de registro
export const showRegisterForm = () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        Utils.fadeOut(loginForm).then(() => {
            loginForm.classList.add('hidden');
        });
    }
    
    if (registerForm) {
        registerForm.classList.remove('hidden');
        Utils.fadeIn(registerForm).then(() => {
            // Enfocar el primer campo
            const emailInput = registerForm.querySelector('input[type="email"]');
            if (emailInput) emailInput.focus();
        });
    }
};

// Obtener usuario actual
export const getCurrentUser = () => {
    return currentUser;
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
    return currentUser !== null;
};

// Alias para compatibilidad
export const isUserLoggedIn = isAuthenticated;

// Configurar event listeners de autenticación
export const setupAuthEventListeners = () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            
            if (!email || !password) {
                Utils.showError('📝 Por favor ingresa email y contraseña');
                return;
            }
            
            await handleLogin(email, password);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleRegister();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLogout();
        });
    }
    
    // Show register link
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    // Show login link
    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
};

// Inicializar auth
export const initializeAuth = async () => {
    if (authInitialized) {
        console.warn('Auth ya inicializado');
        return;
    }
    
    try {        
        // Configurar listeners
        setupAuthEventListeners();
        
        // Luego verificar auth
        await checkAuth();
        
        authInitialized = true;
                
    } catch (error) {
        console.error('Error initializing auth:', error);
        Utils.showError('❌ Error al inicializar autenticación');
    }
};

// Listener para cambios de autenticación
AuthState.getInstance().addAuthListener((previousUser, currentUser) => {
    console.log('🔄 Cambio de estado de autenticación:', 
        previousUser ? previousUser.email : 'null', 
        '→', 
        currentUser ? currentUser.email : 'null'
    );
    
    // Actualizar UI según el estado de autenticación
    updateAuthDependentUI(!!currentUser);
});

// Actualizar UI dependiente de autenticación
const updateAuthDependentUI = (isAuthenticated) => {
    // Elementos que solo deben mostrarse a usuarios autenticados
    const authOnlyElements = document.querySelectorAll('[data-auth-only]');
    authOnlyElements.forEach(el => {
        el.style.display = isAuthenticated ? '' : 'none';
    });
    
    // Elementos que solo deben mostrarse a usuarios no autenticados
    const unauthOnlyElements = document.querySelectorAll('[data-unauth-only]');
    unauthOnlyElements.forEach(el => {
        el.style.display = isAuthenticated ? 'none' : '';
    });
};

// Hacer funciones disponibles globalmente
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.handleRegister = handleRegister;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.logout = handleLogout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.isUserLoggedIn = isUserLoggedIn;
window.initializeAuth = initializeAuth;
