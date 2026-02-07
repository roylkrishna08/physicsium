import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    isRestricted: boolean;
    lastLogin?: string;
    loginCount?: number;
    createdAt: string;
}

interface Simulation {
    _id: string;
    simulationId: string;
    name: string;
    category: string;
    isVisible: boolean;
    updatedAt: string;
}

interface Unit {
    _id: string;
    unitId: string;
    unitNumber: string;
    title: string;
    title_hi?: string;
    category: string;
    isVisible: boolean;
    hasSimulations: boolean;
    updatedAt: string;
}

interface AdminState {
    users: User[];
    simulations: Simulation[];
    units: Unit[];
    loading: boolean;
    error: string | null;
}

export const useAdminStore = defineStore('admin', {
    state: (): AdminState => ({
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
                const response = await axios.get(`${API_URL}/admin/users`);
                this.users = response.data.data;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to fetch users';
            } finally {
                this.loading = false;
            }
        },
        async fetchSimulations() {
            this.loading = true;
            try {
                const response = await axios.get(`${API_URL}/admin/simulations`);
                this.simulations = response.data.data;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to fetch simulations';
            } finally {
                this.loading = false;
            }
        },
        async toggleUserRestriction(id: string, isRestricted: boolean) {
            try {
                await axios.put(`${API_URL}/admin/users/${id}/restrict`, { isRestricted });
                const user = this.users.find(u => u._id === id);
                if (user) user.isRestricted = isRestricted;
                return true;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to update user';
                return false;
            }
        },
        async toggleSimulation(id: string) {
            try {
                const response = await axios.put(`${API_URL}/admin/simulations/${id}/toggle`);
                const updatedSim = response.data.data;
                const index = this.simulations.findIndex(s => s._id === id);
                if (index !== -1) {
                    this.simulations[index] = updatedSim;
                }
                return true;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to toggle simulation';
                return false;
            }
        },
        async syncSimulations(simulations: Partial<Simulation>[]) {
            try {
                await axios.post(`${API_URL}/admin/simulations/sync`, { simulations });
                await this.fetchSimulations();
                return true;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to sync simulations';
                return false;
            }
        },
        async fetchUnits() {
            this.loading = true;
            try {
                const response = await axios.get(`${API_URL}/admin/units`);
                this.units = response.data.data;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to fetch units';
            } finally {
                this.loading = false;
            }
        },
        async toggleUnit(id: string) {
            try {
                const response = await axios.put(`${API_URL}/admin/units/${id}/toggle`);
                const updatedUnit = response.data.data;
                const index = this.units.findIndex(u => u._id === id);
                if (index !== -1) {
                    this.units[index] = updatedUnit;
                }
                return true;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to toggle unit';
                return false;
            }
        },
        async syncUnits(units: Partial<Unit>[]) {
            try {
                await axios.post(`${API_URL}/admin/units/sync`, { units });
                await this.fetchUnits();
                return true;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Failed to sync units';
                return false;
            }
        }
    },
});
