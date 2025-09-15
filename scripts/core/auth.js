// scripts/core/auth.js
import { supabase } from '../supabase.js';
import { Utils } from './utils.js';

export class AuthManager {
    constructor() {
        this.user = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing AuthManager...');
            
            // Get current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error getting session:', error);
                return { success: false, error: error.message };
            }
            
            if (session) {
                this.user = session.user;
                console.log('✅ User authenticated:', this.user.email);
            } else {
                console.log('🔐 No active session');
            }
            
            // Listen for auth changes
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔐 Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    this.user = session.user;
                    console.log('✅ User signed in:', this.user.email);
                } else if (event === 'SIGNED_OUT') {
                    this.user = null;
                    console.log('🔐 User signed out');
                }
                
                // Notify other components
                this.notifyAuthChange(event, this.user);
            });
            
            this.isInitialized = true;
            console.log('✅ AuthManager initialized successfully');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error initializing AuthManager:', error);
            return { success: false, error: error.message };
        }
    }

    notifyAuthChange(event, user) {
        // Dispatch custom event
        const authChangeEvent = new CustomEvent('authStateChanged', {
            detail: { event, user }
        });
        window.dispatchEvent(authChangeEvent);
    }

    requireAuth() {
        if (!this.user) {
            console.warn('Authentication required');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.user = data.user;
            return { success: true, user: this.user };
            
        } catch (error) {
            console.error('Login error:', error.message);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.user = null;
            return { success: true };
            
        } catch (error) {
            console.error('Logout error:', error.message);
            return { success: false, error: error.message };
        }
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

// Global instance
export const authManager = new AuthManager();
