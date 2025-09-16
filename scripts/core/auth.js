// scripts/core/auth.js
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
      
      if (error) throw error;

      if (session?.user) {
        this.currentUser = session.user;
        this._setAuthState('authenticated');
        console.log('✅ Usuario autenticado:', this.currentUser.email);
      } else {
        this._setAuthState('unauthenticated');
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
      throw error;
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
          // Guardar la URL actual para redirigir después del login
          sessionStorage.setItem('redirectAfterLogin', window.location.href);
          window.location.href = redirectUrl;
          return false;
      }
      return true;
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


export class AuthGuard {
    static async protect(required = true) {
        try {
            await authManager.initialize();
            
            if (required && !authManager.isAuthenticated()) {
                console.warn('🔐 Acceso no autorizado - Redirigiendo a login');
                this.redirectToLogin();
                return false;
            }
            
            if (!required && authManager.isAuthenticated()) {
                console.log('🔐 Usuario ya autenticado - Redirigiendo a admin');
                window.location.href = 'admin.html';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error en AuthGuard:', error);
            if (required) {
                this.redirectToLogin();
            }
            return false;
        }
    }

    static redirectToLogin() {
        // Guardar la URL actual para redirigir después del login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
    }

    static async checkRole(requiredRole) {
        const user = authManager.getCurrentUser();
        if (!user) return false;
        
        // Aquí puedes implementar lógica de roles si es necesario
        return true; // Por ahora todos los usuarios autenticados tienen acceso
    }
}

// Protección automática para páginas admin
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const isAuthenticated = await AuthGuard.protect(true);
        if (!isAuthenticated) {
            // Detener cualquier ejecución adicional
            document.body.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-100">
                    <div class="text-center">
                        <div class="loading-spinner w-12 h-12 mx-auto mb-4"></div>
                        <p class="text-gray-600">Redirigiendo al login...</p>
                    </div>
                </div>
            `;
        }
    });
}

// Redirección para página de login si ya está autenticado
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const shouldRedirect = await AuthGuard.protect(false);
        if (shouldRedirect === false) {
            // Ya está autenticado, redirigir a admin
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'admin.html';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        }
    });
}
// Singleton instance
export const authManager = new AuthManager();

// Inicialización automática
authManager.initialize().catch(console.error);
