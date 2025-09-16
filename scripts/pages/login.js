// scripts/pages/login.js
import { authManager, AuthGuard } from '../core/auth.js';
import { Utils } from '../core/utils.js';

class LoginPage {
    constructor() {
        this.init();
    }

    async init() {
        // Verificar si ya está autenticado (redirigirá automáticamente si lo está)
        const shouldContinue = await AuthGuard.protect(false);
        if (!shouldContinue) return;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Formulario de restablecimiento
        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }
        
        // Alternar entre formularios
        const showReset = document.getElementById('showReset');
        const showLoginFromReset = document.getElementById('showLoginFromReset');
        
        if (showReset) {
            showReset.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms();
            });
        }
        
        if (showLoginFromReset) {
            showLoginFromReset.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms();
            });
        }
        
        // Mostrar/ocultar contraseña
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
    }

    toggleForms() {
        const loginForm = document.getElementById('loginForm');
        const resetForm = document.getElementById('resetForm');
        
        if (loginForm.classList.contains('hidden')) {
            loginForm.classList.remove('hidden');
            resetForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            resetForm.classList.remove('hidden');
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePassword').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Validar email
        if (!Utils.validateEmail(email)) {
            Utils.showNotification('Por favor, ingresa un email válido', 'error');
            return;
        }
        
        // Validar que la contraseña no esté vacía
        if (!password) {
            Utils.showNotification('Por favor, ingresa tu contraseña', 'error');
            return;
        }
        
        // Cambiar texto del botón
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        loginBtn.disabled = true;
        
        try {
            const { success, error } = await authManager.signIn(email, password);
            
            if (success) {
                Utils.showNotification('Inicio de sesión exitoso', 'success');
                // La redirección se maneja dentro de authManager.signIn()
            } else {
                Utils.showNotification(error || 'Error al iniciar sesión', 'error');
                // Restaurar texto del botón en caso de error
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        } catch (error) {
            Utils.showNotification('Error al iniciar sesión: ' + error.message, 'error');
            // Restaurar texto del botón en caso de error
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    async handleResetPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        const resetBtn = document.getElementById('resetBtn');
        
        // Validar email
        if (!Utils.validateEmail(email)) {
            Utils.showNotification('Por favor, ingresa un email válido', 'error');
            return;
        }
        
        // Cambiar texto del botón
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        resetBtn.disabled = true;
        
        try {
            const { success, error } = await authManager.resetPassword(email);
            
            if (success) {
                Utils.showNotification('Se ha enviado un enlace de recuperación a tu email', 'success');
                // Volver al formulario de login después de un breve delay
                setTimeout(() => {
                    this.toggleForms();
                }, 2000);
            } else {
                Utils.showNotification(error || 'Error al enviar el email de recuperación', 'error');
            }
        } catch (error) {
            Utils.showNotification('Error al enviar el email de recuperación: ' + error.message, 'error');
        } finally {
            // Restaurar texto del botón
            resetBtn.innerHTML = originalText;
            resetBtn.disabled = false;
        }
    }
}

// Inicializar la página de login cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
