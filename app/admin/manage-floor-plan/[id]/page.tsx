'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Input,
	Button,
	Switch,
	Card,
	CardBody,
	Spinner,
	Divider,
	Chip,
} from '@heroui/react';
import { FloorPlansService, OpenAPI } from '@/src/api';
import { toast } from 'sonner';
import {
	floorPlanSchema,
	FloorPlanFormData,
} from '@/utils/validation/floorPlanSchema';
import { getAuthToken } from '@/utils/auth';

export default function EditFloorPlanPage() {
	const params = useParams();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<FloorPlanFormData>({
		resolver: zodResolver(floorPlanSchema) as any,
		defaultValues: {
			name: '',
			building: '',
			floor: '',
			image_url: '/floor-plans/',
			is_active: true,
		},
	});

	const imageUrl = watch('image_url');

	useEffect(() => {
		// Configure API base URL
		OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
		
		// Set token from auth utility
		const token = getAuthToken();
		if (token) {
			OpenAPI.TOKEN = token;
		}

		loadFloorPlan();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadFloorPlan = async () => {
		setIsLoading(true);
		try {
			const response = await FloorPlansService.getApiFloorPlans1(
				Number(params.id)
			);
			const data = response.data;
			reset({
				name: data?.name || '',
				building: data?.building || '',
				floor: data?.floor || '',
				image_url: data?.image_url || '/floor-plans/',
				image_width: data?.image_width || undefined,
				image_height: data?.image_height || undefined,
				is_active: data?.is_active ?? true,
			});
			if (data?.image_url) {
				setImagePreview(data.image_url);
			}
		} catch (err) {
			toast.error('Failed to load floor plan');
			console.error(err);
			router.push('/admin/manage-floor-plan');
		} finally {
			setIsLoading(false);
		}
	};

	const handleImagePreview = () => {
		if (imageUrl && imageUrl.startsWith('/floor-plans/') && imageUrl.length > 13) {
			setImagePreview(imageUrl);
		}
	};

	const onSubmit = async (data: FloorPlanFormData) => {
		try {
			await FloorPlansService.putApiFloorPlans(Number(params.id), data);
			toast.success('Floor plan updated successfully!');
			router.push('/admin/manage-floor-plan');
		} catch (err) {
			toast.error('Failed to update floor plan');
			console.error(err);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50 flex justify-center items-center">
				<div className="text-center">
					<Spinner size="lg" color="primary" />
					<p className="mt-4 text-slate-600 font-medium">Loading floor plan...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50">
			<div className="max-w-5xl mx-auto p-6 md:p-8">
				{/* Header */}
				<div className="mb-8">
					<Button
						variant="light"
						onPress={() => router.push('/admin/manage-floor-plan')}
						className="mb-4 text-slate-600 hover:text-slate-900"
						startContent={
							<span className="text-xl">←</span>
						}
					>
						Back to Floor Plans
					</Button>
					<div className="flex items-center gap-3 mb-2">
						<div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
							<span className="text-2xl">✏️</span>
						</div>
						<div>
							<h1 className="text-3xl md:text-4xl font-bold text-slate-900">
								Edit Floor Plan
							</h1>
							<p className="text-slate-600 mt-1">
								Update floor plan details
							</p>
						</div>
					</div>
				</div>

				<div className="grid lg:grid-cols-2 gap-6">
					{/* Form Section */}
					<Card className="shadow-xl border border-slate-200">
						<CardBody className="p-6 md:p-8">
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								{/* Basic Information */}
								<div>
									<h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
										<span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
											1
										</span>
										Basic Information
									</h2>
									<div className="space-y-4">
										<Controller
											name="name"
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													label="Floor Plan Name"
													labelPlacement="outside"
													placeholder="e.g., Main Office Floor 3"
													isRequired
													isInvalid={!!errors.name}
													errorMessage={errors.name?.message}
													data-testid="floor-plan-name-input"
													classNames={{
														input: 'text-slate-900',
														label: 'font-medium text-slate-700',
													}}
													variant="bordered"
												/>
											)}
										/>

										<div className="grid grid-cols-2 gap-4">
											<Controller
												name="building"
												control={control}
												render={({ field }) => (
													<Input
														{...field}
														label="Building"
														labelPlacement="outside"
														placeholder="e.g., Building A"
														isInvalid={!!errors.building}
														errorMessage={errors.building?.message}
														data-testid="floor-plan-building-input"
														classNames={{
															input: 'text-slate-900',
															label: 'font-medium text-slate-700',
														}}
														variant="bordered"
													/>
												)}
											/>

											<Controller
												name="floor"
												control={control}
												render={({ field }) => (
													<Input
														{...field}
														label="Floor"
														labelPlacement="outside"
														placeholder="e.g., 3rd Floor"
														isInvalid={!!errors.floor}
														errorMessage={errors.floor?.message}
														data-testid="floor-plan-floor-input"
														classNames={{
															input: 'text-slate-900',
															label: 'font-medium text-slate-700',
														}}
														variant="bordered"
													/>
												)}
											/>
										</div>
									</div>
								</div>

								<Divider className="my-6" />

								{/* Image Configuration */}
								<div>
									<h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
										<span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
											2
										</span>
										Image Configuration
									</h2>
									<div className="space-y-4">
										<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
											<p className="text-sm text-amber-800 font-medium mb-1">
												📌 Important Instructions
											</p>
											<ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
												<li>Copy your floor plan image to <code className="bg-amber-100 px-1 rounded">public/floor-plans/</code></li>
												<li>Supported formats: PNG, JPG, JPEG</li>
												<li>Enter the path as: <code className="bg-amber-100 px-1 rounded">/floor-plans/filename.png</code></li>
											</ol>
										</div>

										<Controller
											name="image_url"
											control={control}
											render={({ field }) => (
												<Input
													{...field}
													label="Image Path"
													labelPlacement="outside"
													placeholder="/floor-plans/my-floor-plan.png"
													isRequired
													isInvalid={!!errors.image_url}
													errorMessage={errors.image_url?.message}
													data-testid="floor-plan-image-url-input"
													classNames={{
														input: 'text-slate-900 font-mono text-sm',
														label: 'font-medium text-slate-700',
													}}
													variant="bordered"
													endContent={
														<Button
															size="sm"
															variant="flat"
															color="primary"
															onPress={handleImagePreview}
															className="text-xs"
														>
															Preview
														</Button>
													}
												/>
											)}
										/>

										<div className="grid grid-cols-2 gap-4">
											<Controller
												name="image_width"
												control={control}
												render={({ field: { onChange, value, ...field } }) => (
													<Input
														{...field}
														type="number"
														label="Width (px)"
														labelPlacement="outside"
														placeholder="e.g., 1200"
														value={value?.toString() || ''}
														onChange={(e) =>
															onChange(
																e.target.value ? Number(e.target.value) : undefined
															)
														}
														isInvalid={!!errors.image_width}
														errorMessage={errors.image_width?.message}
														data-testid="floor-plan-width-input"
														classNames={{
															input: 'text-slate-900',
															label: 'font-medium text-slate-700',
														}}
														variant="bordered"
													/>
												)}
											/>

											<Controller
												name="image_height"
												control={control}
												render={({ field: { onChange, value, ...field } }) => (
													<Input
														{...field}
														type="number"
														label="Height (px)"
														labelPlacement="outside"
														placeholder="e.g., 800"
														value={value?.toString() || ''}
														onChange={(e) =>
															onChange(
																e.target.value ? Number(e.target.value) : undefined
															)
														}
														isInvalid={!!errors.image_height}
														errorMessage={errors.image_height?.message}
														data-testid="floor-plan-height-input"
														classNames={{
															input: 'text-slate-900',
															label: 'font-medium text-slate-700',
														}}
														variant="bordered"
													/>
												)}
											/>
										</div>
									</div>
								</div>

								<Divider className="my-6" />

								{/* Status */}
								<div>
									<h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
										<span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
											3
										</span>
										Status
									</h2>
									<Controller
										name="is_active"
										control={control}
										render={({ field: { value, onChange } }) => (
											<div className="flex items-center justify-between bg-slate-50 rounded-lg p-4 border border-slate-200">
												<div>
													<p className="font-medium text-slate-900">
														Active Status
													</p>
													<p className="text-sm text-slate-600">
														Enable this floor plan for bookings
													</p>
												</div>
												<Switch
													isSelected={value}
													onValueChange={onChange}
													data-testid="floor-plan-active-switch"
													color="success"
													size="lg"
												/>
											</div>
										)}
									/>
								</div>

								<Divider className="my-6" />

								{/* Action Buttons */}
								<div className="flex gap-3 pt-4">
									<Button
										variant="flat"
										onPress={() => router.push('/admin/manage-floor-plan')}
										className="flex-1 font-semibold"
										size="lg"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										color="primary"
										isLoading={isSubmitting}
										data-testid="floor-plan-submit-button"
										className="flex-1 font-semibold shadow-lg"
										size="lg"
									>
										Update Floor Plan
									</Button>
								</div>
							</form>
						</CardBody>
					</Card>

					{/* Preview Section */}
					<div className="space-y-6">
						<Card className="shadow-xl border border-slate-200">
							<CardBody className="p-6">
								<h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
									<span>👁️</span>
									Live Preview
								</h2>
								{imagePreview ? (
									<div className="space-y-4">
										<div className="bg-slate-100 rounded-lg p-4 border-2 border-dashed border-slate-300 overflow-hidden">
											<img
												src={imagePreview}
												alt="Floor plan preview"
												className="w-full h-auto rounded-lg shadow-md"
												onError={() => {
													toast.error('Failed to load image preview');
													setImagePreview(null);
												}}
											/>
										</div>
										<Button
											variant="flat"
											color="danger"
											size="sm"
											onPress={() => setImagePreview(null)}
											className="w-full"
										>
											Clear Preview
										</Button>
									</div>
								) : (
									<div className="bg-slate-50 rounded-lg p-12 border-2 border-dashed border-slate-300 text-center">
										<div className="text-6xl mb-4">🖼️</div>
										<p className="text-slate-600 font-medium mb-2">
											No preview available
										</p>
										<p className="text-sm text-slate-500">
											Enter an image path and click Preview to see your floor plan
										</p>
									</div>
								)}
							</CardBody>
						</Card>

						{/* Quick Tips */}
						<Card className="shadow-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50">
							<CardBody className="p-6">
								<h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
									<span>💡</span>
									Quick Tips
								</h2>
								<ul className="space-y-3 text-sm text-slate-700">
									<li className="flex gap-2">
										<span className="text-amber-500">•</span>
										<span>Changes are saved immediately upon submission</span>
									</li>
									<li className="flex gap-2">
										<span className="text-amber-500">•</span>
										<span>Setting inactive will hide from public booking</span>
									</li>
									<li className="flex gap-2">
										<span className="text-amber-500">•</span>
										<span>Preview the image before saving changes</span>
									</li>
									<li className="flex gap-2">
										<span className="text-amber-500">•</span>
										<span>Existing bookings are not affected by edits</span>
									</li>
								</ul>
							</CardBody>
						</Card>

						{/* Status Indicator */}
						<Card className="shadow-xl border border-slate-200">
							<CardBody className="p-6">
								<h2 className="text-lg font-semibold text-slate-900 mb-4">
									Form Status
								</h2>
								<div className="space-y-2">
									{Object.keys(errors).length > 0 ? (
										<Chip color="danger" variant="flat" className="w-full justify-center">
											⚠️ {Object.keys(errors).length} validation error(s)
										</Chip>
									) : (
										<Chip color="success" variant="flat" className="w-full justify-center">
											✓ All fields valid
										</Chip>
									)}
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
