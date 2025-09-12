// scripts/core/auth.js
import { supabase } from './supabase.js';
import { Utils } from './utils.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }
    
    static async init() {
        const instance = new AuthManager();
        await instance.initialize();
        return instance;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Verificar sesión existente
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Usuario autenticado:', this.currentUser.email);
            }
            
            this.isInitialized = true;
            
            // Escuchar cambios de autenticación
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    Utils.showSuccess('✅ Sesión iniciada');
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    Utils.showInfo('👋 Sesión cerrada');
                }
            });
            
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
            
            if (error) throw error;
            
            this.currentUser = data.user;
            return true;
            
        } catch (error) {
            console.error('Error signing in:', error);
            Utils.showError('Error al iniciar sesión: ' + error.message);
            return false;
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
            Utils.showError('Error al cerrar sesión');
            return false;
        }
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Singleton instance
let authManagerInstance = null;

export async function getAuthManager() {
    if (!authManagerInstance) {
        authManagerInstance = await AuthManager.init();
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
    } catch (error) {
        console.error('Error inicializando AuthManager:', error);
    }
});

// Exportar para módulos
export { AuthManagerFunctions as AuthManager };
