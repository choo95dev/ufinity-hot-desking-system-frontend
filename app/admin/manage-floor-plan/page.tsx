'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FloorPlansService, OpenAPI, FloorPlan } from '@/src/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/utils/auth';

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
		<div className="min-h-screen bg-gray-100">
			<nav className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-2xl font-bold text-gray-900">Floor Plan</h1>
						</div>
						<div className="flex items-center">
							<button
								onClick={() => router.push('/admin/manage-seat')}
								className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
							>
								Manage Seats
							</button>
						</div>
					</div>
				</div>
			</nav>

			<div className="max-w-7xl mx-auto p-6">
				<div className="bg-white shadow rounded-lg overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900">{floorPlan.name}</h2>
						{floorPlan.building && (
							<p className="text-sm text-gray-500 mt-1">
								{floorPlan.building} {floorPlan.floor && `- ${floorPlan.floor}`}
							</p>
						)}
					</div>
					<div className="p-6">
						{floorPlan.image_url && (
							<div className="flex justify-center relative" style={{ minHeight: '400px' }}>
								<Image
									src={floorPlan.image_url}
									alt={floorPlan.name || 'Floor plan'}
									width={floorPlan.image_width || 1200}
									height={floorPlan.image_height || 800}
									className="rounded-lg"
									style={{
										maxHeight: '600px',
										objectFit: 'contain',
										width: 'auto',
										height: 'auto',
									}}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
