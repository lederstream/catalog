import { Utils } from './utils.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.authStateListeners = new Set();
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Verificar sesión existente
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }

      if (session?.user) {
        this.currentUser = session.user;
        this._setAuthState('authenticated');
        console.log('✅ Usuario autenticado:', this.currentUser.email);
      } else {
        this._setAuthState('unauthenticated');
        console.log('⚠️ Usuario no autenticado');
      }

      // Escuchar cambios de autenticación
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        switch (event) {
          case 'SIGNED_IN':
            this.currentUser = session.user;
            this._setAuthState('authenticated');
            Utils.showSuccess('Sesión iniciada correctamente');
            break;
          case 'SIGNED_OUT':
            this.currentUser = null;
            this._setAuthState('unauthenticated');
            Utils.showInfo('Sesión cerrada');
            break;
          case 'USER_UPDATED':
            this.currentUser = session.user;
            this._notifyAuthStateChange('user_updated', this.currentUser);
            break;
          case 'PASSWORD_RECOVERY':
            this._notifyAuthStateChange('password_recovery', session.user);
            break;
        }
      });

      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('❌ Error inicializando auth:', error);
      this._setAuthState('error');
      // No redirigir automáticamente, dejar que la página decida
      return false;
    }
  }

  async signIn(email, password) {
    try {
      this._notifyAuthStateChange('signing_in');
      
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;

      if (data?.user) {
        this.currentUser = data.user;
        this._setAuthState('authenticated');
        return { success: true, user: data.user };
      }

      return { success: false, error: 'No se pudo iniciar sesión' };

    } catch (error) {
      console.error('❌ Error signing in:', error);
      this._notifyAuthStateChange('sign_in_error', error);
      
      let errorMessage = 'Error al iniciar sesión';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
      }

      Utils.showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async signOut() {
    try {
      this._notifyAuthStateChange('signing_out');
      
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this._setAuthState('unauthenticated');
      return { success: true };

    } catch (error) {
      console.error('❌ Error signing out:', error);
      this._notifyAuthStateChange('sign_out_error', error);
      Utils.showError('Error al cerrar sesión');
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      this._notifyAuthStateChange('resetting_password');
      
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password.html`
      });

      if (error) throw error;

      Utils.showSuccess('Email de recuperación enviado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error resetting password:', error);
      this._notifyAuthStateChange('reset_password_error', error);
      
      let errorMessage = 'Error al enviar email de recuperación';
      if (error.message.includes('user not found')) {
        errorMessage = 'No existe una cuenta con este email';
      }

      Utils.showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }
  
  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  requireAuth(redirectUrl = 'login.html') {
    if (!this.isAuthenticated()) {
      window.location.href = redirectUrl;
    }
  }

  addAuthStateListener(callback) {
    this.authStateListeners.add(callback);
  }

  removeAuthStateListener(callback) {
    this.authStateListeners.delete(callback);
  }

  _setAuthState(state) {
    this.authState = state;
    this._notifyAuthStateChange(state, this.currentUser);
  }

  _notifyAuthStateChange(event, data) {
    for (const listener of this.authStateListeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error en auth state listener:', error);
      }
    }
  }
}

// Singleton instance
export const authManager = new AuthManager();

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
  authManager.initialize().catch(console.error);
});
