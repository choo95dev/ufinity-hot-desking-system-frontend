'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FloorPlansService, OpenAPI, FloorPlan } from '@/src/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/utils/auth';
import AdminSideNav from '@/components/AdminSideNav';

export default function ManageFloorPlanPage() {
	const router = useRouter();
	const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showUploadForm, setShowUploadForm] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadFormData, setUploadFormData] = useState({
		name: '',
		building: '',
		floor: '',
	});
	const [selectedFile, setSelectedFile] = useState<{
		url: string;
		width: number;
		height: number;
	} | null>(null);

	const fetchFloorPlan = async () => {
		setIsLoading(true);
		try {
			// Configure API base URL
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
			
			// Set token from auth utility
			const token = getAuthToken();
			if (token) {
				OpenAPI.TOKEN = token;
			}

			const response = await FloorPlansService.getApiFloorPlans(1, 1);
			const plans = response.data?.items || [];
			if (plans.length > 0) {
				setFloorPlan(plans[0]);
				setUploadFormData({
					name: plans[0].name || '',
					building: plans[0].building || '',
					floor: plans[0].floor || '',
				});
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

	const handleDeleteFloorPlan = async () => {
		if (!floorPlan?.id) return;

		setIsDeleting(true);
		try {
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
			const token = getAuthToken();
			if (token) {
				OpenAPI.TOKEN = token;
			}

			await FloorPlansService.deleteApiFloorPlans(floorPlan.id);
			toast.success('Floor plan deleted successfully');
			setShowDeleteConfirm(false);
			setFloorPlan(null);
		} catch (err) {
			toast.error('Failed to delete floor plan');
			console.error(err);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select a valid image file');
			return;
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error('File size must be less than 10MB');
			return;
		}

		// Convert file to data URL
		const reader = new FileReader();
		reader.onload = () => {
			const imageUrl = reader.result as string;
			
			// Get image dimensions
			const img = new Image();
			img.onload = () => {
				setSelectedFile({
					url: imageUrl,
					width: img.width,
					height: img.height,
				});
				toast.success('Image selected successfully');
			};
			img.src = imageUrl;
		};
		reader.readAsDataURL(file);
	};

	const handleUploadFloorPlan = async () => {
		if (!uploadFormData.name.trim()) {
			toast.error('Please enter a floor plan name');
			return;
		}

		if (!selectedFile) {
			toast.error('Please select an image file');
			return;
		}

		setIsUploading(true);
		try {
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
			const token = getAuthToken();
			if (token) {
				OpenAPI.TOKEN = token;
			}

			const imageUrl = '/floor-plans/seat-plan.png';

			if (floorPlan?.id) {
				// Update existing floor plan
				await FloorPlansService.putApiFloorPlans(floorPlan.id, {
					name: uploadFormData.name,
					building: uploadFormData.building,
					floor: uploadFormData.floor,
					image_url: imageUrl,
					image_width: selectedFile.width,
					image_height: selectedFile.height,
				});
				toast.success('Floor plan updated successfully');
			} else {
				// Create new floor plan
				const response = await FloorPlansService.postApiFloorPlans({
					name: uploadFormData.name,
					building: uploadFormData.building,
					floor: uploadFormData.floor,
					image_url: imageUrl,
					image_width: selectedFile.width,
					image_height: selectedFile.height,
				});
				if (response.data) {
					setFloorPlan(response.data);
					toast.success('Floor plan created successfully');
				}
			}

			setShowUploadForm(false);
			setSelectedFile(null);
			setUploadFormData({
				name: '',
				building: '',
				floor: '',
			});
			await fetchFloorPlan();
		} catch (err) {
			toast.error('Failed to upload floor plan');
			console.error(err);
		} finally {
			setIsUploading(false);
		}
	};

	const handleUploadButtonClick = () => {
		fileInputRef.current?.click();
	};

	const handleCloseUploadModal = () => {
		setShowUploadForm(false);
		setSelectedFile(null);
		setUploadFormData({
			name: '',
			building: '',
			floor: '',
		});
	};

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

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<AdminSideNav />
			<div className="flex-1 ml-48 transition-all duration-300">
				<div className="p-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Floor Plans</h1>
					
					{!floorPlan ? (
						<div className="bg-white shadow rounded-lg p-8 max-w-md">
							<p className="text-gray-600 text-center mb-6">No floor plan found. Create one to get started.</p>
							<button
								onClick={() => setShowUploadForm(true)}
								className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
							>
								Upload Floor Plan
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
											<img
												src={floorPlan.image_url}
												alt={floorPlan.name || 'Floor plan'}
												className="rounded-lg object-cover w-full h-full"
											/>
										</div>
									)}
									<div className="space-y-2">
										<button
											onClick={() => router.push(`/admin/manage-seat?floorPlanId=${floorPlan.id}`)}
											className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
											data-testid={`manage-seat-button-${floorPlan.id}`}
										>
											Manage Seats
										</button>
										<button
											onClick={() => {
												if (floorPlan) {
													setUploadFormData({
														name: floorPlan.name || '',
														building: floorPlan.building || '',
														floor: floorPlan.floor || '',
													});
													setSelectedFile({
														url: floorPlan.image_url || '',
														width: floorPlan.image_width || 0,
														height: floorPlan.image_height || 0,
													});
												}
												setShowUploadForm(true);
											}}
											className="w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
										>
											Edit Floor Plan
										</button>
										<button
											onClick={() => setShowDeleteConfirm(true)}
											className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
										>
											Delete Floor Plan
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Upload Form Modal */}
			{showUploadForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
						{floorPlan ? 'Edit Floor Plan' : 'Upload Floor Plan'}
					</h2>
					
					<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Floor Plan Name *
								</label>
								<input
									type="text"
									value={uploadFormData.name}
									onChange={(e) =>
										setUploadFormData({ ...uploadFormData, name: e.target.value })
									}
									placeholder="e.g., Office Floor 1"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Building
								</label>
								<input
									type="text"
									value={uploadFormData.building}
									onChange={(e) =>
										setUploadFormData({ ...uploadFormData, building: e.target.value })
									}
									placeholder="e.g., Main Building"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Floor
								</label>
								<input
									type="text"
									value={uploadFormData.floor}
									onChange={(e) =>
										setUploadFormData({ ...uploadFormData, floor: e.target.value })
									}
									placeholder="e.g., 1st Floor"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Floor Plan Image *
								</label>

								{selectedFile && selectedFile.url && (
									<div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
										<div className="flex items-start gap-3">
											<div className="flex-1">
												<img
													src={selectedFile.url}
													alt="Selected floor plan"
													className="max-h-32 rounded-md object-contain"
												/>
												<p className="text-xs text-gray-600 mt-2">
													{selectedFile.width}x{selectedFile.height} px
												</p>
											</div>
											<span className="text-green-600 text-lg">✓</span>
										</div>
									</div>
								)}

								<button
									type="button"
									onClick={handleUploadButtonClick}
									disabled={isUploading}
									className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-700 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{selectedFile ? '✓ Image Selected - Click to Change' : 'Choose Image'}
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFileSelect}
									className="hidden"
									disabled={isUploading}
								/>
								<p className="text-xs text-gray-500 mt-2">
									Max size: 10MB. Supported formats: JPG, PNG, GIF, etc.
								</p>
							</div>
						</div>

						<div className="flex gap-3 mt-6">
							<button
								type="button"
								onClick={handleCloseUploadModal}
								disabled={isUploading}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleUploadFloorPlan}
								disabled={isUploading || !selectedFile}
								className="flex-1 px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isUploading ? 'Uploading...' : 'Save'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Floor Plan</h2>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete the floor plan &quot;{floorPlan?.name}&quot;? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								disabled={isDeleting}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteFloorPlan}
								disabled={isDeleting}
								className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isDeleting ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
