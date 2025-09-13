// scripts/core/auth.js
import { supabase } from './supabase.js';
import { Utils } from './utils.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.authStateListeners = new Set();
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Verificar sesión existente
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error obteniendo sesión:', error);
                throw error;
            }
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Usuario autenticado:', this.currentUser.email);
            }
            
            this.isInitialized = true;
            
            // Escuchar cambios de autenticación
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    this.notifyAuthStateChange('SIGNED_IN', session.user);
                    Utils.showSuccess('✅ Sesión iniciada correctamente');
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.notifyAuthStateChange('SIGNED_OUT', null);
                    Utils.showInfo('👋 Sesión cerrada');
                } else if (event === 'TOKEN_REFRESHED') {
                    this.notifyAuthStateChange('TOKEN_REFRESHED', this.currentUser);
                }
            });
            
        } catch (error) {
            console.error('Error inicializando auth:', error);
            throw error;
        }
    }
    
    async signIn(email, password) {
        try {
            this.notifyAuthStateChange('SIGNING_IN', null);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                this.notifyAuthStateChange('SIGN_IN_ERROR', error);
                throw error;
            }
            
            this.currentUser = data.user;
            this.notifyAuthStateChange('SIGNED_IN', data.user);
            return true;
            
        } catch (error) {
            console.error('Error signing in:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email o contraseña incorrectos';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
            }
            
            Utils.showError(errorMessage);
            this.notifyAuthStateChange('SIGN_IN_ERROR', error);
            return false;
        }
    }
    
    async signOut() {
        try {
            this.notifyAuthStateChange('SIGNING_OUT', null);
            
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.notifyAuthStateChange('SIGNED_OUT', null);
            return true;
            
        } catch (error) {
            console.error('Error signing out:', error);
            Utils.showError('Error al cerrar sesión');
            this.notifyAuthStateChange('SIGN_OUT_ERROR', error);
            return false;
        }
    }
    
    async signUp(email, password, userData = {}) {
        try {
            this.notifyAuthStateChange('SIGNING_UP', null);
            
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: userData
                }
            });
            
            if (error) throw error;
            
            this.notifyAuthStateChange('SIGNED_UP', data.user);
            return data;
            
        } catch (error) {
            console.error('Error signing up:', error);
            Utils.showError('Error al crear cuenta');
            this.notifyAuthStateChange('SIGN_UP_ERROR', error);
            throw error;
        }
    }
    
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
            
            if (error) throw error;
            
            Utils.showSuccess('✅ Email de recuperación enviado');
            return true;
            
        } catch (error) {
            console.error('Error resetting password:', error);
            Utils.showError('Error al enviar email de recuperación');
            throw error;
        }
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Sistema de listeners para cambios de autenticación
    addAuthStateListener(callback) {
        this.authStateListeners.add(callback);
    }
    
    removeAuthStateListener(callback) {
        this.authStateListeners.delete(callback);
    }
    
    notifyAuthStateChange(event, data) {
        for (const listener of this.authStateListeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('Error en auth state listener:', error);
            }
        }
    }
    
    // Verificar permisos (puedes expandir esto según tus necesidades)
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // Aquí puedes implementar lógica de permisos basada en:
        // - User metadata
        // - Roles
        // - etc.
        
        return true; // Por defecto, todos los usuarios autenticados tienen permiso
    }
}

// Singleton instance
let authManagerInstance = null;

export async function getAuthManager() {
    if (!authManagerInstance) {
        authManagerInstance = new AuthManager();
        await authManagerInstance.initialize();
    }
    return authManagerInstance;
}

// Funciones de compatibilidad
export const AuthManagerFunctions = {
    async signIn(email, password) {
        const manager = await getAuthManager();
        return manager.signIn(email, password);
    },
    
    async signOut() {
        const manager = await getAuthManager();
        return manager.signOut();
    },
    
    async signUp(email, password, userData) {
        const manager = await getAuthManager();
        return manager.signUp(email, password, userData);
    },
    
    async resetPassword(email) {
        const manager = await getAuthManager();
        return manager.resetPassword(email);
    },
    
    getCurrentUser() {
        return authManagerInstance ? authManagerInstance.getCurrentUser() : null;
    },
    
    isAuthenticated() {
        return authManagerInstance ? authManagerInstance.isAuthenticated() : false;
    },
    
    hasPermission(permission) {
        return authManagerInstance ? authManagerInstance.hasPermission(permission) : false;
    },
    
    addAuthStateListener(callback) {
        if (authManagerInstance) {
            authManagerInstance.addAuthStateListener(callback);
        }
    },
    
    removeAuthStateListener(callback) {
        if (authManagerInstance) {
            authManagerInstance.removeAuthStateListener(callback);
        }
    }
};

// Hacer disponible globalmente
window.AuthManager = AuthManagerFunctions;

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await getAuthManager();
        console.log('✅ AuthManager inicializado');
    } catch (error) {
        console.error('Error inicializando AuthManager:', error);
    }
});

// Exportar para módulos
export { AuthManager };
