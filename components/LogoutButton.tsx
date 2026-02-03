'use client';

import { useRouter } from 'next/navigation';
import { clearAuthData, getUserRole } from '@/utils/auth';
import { OpenAPI } from '@/src/api';

export default function LogoutButton({ className = '' }: { className?: string }) {
	const router = useRouter();

	const handleLogout = () => {
		// Get role before clearing data
		const role = getUserRole();
		
		// Clear auth data from localStorage and cookies
		clearAuthData();
		
		// Clear API token
		OpenAPI.TOKEN = undefined;
		
		// Redirect to appropriate login page
		if (role === 'admin') {
			router.push('/admin/login');
		} else {
			router.push('/public/login');
		}
	};

	return (
		<button
			onClick={handleLogout}
			className={`w-full px-4 py-2 border-2 border-blue-500 text-blue-500 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors ${className}`}
			data-logout-trigger
		>
			Logout
		</button>
	);
}
