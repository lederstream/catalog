// scripts/core/auth.js
import { supabase } from '../supabase.js';
import { Utils } from './utils.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.authStateListeners = new Set();
    this.initializationPromise = null;
    this.authState = 'UNKNOWN';
  }
  
  async initialize() {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;
    
    this.initializationPromise = (async () => {
      try {
        console.log('🔄 Inicializando AuthManager...');
        this.authState = 'INITIALIZING';
        
        // Verificar sesión con timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getting session')), 5000))
        ]);
        
        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          this.authState = 'ERROR';
          throw error;
        }
        
        if (session?.user) {
          this.currentUser = session.user;
          this.authState = 'AUTHENTICATED';
          console.log('✅ Sesión activa encontrada:', this.currentUser.email);
          this.notifyAuthStateChange('SIGNED_IN', session.user);
        } else {
          this.authState = 'UNAUTHENTICATED';
          console.log('ℹ️ No hay sesión activa');
        }
        
        // Escuchar cambios de autenticación
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔐 Auth state changed:', event);
          
          switch (event) {
            case 'SIGNED_IN':
              if (session) {
                this.currentUser = session.user;
                this.authState = 'AUTHENTICATED';
                this.notifyAuthStateChange('SIGNED_IN', session.user);
                Utils.showSuccess('✅ Sesión iniciada correctamente');
              }
              break;
              
            case 'SIGNED_OUT':
              this.currentUser = null;
              this.authState = 'UNAUTHENTICATED';
              this.notifyAuthStateChange('SIGNED_OUT', null);
              Utils.showInfo('👋 Sesión cerrada');
              break;
              
            case 'TOKEN_REFRESHED':
              this.notifyAuthStateChange('TOKEN_REFRESHED', this.currentUser);
              break;
              
            case 'USER_UPDATED':
              if (session) this.currentUser = session.user;
              this.notifyAuthStateChange('USER_UPDATED', this.currentUser);
              break;
              
            case 'INITIAL_SESSION':
              if (session) {
                this.currentUser = session.user;
                this.authState = 'AUTHENTICATED';
                console.log('✅ Sesión inicial restaurada:', this.currentUser.email);
                this.notifyAuthStateChange('INITIAL_SESSION', session.user);
              } else {
                this.authState = 'UNAUTHENTICATED';
                console.log('ℹ️ Sesión inicial: no autenticado');
              }
              break;
          }
        });
        
        this.isInitialized = true;
        console.log('✅ AuthManager inicializado correctamente');
        return true;
        
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        this.isInitialized = false;
        this.authState = 'ERROR';
        throw error;
      }
    })();
    
    return this.initializationPromise;
  }
  
  async signIn(email, password) {
    try {
      this.notifyAuthStateChange('SIGNING_IN', null);
      
      if (!email || !password) throw new Error('Email y contraseña son requeridos');
      if (!Utils.validateEmail(email)) throw new Error('El formato del email no es válido');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        this.notifyAuthStateChange('SIGN_IN_ERROR', error);
        throw error;
      }
      
      if (data?.user) {
        this.currentUser = data.user;
        this.authState = 'AUTHENTICATED';
        this.notifyAuthStateChange('SIGNED_IN', data.user);
        
        localStorage.setItem('lastAuthEmail', email);
        localStorage.setItem('authState', 'AUTHENTICATED');
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error signing in:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      if (error.message.includes('Invalid login credentials')) errorMessage = 'Email o contraseña incorrectos';
      else if (error.message.includes('Email not confirmed')) errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
      
      Utils.showError(errorMessage);
      this.notifyAuthStateChange('SIGN_IN_ERROR', error);
      return false;
    }
  }
  
  async signOut() {
    try {
      this.notifyAuthStateChange('SIGNING_OUT', null);
      
      localStorage.removeItem('lastAuthEmail');
      localStorage.removeItem('authState');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      this.currentUser = null;
      this.authState = 'UNAUTHENTICATED';
      this.notifyAuthStateChange('SIGNED_OUT', null);
      return true;
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      Utils.showError('Error al cerrar sesión');
      this.notifyAuthStateChange('SIGN_OUT_ERROR', error);
      return false;
    }
  }
  
  getCurrentUser() { return this.currentUser; }
  isAuthenticated() { return this.authState === 'AUTHENTICATED' && this.currentUser !== null; }
  getAuthState() { return this.authState; }
  
  addAuthStateListener(callback) { this.authStateListeners.add(callback); }
  removeAuthStateListener(callback) { this.authStateListeners.delete(callback); }
  
  notifyAuthStateChange(event, data) {
    for (const listener of this.authStateListeners) {
      try { listener(event, data); } catch (error) { console.error('Error en auth state listener:', error); }
    }
  }
  
  hasPermission(permission) { return this.isAuthenticated(); }
}

// Singleton instance
let authManagerInstance = null;

export async function getAuthManager() {
  if (!authManagerInstance) authManagerInstance = new AuthManager();
  if (!authManagerInstance.isInitialized) await authManagerInstance.initialize();
  return authManagerInstance;
}

// Funciones de compatibilidad
export const AuthManagerFunctions = {
  async signIn(email, password) {
    try {
      const manager = await getAuthManager();
      return await manager.signIn(email, password);
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  },
  
  async signOut() {
    try {
      const manager = await getAuthManager();
      return await manager.signOut();
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  },
  
  async getCurrentUser() {
    try {
      if (!authManagerInstance) await getAuthManager();
      return authManagerInstance ? authManagerInstance.getCurrentUser() : null;
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
      return null;
    }
  },
  
  async isAuthenticated() {
    try {
      if (!authManagerInstance) await getAuthManager();
      return authManagerInstance ? authManagerInstance.isAuthenticated() : false;
    } catch (error) {
      console.error('Error en isAuthenticated:', error);
      return false;
    }
  },
  
  async getAuthState() {
    try {
      if (!authManagerInstance) await getAuthManager();
      return authManagerInstance ? authManagerInstance.getAuthState() : 'UNKNOWN';
    } catch (error) {
      console.error('Error en getAuthState:', error);
      return 'ERROR';
    }
  },
  
  hasPermission(permission) {
    return authManagerInstance ? authManagerInstance.hasPermission(permission) : false;
  },
  
  addAuthStateListener(callback) {
    if (authManagerInstance) {
      authManagerInstance.addAuthStateListener(callback);
    } else {
      setTimeout(() => {
        if (authManagerInstance) authManagerInstance.addAuthStateListener(callback);
      }, 100);
    }
  },
  
  removeAuthStateListener(callback) {
    if (authManagerInstance) authManagerInstance.removeAuthStateListener(callback);
  }
};

// Global
window.AuthManager = AuthManagerFunctions;

// Inicialización automática
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const manager = await getAuthManager();
    console.log('✅ AuthManager inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando AuthManager:', error);
  }
});

export { AuthManager };
