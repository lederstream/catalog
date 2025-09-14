// scripts/core/auth.js
import { supabase } from '../supabase.js'
import { Utils } from './utils.js'

export class AuthManager {
    static async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })

            if (error) throw error

            // Guardar sesión
            localStorage.setItem('user', JSON.stringify(data.user))
            return { success: true, user: data.user }
        } catch (error) {
            console.error('Error al iniciar sesión:', error.message)
            return { success: false, error: error.message }
        }
    }

    static async logout() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            
            // Eliminar datos de sesión
            localStorage.removeItem('user')
            return { success: true }
        } catch (error) {
            console.error('Error al cerrar sesión:', error.message)
            return { success: false, error: error.message }
        }
    }

    static async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`,
            })

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Error al solicitar restablecimiento:', error.message)
            return { success: false, error: error.message }
        }
    }

    static getCurrentUser() {
        const userData = localStorage.getItem('user')
        return userData ? JSON.parse(userData) : null
    }

    static isAuthenticated() {
        return this.getCurrentUser() !== null
    }

    static requireAuth(redirectTo = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo
        }
    }
}
