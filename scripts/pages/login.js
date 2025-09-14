// scripts/pages/login.js
import { Utils } from '../core/utils.js';
import { AuthManagerFunctions } from '../core/auth.js';

class LoginPage {
    constructor() {
        this.isProcessing = false;
    }

    async init() {
        try {
            // Verificar si ya está autenticado
            const isAuthenticated = await AuthManagerFunctions.isAuthenticated();
            if (isAuthenticated) {
                window.location.href = 'admin.html';
                return;
            }

            this.setupEventListeners();
            this.restoreFormData();
            console.log('✅ LoginPage inicializada correctamente');
        } catch (error) {
            console.error('Error inicializando LoginPage:', error);
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const resetForm = document.getElementById('resetForm');
        const togglePassword = document.getElementById('togglePassword');
        const showReset = document.getElementById('showReset');
        const showLoginFromReset = document.getElementById('showLoginFromReset');

        // Toggle de visibilidad de contraseña
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
        }

        // Cambiar entre formularios
        if (showReset) {
            showReset.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms(true);
            });
        }

        if (showLoginFromReset) {
            showLoginFromReset.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleForms(false);
            });
        }

        // Envío del formulario de login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Envío del formulario de reset
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }

        // Escuchar cambios de autenticación
        AuthManagerFunctions.addAuthStateListener((event, user) => {
            if (event === 'SIGNED_IN') {
                window.location.href = 'admin.html';
            }
        });
    }

    toggleForms(showResetForm) {
        const loginForm = document.getElementById('loginForm');
        const resetForm = document.getElementById('resetForm');

        if (showResetForm) {
            loginForm.classList.add('hidden');
            resetForm.classList.remove('hidden');
        } else {
            resetForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    }

    async handleLogin() {
        if (this.isProcessing) return;
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validaciones
        if (!email || !password) {
            Utils.showError('Por favor completa todos los campos');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Utils.showError('Por favor ingresa un email válido');
            return;
        }

        this.isProcessing = true;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Iniciando sesión...';

        try {
            const success = await AuthManagerFunctions.signIn(email, password);
            
            if (success) {
                // Guardar email para futuros inicios de sesión
                localStorage.setItem('lastAuthEmail', email);
                Utils.showSuccess('Inicio de sesión exitoso');
                // La redirección se manejará en el auth state listener
            } else {
                Utils.showError('Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showError('Error al iniciar sesión');
        } finally {
            this.isProcessing = false;
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Iniciar Sesión';
        }
    }

    async handlePasswordReset() {
        const resetEmailInput = document.getElementById('resetEmail');
        const resetBtn = document.getElementById('resetBtn');
        
        const email = resetEmailInput.value.trim();

        if (!email) {
            Utils.showError('Por favor ingresa tu email');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Utils.showError('Por favor ingresa un email válido');
            return;
        }

        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';

        try {
            // Simular envío de email de recuperación (implementar con Supabase si es necesario)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            Utils.showSuccess(`Se ha enviado un enlace de recuperación a ${email}`);
            this.toggleForms(false);
            
        } catch (error) {
            console.error('Password reset error:', error);
            Utils.showError('Error al enviar el email de recuperación');
        } finally {
            resetBtn.disabled = false;
            resetBtn.innerHTML = 'Enviar Enlace de Recuperación';
        }
    }

    restoreFormData() {
        const lastEmail = localStorage.getItem('lastAuthEmail');
        if (lastEmail) {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.value = lastEmail;
            }
        }
    }
}

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.loginPage = new LoginPage();
    await window.loginPage.init();
});
