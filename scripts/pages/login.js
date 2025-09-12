// scripts/pages/login.js
import { AuthManager } from '../core/auth.js';
import { Utils } from '../core/utils.js';

class LoginPage {
    constructor() {
        this.isInitialized = false;
        this.form = null;
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
        this.form = document.getElementById('loginForm');
        if (!this.form) return;
        
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Mostrar/ocultar contraseña
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Validaciones
        if (!this.validateForm(email, password)) {
            return;
        }
        
        try {
            this.setFormLoading(true);
            
            const success = await AuthManager.signIn(email, password);
            
            if (success) {
                Utils.showSuccess('✅ Inicio de sesión exitoso');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                this.setFormLoading(false);
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.setFormLoading(false);
        }
    }

    validateForm(email, password) {
        let isValid = true;
        
        // Resetear errores
        this.clearErrors();
        
        // Validar email
        if (!email || !Utils.validateEmail(email)) {
            this.showError('email', 'Por favor ingresa un email válido');
            isValid = false;
        }
        
        // Validar contraseña
        if (!password || password.length < 6) {
            this.showError('password', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }
        
        return isValid;
    }

    showError(fieldName, message) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        // Crear elemento de error
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.className = 'error-message text-red-500 text-sm mt-1';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.classList.add('border-red-500');
    }

    clearErrors() {
        const errorElements = this.form.querySelectorAll('.error-message');
        errorElements.forEach(element => element.remove());
        
        const fields = this.form.querySelectorAll('input');
        fields.forEach(field => field.classList.remove('border-red-500'));
    }

    setFormLoading(loading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        const spinner = submitButton.querySelector('.login-spinner');
        
        if (loading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin login-spinner"></i> Iniciando sesión...';
            submitButton.classList.add('opacity-75');
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Iniciar Sesión';
            submitButton.classList.remove('opacity-75');
        }
    }

    togglePasswordVisibility() {
        const passwordInput = this.form.querySelector('[name="password"]');
        const toggleButton = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordInput.type = 'password';
            toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const loginPage = new LoginPage();
    await loginPage.initialize();
});
