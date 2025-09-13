// scripts/pages/login.js
import { AuthManager } from '../core/auth.js';
import { Utils } from '../core/utils.js';

class LoginPage {
    constructor() {
        this.isInitialized = false;
        this.loginForm = null;
        this.resetForm = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Verificar si ya está autenticado
            const isAuthenticated = await this.checkAuthentication();
            if (isAuthenticated) {
                window.location.href = 'admin.html';
                return;
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Página de login inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando página de login:', error);
            Utils.showError('Error al cargar la página de login');
        }
    }

    async checkAuthentication() {
        try {
            const currentUser = await AuthManager.getCurrentUser();
            return currentUser !== null;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    setupEventListeners() {
        this.loginForm = document.getElementById('loginForm');
        this.resetForm = document.getElementById('resetForm');
        
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            
            // Mostrar/ocultar contraseña
            const togglePassword = document.getElementById('togglePassword');
            if (togglePassword) {
                togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
            }
        }
        
        if (this.resetForm) {
            this.resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }
        
        // Manejar navegación entre formularios
        const showResetLink = document.getElementById('showReset');
        const showLoginLink = document.getElementById('showLoginFromReset');
        
        if (showResetLink) {
            showResetLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResetForm();
            });
        }
        
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Validaciones
        if (!this.validateLoginForm(email, password)) {
            return;
        }
        
        try {
            this.setFormLoading(this.loginForm, true);
            
            const success = await AuthManager.signIn(email, password);
            
            if (success) {
                Utils.showSuccess('✅ Inicio de sesión exitoso');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                this.setFormLoading(this.loginForm, false);
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.setFormLoading(this.loginForm, false);
        }
    }
    
    async handleResetPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(this.resetForm);
        const email = formData.get('resetEmail');
        
        // Validaciones
        if (!this.validateResetForm(email)) {
            return;
        }
        
        try {
            this.setFormLoading(this.resetForm, true);
            
            await AuthManager.resetPassword(email);
            
            this.setFormLoading(this.resetForm, false);
            this.showLoginForm();
            
        } catch (error) {
            console.error('Error en reset password:', error);
            this.setFormLoading(this.resetForm, false);
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;
        
        // Resetear errores
        this.clearFormErrors(this.loginForm);
        
        // Validar email
        if (!email) {
            this.showError(this.loginForm, 'email', 'El email es requerido');
            isValid = false;
        } else if (!Utils.validateEmail(email)) {
            this.showError(this.loginForm, 'email', 'Por favor ingresa un email válido');
            isValid = false;
        }
        
        // Validar contraseña
        if (!password) {
            this.showError(this.loginForm, 'password', 'La contraseña es requerida');
            isValid = false;
        } else if (password.length < 6) {
            this.showError(this.loginForm, 'password', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateResetForm(email) {
        let isValid = true;
        
        // Resetear errores
        this.clearFormErrors(this.resetForm);
        
        // Validar email
        if (!email) {
            this.showError(this.resetForm, 'resetEmail', 'El email es requerido');
            isValid = false;
        } else if (!Utils.validateEmail(email)) {
            this.showError(this.resetForm, 'resetEmail', 'Por favor ingresa un email válido');
            isValid = false;
        }
        
        return isValid;
    }

    showError(form, fieldName, message) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        // Crear elemento de error
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.classList.add('border-red-500', 'focus:ring-red-500');
    }

    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(element => element.remove());
        
        const fields = form.querySelectorAll('input');
        fields.forEach(field => {
            field.classList.remove('border-red-500', 'focus:ring-red-500');
            field.classList.add('focus:ring-blue-500');
        });
    }

    setFormLoading(form, loading) {
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (loading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
            submitButton.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            submitButton.disabled = false;
            
            if (form.id === 'loginForm') {
                submitButton.innerHTML = 'Iniciar Sesión';
            } else {
                submitButton.innerHTML = 'Enviar Enlace de Recuperación';
            }
            
            submitButton.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }

    togglePasswordVisibility() {
        const passwordInput = this.loginForm.querySelector('[name="password"]');
        const toggleButton = document.getElementById('togglePassword');
        const icon = toggleButton.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
    
    showResetForm() {
        this.loginForm.classList.add('hidden');
        this.resetForm.classList.remove('hidden');
        this.clearFormErrors(this.loginForm);
    }
    
    showLoginForm() {
        this.resetForm.classList.add('hidden');
        this.loginForm.classList.remove('hidden');
        this.clearFormErrors(this.resetForm);
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const loginPage = new LoginPage();
    await loginPage.initialize();
});

export { LoginPage };
