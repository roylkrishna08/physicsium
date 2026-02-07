import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: 'user' | 'manager' | 'owner';
    profilePicture: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
        token: localStorage.getItem('admin_token'),
        loading: false,
        error: null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === 'manager' || state.user?.role === 'owner',
        isOwner: (state) => state.user?.role === 'owner',
    },
    actions: {
        async login(identifier: string, password: string): Promise<boolean> {
            this.loading = true;
            this.error = null;
            try {
                const response = await axios.post(`${API_URL}/auth/login`, {
                    identifier,
                    password,
                });

                const { token, user } = response.data;

                if (user.role !== 'manager' && user.role !== 'owner') {
                    throw new Error('Access denied. Admin privileges required.');
                }

                this.user = user;
                this.token = token;

                localStorage.setItem('admin_token', token);
                localStorage.setItem('admin_user', JSON.stringify(user));

                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                return true;
            } catch (error: any) {
                this.error = error.response?.data?.message || error.message;
                return false;
            } finally {
                this.loading = false;
            }
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            delete axios.defaults.headers.common['Authorization'];
        },
        init() {
            if (this.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            }
        },
    },
});
