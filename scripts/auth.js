// scripts/auth.js
import { supabase } from './supabase.js';
import { showNotification, validateEmail, validateRequired } from './utils.js';
import { loadProducts } from './products.js';
import { loadCategories } from './categories.js';
import { updateHeader } from './components/header.js';
import { refreshData } from './app.js';

// Estado de autenticación
let currentUser = null;

// Verificar autenticación al cargar
export const checkAuth = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            await showAdminPanel();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking auth:', error);
        showNotification('Error al verificar la autenticación', 'error');
        return false;
    }
};

// Manejar login
export const handleLogin = async () => {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!validateRequired(email) || !validateRequired(password)) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            loginBtn.disabled = true;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await showAdminPanel();
        showNotification('Sesión iniciada correctamente', 'success');
        
        // Disparar evento personalizado para cambios de autenticación
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: currentUser, isAuthenticated: true } 
        }));
        
    } catch (error) {
        console.error('Error logging in:', error);
        
        if (error.message.includes('Invalid login credentials')) {
            showNotification('Credenciales inválidas', 'error');
        } else if (error.message.includes('Email not confirmed')) {
            showNotification('Por favor confirma tu email antes de iniciar sesión', 'warning');
        } else {
            showNotification('Error al iniciar sesión: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botón
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
        // Mostrar indicador de carga
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            const originalText = registerBtn.innerHTML;
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
            registerBtn.disabled = true;
        }
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    role: 'admin'
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
        } else {
            showNotification('Error al crear la cuenta: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botón
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
        
        // Disparar evento personalizado para cambios de autenticación
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
    
    // Cargar datos del admin
    try {
        await loadProducts();
        await loadCategories();
        
        if (typeof window.renderAdminProductsList === 'function') {
            const adminProductsList = document.getElementById('adminProductsList');
            if (adminProductsList) {
                const products = await loadProducts();
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
    if (loginForm) loginForm.classList.remove('hidden');
};

// Mostrar formulario de registro
export const showRegisterForm = () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.remove('hidden');
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

// Manejar cambios de autenticación
export const handleAuthChange = async () => {
    try {
        await refreshData();
        if (typeof updateHeader === 'function') {
            updateHeader();
        }
        
        // Disparar evento personalizado
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
};

// Inicializar auth
export const initializeAuth = async () => {
    try {
        await checkAuth();
        setupAuthEventListeners();
        
        window.addEventListener('authStateChanged', (event) => {
            console.log('Auth state changed event:', event.detail);
        });
        
    } catch (error) {
        console.error('Error initializing auth:', error);
        showNotification('Error al inicializar autenticación', 'error');
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
