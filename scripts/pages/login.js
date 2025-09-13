// scripts/pages/login.js
import { AuthManager } from '../core/auth.js';
import { Utils } from '../core/utils.js';

// Controlador de la interfaz de usuario de login
class LoginPage {
    constructor() {
        this.isInitialized = false;
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
            this.showError('Error al cargar la página de login');
        }
    }

    async checkAuthentication() {
        try {
            const authManager = await AuthManager.getAuthManager();
            const currentUser = await authManager.getCurrentUser();
            return currentUser !== null;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    setupEventListeners() {
        const form = document.getElementById('loginFormElement');
        if (!form) return;
        
        form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Mostrar/ocultar contraseña
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        // Limpiar errores al escribir
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.addEventListener('input', () => Utils.clearErrors());
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => Utils.clearErrors());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validaciones
        if (!this.validateForm(email, password)) {
            return;
        }
        
        try {
            Utils.setLoading(true);
            
            const authManager = await AuthManager.getAuthManager();
            const result = await authManager.signIn(email, password);
            
            if (result.success) {
                Utils.showNotification('✅ Inicio de sesión exitoso', 'success');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                Utils.showError(result.error);
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            Utils.showError('Error inesperado al iniciar sesión');
        } finally {
            Utils.setLoading(false);
        }
    }

    validateForm(email, password) {
        Utils.clearErrors();
        
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
    
    showError(message) {
        alert(message); // Fallback simple
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const loginPage = new LoginPage();
    await loginPage.initialize();
});
