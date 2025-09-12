import { supabase } from './supabase.js';
import Utils from './utils.js';

// Estado de autenticación
class AuthState {
    constructor() {
        this.currentUser = null;
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
                email: user.email
            }));
        } else {
            localStorage.removeItem('authUser');
        }
    }
}

// Verificar autenticación al cargar
export const checkAuth = async () => {
    const authState = AuthState.getInstance();
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            authState.setUser(session.user);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking auth:', error);
        return false;
    }
};

// Manejar login
export const handleLogin = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        
        if (error) throw error;
        
        const authState = AuthState.getInstance();
        authState.setUser(data.user);
        
        Utils.showSuccess('✅ Sesión iniciada correctamente');
        return true;
        
    } catch (error) {
        console.error('Error logging in:', error);
        Utils.showError('❌ Error al iniciar sesión');
        return false;
    }
};

// Manejar logout
export const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
        const authState = AuthState.getInstance();
        authState.setUser(null);
        Utils.showSuccess('👋 Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error logging out:', error);
        Utils.showError('❌ Error al cerrar sesión');
    }
};

// Inicializar auth
export const initializeAuth = async () => {
    await checkAuth();
};

// Hacer funciones disponibles globalmente
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.checkAuth = checkAuth;
