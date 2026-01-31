'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
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
		<Button
			color="danger"
			variant="flat"
			onPress={handleLogout}
			className={className}
		>
			Logout
		</Button>
	);
}
