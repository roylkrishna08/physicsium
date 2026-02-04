import { defineStore } from 'pinia';
import axios from 'axios';

// Create an axios instance with base URL
const api = axios.create({
    baseURL: '/api', // This assumes a proxy is set up in vite.config.js or the full URL is used
});

// Set default baseURL if not using proxy
// api.defaults.baseURL = 'http://localhost:5000/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user && (state.user.role === 'owner' || state.user.role === 'manager'),
        isOwner: (state) => state.user && state.user.role === 'owner',
    },

    actions: {
        async register(userData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post('/auth/register', userData);
                this.setAuth(response.data);
                return response.data;
            } catch (err) {
                this.error = err.response?.data?.error || 'Registration failed';
                throw this.error;
            } finally {
                this.loading = false;
            }
        },

        async login(credentials) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post('/auth/login', credentials);
                this.setAuth(response.data);
                return response.data;
            } catch (err) {
                this.error = err.response?.data?.error || 'Login failed';
                throw this.error;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        },

        setAuth(data) {
            this.user = data.user;
            this.token = data.token;
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        },

        async updateProfile(profileData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.put('/users/updatedetails', profileData);
                this.user = response.data.data;
                localStorage.setItem('user', JSON.stringify(response.data.data));
                return response.data;
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to update profile';
                throw this.error;
            } finally {
                this.loading = false;
            }
        },

        async changePassword(passwordData) {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.put('/users/updatepassword', passwordData);
                // Token is refreshed after password change
                if (response.data.token) {
                    this.token = response.data.token;
                    localStorage.setItem('token', response.data.token);
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                }
                return response.data;
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to change password';
                throw this.error;
            } finally {
                this.loading = false;
            }
        },

        async uploadProfilePicture(file) {
            this.loading = true;
            this.error = null;
            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await api.put('/users/profilepicture', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                this.user = response.data.data;
                localStorage.setItem('user', JSON.stringify(response.data.data));
                return response.data;
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to upload profile picture';
                throw this.error;
            } finally {
                this.loading = false;
            }
        },

        async deleteAccount(password) {
            this.loading = true;
            this.error = null;
            try {
                await api.delete('/users/account', { data: { password } });
                this.logout();
                return true;
            } catch (err) {
                this.error = err.response?.data?.error || 'Failed to delete account';
                throw this.error;
            } finally {
                this.loading = false;
            }
        },

        // Initialize auth state (e.g., set token in axios if it exists in localStorage)
        init() {
            if (this.token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            }
        }
    },
});

export { api };
