'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FloorPlansService, OpenAPI, FloorPlan } from '@/src/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/utils/auth';
import AdminSideNav from '@/components/AdminSideNav';

export default function ManageFloorPlanPage() {
	const router = useRouter();
	const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchFloorPlan = async () => {
		setIsLoading(true);
		try {
			// Configure API base URL
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
			
			// Set token from auth utility
			const token = getAuthToken();
			if (token) {
				OpenAPI.TOKEN = token;
			}

			const response = await FloorPlansService.getApiFloorPlans(1, 1);
			const plans = response.data?.items || [];
			if (plans.length > 0) {
				setFloorPlan(plans[0]);
			}
		} catch (err) {
			toast.error('Failed to load floor plan');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchFloorPlan();
	}, []);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					<p className="mt-4 text-gray-600">Loading floor plan...</p>
				</div>
			</div>
		);
	}

	if (!floorPlan) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="bg-white shadow rounded-lg p-6 max-w-md">
					<p className="text-gray-600 text-center">No floor plan found. Please create one first.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<AdminSideNav />
			<div className="flex-1 ml-64 transition-all duration-300">
				<div className="p-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Floor Plans</h1>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Hardcoded to show only first result */}
					<div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
						<div className="p-4">
							<h2 className="text-lg font-semibold text-gray-900 mb-2">{floorPlan.name}</h2>
							{floorPlan.building && (
								<p className="text-sm text-gray-500 mb-4">
									{floorPlan.building} {floorPlan.floor && `- ${floorPlan.floor}`}
								</p>
							)}
							{floorPlan.image_url && (
								<div className="relative mb-4" style={{ height: '200px' }}>
									<Image
										src={floorPlan.image_url}
										alt={floorPlan.name || 'Floor plan'}
										fill
										className="rounded-lg object-cover"
									/>
								</div>
							)}
							<button
								onClick={() => router.push(`/admin/manage-seat?floorPlanId=${floorPlan.id}`)}
								className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
								data-testid={`manage-seat-button-${floorPlan.id}`}
							>
								Manage Seats
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		</div>
	);
}
