// Authentication utilities for managing tokens and user data

export interface AuthUser {
	id: number;
	email: string;
	role: 'admin' | 'user';
	name?: string;
}

/**
 * Store authentication data in both localStorage and cookies
 * Cookies are used for middleware, localStorage for client-side access
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setAuthData = (token: string, role: 'admin' | 'user', userData?: any) => {
	// Store in localStorage for client-side access
	localStorage.setItem('authToken', token);
	localStorage.setItem('userRole', role);
	
	if (userData) {
		const storageKey = role === 'admin' ? 'adminData' : 'userData';
		localStorage.setItem(storageKey, JSON.stringify(userData));
	}

	// Store in cookies for middleware access
	document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
	document.cookie = `userRole=${role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('authToken');
};

/**
 * Get user role from localStorage
 */
export const getUserRole = (): 'admin' | 'user' | null => {
	if (typeof window === 'undefined') return null;
	const role = localStorage.getItem('userRole');
	return role as 'admin' | 'user' | null;
};

/**
 * Get user data from localStorage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUserData = (): any | null => {
	if (typeof window === 'undefined') return null;
	
	const role = getUserRole();
	if (!role) return null;

	const storageKey = role === 'admin' ? 'adminData' : 'userData';
	const data = localStorage.getItem(storageKey);
	
	return data ? JSON.parse(data) : null;
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
	// Clear localStorage
	localStorage.removeItem('authToken');
	localStorage.removeItem('userRole');
	localStorage.removeItem('adminData');
	localStorage.removeItem('userData');

	// Clear cookies
	document.cookie = 'authToken=; path=/; max-age=0';
	document.cookie = 'userRole=; path=/; max-age=0';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
	return !!getAuthToken();
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
	return getUserRole() === 'admin';
};

/**
 * Check if user is regular user
 */
export const isUser = (): boolean => {
	return getUserRole() === 'user';
};
