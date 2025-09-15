// scripts/core/app.js
import { AuthManager } from './auth.js';

// Inicialización de la aplicación
export class App {
    static init() {
        console.log('Aplicación Cinebestial inicializada');
        
        // Verificar autenticación en páginas que lo requieran
        if (window.location.pathname.includes('admin.html')) {
            AuthManager.requireAuth();
        }
        
        // Inicializar componentes comunes
        this.initCommonComponents();
    }

    static initCommonComponents() {
        // Inicializar tooltips
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip);
            element.addEventListener('mouseleave', this.hideTooltip);
        });
    }

    static showTooltip(e) {
        const tooltipText = this.getAttribute('data-tooltip');
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap';
        tooltip.textContent = tooltipText;
        tooltip.style.top = `${e.clientY - 30}px`;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.id = 'current-tooltip';
        
        document.body.appendChild(tooltip);
    }

    static hideTooltip() {
        const tooltip = document.getElementById('current-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
