// scripts/auth.js
import { supabase } from './supabase.js';
import { showNotification, validateEmail, validateRequired, debounce } from './utils.js';

// Estado de autenticación con persistencia
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
        // Persistir en localStorage para recuperación
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
                return true;
            }
            return false;
        }
        
        if (session) {
            authState.setUser(session.user);
            authState.session = session;
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
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
        }
        
        if (typeof window.loadCategories === 'function') {
            await window.loadCategories();
        }
        
        if (typeof window.renderAdminProductsList === 'function') {
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList) {
                const products = await window.loadProducts();
                window.renderAdminProductsList(products, adminProductsList);
            }
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

// Función auxiliar para recargar datos
const refreshAuthData = async () => {
    try {
        showNotification('Actualizando datos de autenticación...', 'info');
        
        if (typeof window.loadProducts === 'function') {
            await window.loadProducts();
        }
        
        if (typeof window.loadCategories === 'function') {
            await window.loadCategories();
        }
        
        if (typeof window.updateHeader === 'function') {
            window.updateHeader();
        }
        
        showNotification('Datos de autenticación actualizados', 'success');
    } catch (error) {
        console.error('Error refreshing auth data:', error);
        showNotification('Error al actualizar datos de autenticación', 'error');
    }
};

// Manejar cambios de autenticación
export const handleAuthChange = async () => {
    try {
        await refreshAuthData();
        
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { 
                user: currentUser, 
                isAuthenticated: isAuthenticated() 
            } 
        }));
        
    } catch (error) {
        console.error('Error handling auth change:', error);
        showNotification('Error al actualizar datos de autenticación', 'error');
    }
};

// Escuchar cambios de autenticación de Supabase
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        await showAdminPanel();
        await handleAuthChange();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        hideAdminPanel();
        showLoginForm();
        await handleAuthChange();
    } else if (event === 'USER_UPDATED') {
        currentUser = session.user;
        await handleAuthChange();
    } else if (event === 'PASSWORD_RECOVERY') {
        showNotification('Proceso de recuperación de contraseña iniciado', 'info');
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
    }
});

// Restablecer contraseña
export const resetPassword = async (email) => {
    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        showNotification('Email de restablecimiento enviado. Revisa tu bandeja de entrada.', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting password:', error);
        showNotification('Error al enviar email de restablecimiento', 'error');
        return false;
    }
};

// Actualizar contraseña
export const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }
    
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        showNotification('Contraseña actualizada correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        showNotification('Error al actualizar la contraseña', 'error');
        return false;
    }
};

// Actualizar perfil de usuario
export const updateProfile = async (updates) => {
    try {
        if (!updates || Object.keys(updates).length === 0) {
            showNotification('No hay datos para actualizar', 'warning');
            return false;
        }
        
        const { error } = await supabase.auth.updateUser(updates);
        
        if (error) throw error;
        
        showNotification('Perfil actualizado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error al actualizar el perfil', 'error');
        return false;
    }
};

// Verificar si el usuario tiene un rol específico
export const hasRole = (role) => {
    return currentUser && currentUser.user_metadata?.role === role;
};

// Obtener metadata del usuario
export const getUserMetadata = () => {
    return currentUser ? currentUser.user_metadata : null;
};

// Verificar si el usuario es administrador
export const isAdmin = () => {
    return hasRole('admin') || (currentUser && currentUser.email?.endsWith('@admin.com'));
};

// Configurar event listeners de autenticación
export const setupAuthEventListeners = () => {
    // Login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Registro
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Cambiar entre login y registro
    const showRegisterLink = document.getElementById('showRegister');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    const showLoginLink = document.getElementById('showLogin');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Enter key en formularios
    const setupEnterKey = (inputElement, handler) => {
        if (inputElement) {
            inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handler();
                }
            });
        }
    };
    
    setupEnterKey(document.getElementById('password'), handleLogin);
    setupEnterKey(document.getElementById('registerPassword'), handleRegister);
    setupEnterKey(document.getElementById('confirmPassword'), handleRegister);
    setupEnterKey(document.getElementById('email'), handleLogin);
    
    // Prevenir envío de formularios con Enter
    const authForms = document.querySelectorAll('#loginForm, #registerForm');
    authForms.forEach(form => {
        form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    });
};

// Inicializar auth
export const initializeAuth = async () => {
    if (authInitialized) {
        console.warn('Auth ya inicializado');
        return;
    }
    
    try {
        await checkAuth();
        setupAuthEventListeners();
        
        window.addEventListener('authStateChanged', (event) => {
            console.log('Auth state changed event:', event.detail);
            if (typeof window.updateHeader === 'function') {
                window.updateHeader();
            }
        });
        
        authInitialized = true;
        console.log('✅ Auth inicializado correctamente');
        
    } catch (error) {
        console.error('Error initializing auth:', error);
    }
};

// Función para obtener el token de acceso
export const getAccessToken = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

// Función para verificar si el email está confirmado
export const isEmailConfirmed = () => {
    return currentUser?.email_confirmed_at !== null;
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
window.handleAuthChange = handleAuthChange;
