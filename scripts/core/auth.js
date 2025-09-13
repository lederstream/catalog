// scripts/core/auth.js
import { supabase } from '../supabase.js';
import { Utils } from './utils.js';

// Gestor de autenticación
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
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
            
        } catch (error) {
            console.error('Error inicializando auth:', error);
            throw error;
        }
    }
    
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            this.currentUser = data.user;
            return { success: true, data };
            
        } catch (error) {
            console.error('Error signing in:', error);
            return { 
                success: false, 
                error: this.getFriendlyError(error) 
            };
        }
    }
    
    getFriendlyError(error) {
        if (error.message.includes('Invalid login credentials')) {
            return 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
            return 'Por favor confirma tu email antes de iniciar sesión';
        } else if (error.message.includes('User not found')) {
            return 'No existe una cuenta con este email';
        } else {
            return 'Error al iniciar sesión. Inténtalo de nuevo.';
        }
    }
    
    async getCurrentUser() {
        try {
            if (this.currentUser) return this.currentUser;
            
            const { data: { session } } = await supabase.auth.getSession();
            return session?.user || null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            return true;
            
        } catch (error) {
            console.error('Error signing out:', error);
            return false;
        }
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
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
    
    getCurrentUser() {
        return authManagerInstance ? authManagerInstance.getCurrentUser() : null;
    },
    
    isAuthenticated() {
        return authManagerInstance ? authManagerInstance.isAuthenticated() : false;
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
