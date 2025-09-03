import { supabase } from './supabase.js';
import { showNotification, validateEmail, validateRequired } from './utils.js';

// Estado de autenticación
class AuthState {
    constructor() {
        this.currentUser = null;
        this.authInitialized = false;
        this.session = null;
    }
    
    static getInstance() {
        if (!AuthState.instance) {
            AuthState.instance = new AuthState();
        }
        return AuthState.instance;
    }
    
    setUser(user) {
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
}

// Variables globales para compatibilidad
let currentUser = null;
let authInitialized = false;

// Verificar autenticación al cargar
export const checkAuth = async () => {
    const authState = AuthState.getInstance();
    
    try {
        console.log('🔐 Verificando autenticación...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error obteniendo sesión:', error);
            // Intentar restaurar desde localStorage
            if (authState.restoreUser()) {
                console.log('✅ Usuario restaurado desde almacenamiento local');
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
        
        console.log('ℹ️ No hay sesión activa');
        return false;
    } catch (error) {
        console.error('Error checking auth:', error);
        showNotification('Error al verificar la autenticación', 'error');
        return false;
    }
};

// Manejar login
export const handleLogin = async (email, password) => {
    const authState = AuthState.getInstance();
    
    if (!validateRequired(email) || !validateRequired(password)) {
        showNotification('Por favor completa todos los campos', 'error');
        return false;
    }
    
    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    try {
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn?.innerHTML;
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            loginBtn.disabled = true;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        
        if (error) throw error;
        
        authState.setUser(data.user);
        authState.session = data.session;
        currentUser = data.user;
        await showAdminPanel();
        showNotification('Sesión iniciada correctamente', 'success');
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: data.user, isAuthenticated: true } 
        }));
        
        return true;
    } catch (error) {
        console.error('Error logging in:', error);
        
        if (error.message.includes('Invalid login credentials')) {
            showNotification('Credenciales inválidas', 'error');
        } else if (error.message.includes('Email not confirmed')) {
            showNotification('Por favor confirma tu email antes de iniciar sesión', 'warning');
        } else if (error.message.includes('Failed to fetch')) {
            showNotification('Error de conexión. Verifica tu conexión a internet.', 'error');
        } else {
            showNotification('Error al iniciar sesión: ' + error.message, 'error');
        }
        
        return false;
    } finally {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = 'Iniciar Sesión';
            loginBtn.disabled = false;
        }
    }
};

// Manejar registro
export const handleRegister = async () => {
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    if (!validateRequired(email) || !validateRequired(password) || !validateRequired(confirmPassword)) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn?.innerHTML;
        
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
            registerBtn.disabled = true;
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
            showNotification('Este email ya está registrado', 'warning');
            return;
        }
        
        showNotification('Cuenta creada exitosamente. Revisa tu email para confirmar.', 'success');
        showLoginForm();
        
    } catch (error) {
        console.error('Error registering:', error);
        
        if (error.message.includes('User already registered')) {
            showNotification('Este usuario ya está registrado', 'error');
        } else if (error.message.includes('Password should be at least 6 characters')) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        } else if (error.message.includes('Invalid email')) {
            showNotification('El formato del email no es válido', 'error');
        } else if (error.message.includes('Failed to fetch')) {
            showNotification('Error de conexión. Verifica tu conexión a internet.', 'error');
        } else {
            showNotification('Error al crear la cuenta: ' + error.message, 'error');
        }
    } finally {
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.innerHTML = 'Crear Cuenta';
            registerBtn.disabled = false;
        }
    }
};

// Manejar logout
export const handleLogout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        const authState = AuthState.getInstance();
        authState.setUser(null);
        currentUser = null;
        hideAdminPanel();
        showLoginForm();
        showNotification('Sesión cerrada correctamente', 'success');
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: null, isAuthenticated: false } 
        }));
        
    } catch (error) {
        console.error('Error logging out:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
};

// Mostrar panel de administración
const showAdminPanel = async () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (adminPanel) adminPanel.classList.remove('hidden');
    
    try {
        // Cargar datos de administración
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
        }
        
        if (typeof window.loadCategories === 'function') {
            await window.loadCategories();
        }
        
        // Renderizar lista de productos en el panel de administración
        if (typeof window.renderAdminProductsList === 'function') {
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList) {
                const products = window.getProducts ? window.getProducts() : [];
                window.renderAdminProductsList(products, adminProductsList);
            }
        }
        
        // Configurar formulario de productos
        if (typeof window.setupProductForm === 'function') {
            window.setupProductForm();
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        showNotification('Error al cargar datos de administración', 'error');
    }
};

