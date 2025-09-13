// scripts/pages/login.js
import { AuthManager } from '../core/auth.js';
import { Utils } from '../core/utils.js';

// Controlador de la interfaz de usuario de login
class LoginPage {
    constructor() {
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.checkExistingSession();
    }
    
    bindEvents() {
        // Evento de envío del formulario
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Evento para mostrar/ocultar contraseña
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
        
        // Eventos de entrada para limpiar errores
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                Utils.clearErrors();
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                Utils.clearErrors();
            });
        }
    }
    
    async checkExistingSession() {
        try {
            const user = await AuthManager.getCurrentUser();
            if (user) {
                window.location.href = 'admin.html';
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }
    
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePassword')?.querySelector('i');
        
        if (passwordInput && toggleIcon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }
    }
    
    validateForm() {
        Utils.clearErrors();
        
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        let isValid = true;
        
        // Validar email
        if (!email) {
            Utils.showFieldError('email', 'El email es obligatorio');
            isValid = false;
        } else if (!Utils.validateEmail(email)) {
            Utils.showFieldError('email', 'Por favor ingresa un email válido');
            isValid = false;
        }
        
        // Validar contraseña
        if (!password) {
            Utils.showFieldError('password', 'La contraseña es obligatoria');
            isValid = false;
        } else if (password.length < 6) {
            Utils.showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }
        
        return isValid;
    }
    
    async handleLogin() {
        // Validar formulario
        if (!this.validateForm()) {
            return;
        }
        
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) return;
        
        Utils.setLoading(true);
        
        try {
            const result = await AuthManager.signIn(email, password);
            
            if (result.success) {
                Utils.showNotification('✅ Inicio de sesión exitoso', 'success');
                // Redirigir al dashboard después de login exitoso
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                Utils.showError(result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showError('Error inesperado al iniciar sesión');
        } finally {
            Utils.setLoading(false);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
