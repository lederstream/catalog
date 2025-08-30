import { supabase } from './supabase.js';
import { showNotification, validateEmail, validateRequired } from './utils.js';
import { loadProducts as loadAdminProducts } from './products.js';
import { loadCategories } from './categories.js';

// Estado de autenticación
let currentUser = null;

// Verificar autenticación al cargar
export const checkAuth = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            showAdminPanel();
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        loginBtn.disabled = true;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showAdminPanel();
        showNotification('Sesión iniciada correctamente', 'success');
        
    } catch (error) {
        console.error('Error logging in:', error);
        
        if (error.message.includes('Invalid login credentials')) {
            showNotification('Credenciales inválidas', 'error');
        } else {
            showNotification('Error al iniciar sesión: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botón
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.innerHTML = 'Iniciar Sesión';
        loginBtn.disabled = false;
    }
};

// Manejar registro
export const handleRegister = async () => {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
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
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        registerBtn.disabled = true;
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        
        showNotification('Cuenta creada exitosamente. Revisa tu email para confirmar.', 'success');
        showLoginForm();
        
    } catch (error) {
        console.error('Error registering:', error);
        
        if (error.message.includes('User already registered')) {
            showNotification('Este usuario ya está registrado', 'error');
        } else {
            showNotification('Error al crear la cuenta: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botón
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.innerHTML = 'Crear Cuenta';
        registerBtn.disabled = false;
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
        
    } catch (error) {
        console.error('Error logging out:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
};

// Mostrar panel de administración
const showAdminPanel = () => {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    
    // Cargar datos del admin
    loadAdminProducts();
    loadCategories();
};

// Ocultar panel de administración
const hideAdminPanel = () => {
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
};

// Mostrar formulario de login
export const showLoginForm = () => {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
};

// Mostrar formulario de registro
export const showRegisterForm = () => {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
};

// Obtener usuario actual
export const getCurrentUser = () => {
    return currentUser;
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
    return currentUser !== null;
};

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        showAdminPanel();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        hideAdminPanel();
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
        
        showNotification('Email de restablecimiento enviado', 'success');
        return true;
    } catch (error) {
        console.error('Error resetting password:', error);
        showNotification('Error al enviar email de restablecimiento', 'error');
        return false;
    }
};

// Actualizar contraseña
export const updatePassword = async (newPassword) => {
    if (newPassword.length < 6) {
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
    // Esta función necesitaría implementación basada en cómo manejas los roles
    // Podrías almacenar roles en metadata del usuario o en una tabla separada
    return currentUser && currentUser.role === role;
};

// Obtener metadata del usuario
export const getUserMetadata = () => {
    return currentUser ? currentUser.user_metadata : null;
};

// Configurar event listeners de autenticación
export const setupAuthEventListeners = () => {
    // Login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    
    // Registro
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Cambiar entre login y registro
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    // Enter key en formularios
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    document.getElementById('registerPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    });
    
    document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    });
};
