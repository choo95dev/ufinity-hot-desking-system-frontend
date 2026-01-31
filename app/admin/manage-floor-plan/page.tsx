'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Button,
	Chip,
	Pagination,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
	Spinner,
	Input,
	Switch,
} from '@heroui/react';
import { FloorPlansService, OpenAPI, FloorPlan } from '@/src/api';
import { toast } from 'sonner';
import { getAuthToken } from '@/utils/auth';
import {
	floorPlanSchema,
	FloorPlanFormData,
} from '@/utils/validation/floorPlanSchema';

interface PaginatedFloorPlanResponse {
	statusCode: number;
	data: {
		items: FloorPlan[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	};
}

export default function ManageFloorPlanPage() {
	const router = useRouter();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const {
		isOpen: isCreateOpen,
		onOpen: onCreateOpen,
		onClose: onCreateClose,
	} = useDisclosure();
	const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const {
		control: createControl,
		handleSubmit: handleFormSubmit,
		reset: resetCreateForm,
		formState: { errors: createErrors, isSubmitting: isCreating },
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

	const fetchFloorPlans = async () => {
		setIsLoading(true);
		try {
			// Configure API base URL
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
			
			// Set token from auth utility
			const token = getAuthToken();
			if (token) {
				OpenAPI.TOKEN = token;
			}

			const response = await FloorPlansService.getApiFloorPlans(
				currentPage,
				20
			) as unknown as PaginatedFloorPlanResponse;
			setFloorPlans(response.data?.items || []);
			setTotalPages(Math.ceil((response.data.pagination?.total || 0) / 20));
		} catch (err) {
			toast.error('Failed to load floor plans');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchFloorPlans();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage]);

	const handleDeleteClick = (id: number) => {
		setSelectedId(id);
		onOpen();
	};

	const handleDeleteConfirm = async () => {
		if (!selectedId) return;

		try {
			await FloorPlansService.deleteApiFloorPlans(selectedId);
			toast.success('Floor plan deleted successfully');
			fetchFloorPlans();
			onClose();
		} catch (err) {
			toast.error('Failed to delete floor plan');
			console.error(err);
		}
	};

	const onCreateSubmit = async (data: FloorPlanFormData) => {
		try {
			OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
			const token = getAuthToken();
			if (token) {
				OpenAPI.TOKEN = token;
			}

			await FloorPlansService.postApiFloorPlans(data);
			toast.success('Floor plan created successfully!');
			resetCreateForm();
			onCreateClose();
			fetchFloorPlans();
		} catch (err) {
			toast.error('Failed to create floor plan');
			console.error(err);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50">
			<div className="max-w-7xl mx-auto p-6 md:p-8">
				<div className="mb-8">
					<div className="flex flex-col gap-2 mb-6">
						<h1 className="text-3xl md:text-4xl font-bold text-slate-900">
							Floor Plan Management
						</h1>
						<p className="text-slate-600">
							Manage and organize your workspace floor plans
						</p>
					</div>
					<div className="flex justify-end">
						<Button
							color="primary"
							size="lg"
							onPress={onCreateOpen}
							className="font-semibold shadow-lg"
						>
							+ Add New Floor Plan
						</Button>
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
					<Table
						aria-label="Floor plans table"
						className="min-w-full"
						classNames={{
							th: 'bg-slate-50 text-slate-700 font-semibold',
							td: 'text-slate-900',
						}}
					>
						<TableHeader>
							<TableColumn>ID</TableColumn>
							<TableColumn>NAME</TableColumn>
							<TableColumn>BUILDING</TableColumn>
							<TableColumn>FLOOR</TableColumn>
							<TableColumn>STATUS</TableColumn>
							<TableColumn>ACTIONS</TableColumn>
						</TableHeader>
				<TableBody
					isLoading={isLoading}
					loadingContent={<Spinner />}
					emptyContent="No floor plans found"
				>
					{floorPlans.map((plan) => (
						<TableRow key={plan.id}>
							<TableCell>{plan.id}</TableCell>
							<TableCell>{plan.name}</TableCell>
							<TableCell>{plan.building || '-'}</TableCell>
							<TableCell>{plan.floor || '-'}</TableCell>
							<TableCell>
								<Chip
									color={plan.is_active ? 'success' : 'default'}
									size="sm"
									variant="flat"
									className="font-medium"
								>
									{plan.is_active ? 'Active' : 'Inactive'}
								</Chip>
							</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button
										size="sm"
										color="primary"
										variant="flat"
										className="font-medium"
										onPress={() =>
											router.push(
												`/admin/manage-floor-plan/${plan.id}`
											)
										}
									>
										Edit
									</Button>
									<Button
										size="sm"
										color="danger"
										variant="flat"
										className="font-medium"
										onPress={() => handleDeleteClick(plan.id!)}
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<div className="flex justify-center mt-6">
					<Pagination
						total={totalPages}
						page={currentPage}
						onChange={setCurrentPage}
						className="gap-2"
						classNames={{
							item: 'bg-white shadow-sm',
						}}
					/>
				</div>
			)}
			</div>

			<Modal isOpen={isOpen} onClose={onClose} size="md">
				<ModalContent>
					<ModalHeader className="text-lg font-semibold">
						Confirm Delete
					</ModalHeader>
					<ModalBody>
						<p className="text-slate-600">
							Are you sure you want to delete this floor plan? This action
							cannot be undone.
						</p>
					</ModalBody>
					<ModalFooter>
						<Button variant="light" onPress={onClose} className="font-medium">
							Cancel
						</Button>
						<Button
							color="danger"
							onPress={handleDeleteConfirm}
							className="font-medium"
						>
							Delete
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Create Floor Plan Modal */}
			<Modal
				isOpen={isCreateOpen}
				onClose={() => {
					onCreateClose();
					resetCreateForm();
				}}
				size="2xl"
				scrollBehavior="inside"
			>
				<ModalContent>
					<ModalHeader className="text-xl font-bold text-slate-900">
						Create New Floor Plan
					</ModalHeader>
					<ModalBody>
						<form
							id="create-floor-plan-form"
							onSubmit={handleFormSubmit(onCreateSubmit)}
							className="space-y-4"
						>
							<Controller
								name="name"
								control={createControl}
								render={({ field }) => (
									<Input
										{...field}
										label="Floor Plan Name"
										labelPlacement="outside-left"
										placeholder="e.g., Main Office Floor 3"
										isRequired
										isInvalid={!!createErrors.name}
										errorMessage={createErrors.name?.message}
										data-testid="floor-plan-name-input"
										classNames={{
											base: 'items-center',
											label: 'min-w-[140px] font-medium text-slate-700',
										}}
										variant="bordered"
									/>
								)}
							/>

							<Controller
								name="building"
								control={createControl}
								render={({ field }) => (
									<Input
										{...field}
										label="Building"
										labelPlacement="outside-left"
										placeholder="e.g., Building A"
										isInvalid={!!createErrors.building}
										errorMessage={createErrors.building?.message}
										data-testid="floor-plan-building-input"
										classNames={{
											base: 'items-center',
											label: 'min-w-[140px] font-medium text-slate-700',
										}}
										variant="bordered"
									/>
								)}
							/>

							<Controller
								name="floor"
								control={createControl}
								render={({ field }) => (
									<Input
										{...field}
										label="Floor"
										labelPlacement="outside-left"
										placeholder="e.g., 3rd Floor"
										isInvalid={!!createErrors.floor}
										errorMessage={createErrors.floor?.message}
										data-testid="floor-plan-floor-input"
										classNames={{
											base: 'items-center',
											label: 'min-w-[140px] font-medium text-slate-700',
										}}
										variant="bordered"
									/>
								)}
							/>

							<Controller
								name="image_url"
								control={createControl}
								render={({ field }) => (
									<Input
										{...field}
										label="Image Path"
										labelPlacement="outside-left"
										placeholder="/floor-plans/my-plan.png"
										isRequired
										description="Copy image to public/floor-plans/ first"
										isInvalid={!!createErrors.image_url}
										errorMessage={createErrors.image_url?.message}
										data-testid="floor-plan-image-url-input"
										classNames={{
											base: 'items-center',
											label: 'min-w-[140px] font-medium text-slate-700',
										}}
										variant="bordered"
									/>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<Controller
									name="image_width"
									control={createControl}
									render={({ field: { onChange, value, ...field } }) => (
										<Input
											{...field}
											type="number"
											label="Width (px)"
											labelPlacement="outside-left"
											placeholder="1200"
											value={value?.toString() || ''}
											onChange={(e) =>
												onChange(
													e.target.value ? Number(e.target.value) : undefined
												)
											}
											isInvalid={!!createErrors.image_width}
											errorMessage={createErrors.image_width?.message}
											data-testid="floor-plan-width-input"
											classNames={{
												base: 'items-center',
												label: 'min-w-[100px] font-medium text-slate-700',
											}}
											variant="bordered"
										/>
									)}
								/>

								<Controller
									name="image_height"
									control={createControl}
									render={({ field: { onChange, value, ...field } }) => (
										<Input
											{...field}
											type="number"
											label="Height (px)"
											labelPlacement="outside-left"
											placeholder="800"
											value={value?.toString() || ''}
											onChange={(e) =>
												onChange(
													e.target.value ? Number(e.target.value) : undefined
												)
											}
											isInvalid={!!createErrors.image_height}
											errorMessage={createErrors.image_height?.message}
											data-testid="floor-plan-height-input"
											classNames={{
												base: 'items-center',
												label: 'min-w-[100px] font-medium text-slate-700',
											}}
											variant="bordered"
										/>
									)}
								/>
							</div>

							<Controller
								name="is_active"
								control={createControl}
								render={({ field: { value, onChange } }) => (
									<div className="flex items-center gap-4">
										<span className="min-w-[140px] font-medium text-slate-700 text-sm">
											Active Status
										</span>
										<Switch
											isSelected={value}
											onValueChange={onChange}
											data-testid="floor-plan-active-switch"
											color="success"
                                            style={{width:"100%"}}
										>
										</Switch>
									</div>
								)}
							/>
						</form>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="light"
							onPress={() => {
								onCreateClose();
								resetCreateForm();
							}}
							className="font-medium"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form="create-floor-plan-form"
							color="primary"
							isLoading={isCreating}
							data-testid="floor-plan-submit-button"
							className="font-medium"
						>
							Create Floor Plan
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}
