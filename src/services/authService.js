const API_BASE = 'http://localhost:3000/api';

export const AuthService = {
    // Register a new user
    async register(username, email, password) {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Store token
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        return data;
    },

    // Login user
    async login(username, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        return data;
    },

    // Verify token
    async verifyToken() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                localStorage.removeItem('token');
                return null;
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            localStorage.removeItem('token');
            return null;
        }
    },

    // Get current user profile
    async getProfile() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        return data.user;
    },

    // Logout
    logout() {
        localStorage.removeItem('token');
    },

    // Get token
    getToken() {
        return localStorage.getItem('token');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};
