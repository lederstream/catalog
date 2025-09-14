// scripts/pages/login.js
import { AuthManagerFunctions } from '../core/auth.js';
import { Utils } from '../core/utils.js';

class LoginPage {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Verificar si ya está autenticado
            const isAuthenticated = await AuthManagerFunctions.isAuthenticated();
            if (isAuthenticated) {
                window.location.href = 'admin.html';
                return;
            }
            
            this.setupEventListeners();
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error inicializando página de login:', error);
            Utils.showError('Error al cargar la página de login');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!this.validateLoginForm(email, password)) return;
        
        try {
            this.setFormLoading(true);
            
            const success = await AuthManagerFunctions.signIn(email, password);
            if (success) {
                Utils.showSuccess('✅ Inicio de sesión exitoso');
                setTimeout(() => window.location.href = 'admin.html', 1000);
            } else {
                this.setFormLoading(false);
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.setFormLoading(false);
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;
        this.clearFormErrors();
        
        if (!email) {
            this.showError('email', 'El email es requerido');
            isValid = false;
        } else if (!Utils.validateEmail(email)) {
            this.showError('email', 'Por favor ingresa un email válido');
            isValid = false;
        }
        
        if (!password) {
            this.showError('password', 'La contraseña es requerida');
            isValid = false;
        }
        
        return isValid;
    }

    showError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.className = 'error-message text-red-500 text-xs mt-1';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        field.classList.add('border-red-500');
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => element.remove());
        
        const fields = document.querySelectorAll('input');
        fields.forEach(field => field.classList.remove('border-red-500'));
    }

    setFormLoading(loading) {
        const submitButton = document.querySelector('#loginForm button[type="submit"]');
        if (!submitButton) return;
        
        if (loading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Iniciar Sesión';
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    const loginPage = new LoginPage();
    await loginPage.initialize();
});