// Ocultar panel de administración
const hideAdminPanel = () => {
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    
    if (adminPanel) adminPanel.classList.add('hidden');
    if (loginForm) loginForm.classList.remove('hidden');
};

// Mostrar formulario de login
export const showLoginForm = () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) registerForm.classList.add('hidden');
    if (loginForm) {
        loginForm.classList.remove('hidden');
        // Enfocar el primer campo
        const emailInput = loginForm.querySelector('input[type="email"]');
        if (emailInput) emailInput.focus();
    }
};

// Mostrar formulario de registro
export const showRegisterForm = () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) {
        registerForm.classList.remove('hidden');
        // Enfocar el primer campo
        const emailInput = registerForm.querySelector('input[type="email"]');
        if (emailInput) emailInput.focus();
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

// Configurar event listeners de manera más robusta
const attachEventListener = (elementId, event, handler) => {
    const tryAttach = () => {
        const element = document.getElementById(elementId);
        if (element && !element.dataset.listenerAttached) {
            element.addEventListener(event, handler);
            element.dataset.listenerAttached = 'true';
            console.log(`✅ Event listener attached to ${elementId}`);
            return true;
        }
        return false;
    };
    
    // Intentar inmediatamente
    if (tryAttach()) return;
    
    // Si no funciona, usar observer
    const observer = new MutationObserver(() => {
        if (tryAttach()) {
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Fallback con timeout
    setTimeout(() => {
        tryAttach();
        observer.disconnect();
    }, 2000);
};

// Configurar event listeners de autenticación - VERSIÓN CORREGIDA
export const setupAuthEventListeners = () => {
    console.log('🔧 Configurando event listeners de autenticación...');
    
    // Método 1: Event Delegation (más confiable)
    document.removeEventListener('click', handleGlobalClick);
    document.addEventListener('click', handleGlobalClick);
    
    // Método 2: Listeners directos con observer
    attachEventListener('loginBtn', 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Login button clicked');
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            showNotification('Por favor ingresa email y contraseña', 'error');
            return;
        }
        
        await handleLogin(email, password);
    });
    
    attachEventListener('registerBtn', 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Register button clicked');
        await handleRegister();
    });
    
    attachEventListener('logoutBtn', 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Logout button clicked');
        await handleLogout();
    });
    
    attachEventListener('showRegister', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showRegisterForm();
    });
    
    attachEventListener('showLogin', 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showLoginForm();
    });
    
    // Configurar tecla Enter
    setupEnterKeyHandlers();
    
    console.log('✅ Event listeners de auth configurados');
};

// Manejador global de clicks
function handleGlobalClick(e) {
    const target = e.target;
    const button = target.closest('button');
    
    if (!button) return;
    
    console.log('🖱️ Global click detected on:', button.id || button.className);
    
    switch (button.id) {
        case 'loginBtn':
            e.preventDefault();
            e.stopPropagation();
            console.log('🔑 Handling login...');
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            
            if (!email || !password) {
                showNotification('Por favor ingresa email y contraseña', 'error');
                return;
            }
            
            handleLogin(email, password);
            break;
            
        case 'registerBtn':
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Handling register...');
            handleRegister();
            break;
            
        case 'logoutBtn':
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Handling logout...');
            handleLogout();
            break;
            
        case 'showRegister':
            e.preventDefault();
            e.stopPropagation();
            showRegisterForm();
            break;
            
        case 'showLogin':
            e.preventDefault();
            e.stopPropagation();
            showLoginForm();
            break;
    }
}

// Configurar manejadores de tecla Enter
const setupEnterKeyHandlers = () => {
    // Usar event delegation para los campos de entrada
    document.addEventListener('keypress', (e) => {
        if (e.key !== 'Enter') return;
        
        const target = e.target;
        
        // Login form
        if (target.id === 'email' || target.id === 'password') {
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            
            if (email && password) {
                e.preventDefault();
                handleLogin(email, password);
            }
        }
        
        // Register form
        if (target.id === 'registerEmail' || target.id === 'registerPassword' || target.id === 'confirmPassword') {
            e.preventDefault();
            handleRegister();
        }
    });
};

// Inicializar auth
export const initializeAuth = async () => {
    if (authInitialized) {
        console.warn('Auth ya inicializado');
        return;
    }
    
    try {
        console.log('🔄 Inicializando autenticación...');
        
        // Configurar listeners INMEDIATAMENTE
        setupAuthEventListeners();
        
        // Luego verificar auth
        await checkAuth();
        
        authInitialized = true;
        console.log('✅ Auth inicializado correctamente');
        
    } catch (error) {
        console.error('Error initializing auth:', error);
        showNotification('Error al inicializar autenticación', 'error');
    }
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
