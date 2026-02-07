import { defineStore } from 'pinia';
import { api } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAdminStore = defineStore('admin', {
    state: () => ({
        users: [],
        simulations: [],
        units: [],
        loading: false,
        error: null,
    }),
    actions: {
        async fetchUsers() {
            this.loading = true;
            try {
                const response = await api.get(`${API_URL}/admin/users`);
                this.users = response.data.data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch users';
            } finally {
                this.loading = false;
            }
        },
        async fetchSimulations() {
            this.loading = true;
            try {
                const response = await api.get(`${API_URL}/admin/simulations`);
                this.simulations = response.data.data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch simulations';
            } finally {
                this.loading = false;
            }
        },
        async toggleUserRestriction(id, isRestricted) {
            try {
                await api.put(`${API_URL}/admin/users/${id}/restrict`, { isRestricted });
                const user = this.users.find(u => u._id === id);
                if (user) user.isRestricted = isRestricted;
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to update user';
                return false;
            }
        },
        async toggleSimulation(id) {
            try {
                const response = await api.put(`${API_URL}/admin/simulations/${id}/toggle`);
                const updatedSim = response.data.data;
                const index = this.simulations.findIndex(s => s._id === id);
                if (index !== -1) {
                    this.simulations[index] = updatedSim;
                }
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to toggle simulation';
                return false;
            }
        },
        async syncSimulations(simulations) {
            try {
                await api.post(`${API_URL}/admin/simulations/sync`, { simulations });
                await this.fetchSimulations();
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to sync simulations';
                return false;
            }
        },
        async autoDiscoverSimulations() {
            try {
                await api.post(`${API_URL}/admin/simulations/auto-discover`);
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to auto-discover simulations';
                return false;
            }
        },
        async fetchUnits() {
            this.loading = true;
            try {
                const response = await api.get(`${API_URL}/admin/units`);
                this.units = response.data.data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to fetch units';
            } finally {
                this.loading = false;
            }
        },
        async toggleUnit(id) {
            try {
                const response = await api.put(`${API_URL}/admin/units/${id}/toggle`);
                const updatedUnit = response.data.data;
                const index = this.units.findIndex(u => u._id === id);
                if (index !== -1) {
                    this.units[index] = updatedUnit;
                }
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to toggle unit';
                return false;
            }
        },
        async syncUnits(units) {
            try {
                await api.post(`${API_URL}/admin/units/sync`, { units });
                await this.fetchUnits();
                return true;
            } catch (error) {
                this.error = error.response?.data?.message || 'Failed to sync units';
                return false;
            }
        }
    },
});
