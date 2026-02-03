"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BookingsService } from "@/src/api/services/BookingsService";
import { FloorPlansService } from "@/src/api/services/FloorPlansService";
import { TimeslotsService } from "@/src/api/services/TimeslotsService";
import { OpenAPI } from "@/src/api/core/OpenAPI";
import { getAuthToken } from "@/utils/auth";
import type { Resource } from "@/src/api/models/Resource";
import type { FloorPlan } from "@/src/api/models/FloorPlan";
import type { TimeSlot } from "@/src/api/models/TimeSlot";

type ResourceAvailability = "available" | "partial" | "unavailable" | "disabled";

interface ResourceWithTimeslots extends Resource {
	timeslots: TimeSlot[];
	availability: ResourceAvailability;
}

const formatDateYmd = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const parseDateYmd = (dateString: string): Date => new Date(`${dateString}T00:00:00`);

const isWeekday = (date: Date): boolean => {
	const day = date.getDay();
	return day !== 0 && day !== 6;
};

export default function BookingPage() {
	const [selectedDate, setSelectedDate] = useState(() => {
		const today = new Date();
		const dayOfWeek = today.getDay();
		if (dayOfWeek === 0) {
			today.setDate(today.getDate() + 1);
		} else if (dayOfWeek === 6) {
			today.setDate(today.getDate() + 2);
		}
		return formatDateYmd(today);
	});

	const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<number | null>(null);
	const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
	const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
	const [resourcesWithTimeslots, setResourcesWithTimeslots] = useState<ResourceWithTimeslots[]>([]);
	const [selectedResource, setSelectedResource] = useState<ResourceWithTimeslots | null>(null);
	const [selectedTimeslot, setSelectedTimeslot] = useState<TimeSlot | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [holdBookingId, setHoldBookingId] = useState<number | null>(null);
	const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
	const [timeRemaining, setTimeRemaining] = useState<string>("");
	const [bookingName, setBookingName] = useState("");
	const [isRecurring, setIsRecurring] = useState(false);
	const [recurringPattern, setRecurringPattern] = useState<"DAILY" | "WEEKLY">("DAILY");
	const [recurringEndDate, setRecurringEndDate] = useState(() => {
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + 7);
		return formatDateYmd(endDate);
	});

	// Set authentication token on component mount
	useEffect(() => {
		const token = getAuthToken();
		if (token) {
			OpenAPI.TOKEN = token;
		}
		OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
	}, []);

	// Fetch floor plans list on mount
	useEffect(() => {
		const fetchFloorPlans = async () => {
			try {
				const response = await FloorPlansService.getApiFloorPlans(1, 100);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const floorPlansData = ((response as any).data?.items || []) as FloorPlan[];
				setFloorPlans(floorPlansData);
				
				// Auto-select first floor plan if available
				if (floorPlansData.length > 0 && !selectedFloorPlanId) {
					setSelectedFloorPlanId(floorPlansData[0].id!);
				}
			} catch (err) {
				console.error("Error fetching floor plans:", err);
				setError("Failed to load floor plans");
			}
		};

		fetchFloorPlans();
	}, []);

	// Fetch selected floor plan with resources
	useEffect(() => {
		const fetchFloorPlan = async () => {
			if (!selectedFloorPlanId) {
				setSelectedFloorPlan(null);
				return;
			}

			try {
				const response = await FloorPlansService.getApiFloorPlans1(selectedFloorPlanId);
				setSelectedFloorPlan(response.data || null);
			} catch (err) {
				console.error("Error fetching floor plan:", err);
				setError("Failed to load floor plan details");
			}
		};

		fetchFloorPlan();
	}, [selectedFloorPlanId]);

	// Fetch timeslots for all resources when floor plan or date changes
	useEffect(() => {
		const fetchTimeslots = async () => {
			if (!selectedFloorPlan || !selectedFloorPlan.resources || selectedFloorPlan.resources.length === 0) {
				setResourcesWithTimeslots([]);
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				// Fetch timeslots for each resource
				const resourcesWithData = await Promise.all(
					selectedFloorPlan.resources.map(async (resource) => {
						try {
							const timeslotsResponse = await TimeslotsService.getApiTimeslots(resource.id!, selectedDate);
							const timeslots = timeslotsResponse.data || [];
							
							// Determine availability status
							let availability: ResourceAvailability;
							
							if (!resource.is_active) {
								availability = "disabled";
							} else if (timeslots.length === 0) {
								availability = "unavailable";
							} else {
								const availableCount = timeslots.filter(t => t.is_available).length;
								if (availableCount === 0) {
									availability = "unavailable";
								} else if (availableCount === timeslots.length) {
									availability = "available";
								} else {
									availability = "partial";
								}
							}

							return {
								...resource,
								timeslots,
								availability,
							};
						} catch (err) {
							console.error(`Error fetching timeslots for resource ${resource.id}:`, err);
							return {
								...resource,
								timeslots: [],
								availability: "disabled" as ResourceAvailability,
							};
						}
					})
				);

				setResourcesWithTimeslots(resourcesWithData);
			} catch (err) {
				console.error("Error fetching timeslots:", err);
				setError("Failed to load availability data");
			} finally {
				setIsLoading(false);
			}
		};

		fetchTimeslots();
	}, [selectedFloorPlan, selectedDate]);

	// Countdown timer for hold expiry
	useEffect(() => {
		if (!holdExpiresAt) return;

		const interval = setInterval(() => {
			const now = new Date();
			const diff = holdExpiresAt.getTime() - now.getTime();

			if (diff <= 0) {
				setTimeRemaining("Expired");
				clearInterval(interval);
				setError("Your booking hold has expired. Please try again.");
				handleCancelBooking();
			} else {
				const minutes = Math.floor(diff / 60000);
				const seconds = Math.floor((diff % 60000) / 1000);
				setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [holdExpiresAt]);

	const handleResourceClick = (resource: ResourceWithTimeslots) => {
		if (resource.availability === "disabled" || resource.availability === "unavailable") {
			return;
		}

		setSelectedResource(resource);
		setSelectedTimeslot(null);
		setShowModal(true);
	};

	const handleTimeslotSelect = async (timeslot: TimeSlot) => {
		if (!timeslot.is_available || !selectedResource) {
			return;
		}

		setSelectedTimeslot(timeslot);
		setError(null);
		
		// Create hold booking
		try {
			setIsLoading(true);
			const startTimeStr = `${selectedDate}T${timeslot.start_time}:00`;
			const endTimeStr = `${selectedDate}T${timeslot.end_time}:00`;

			const holdResponse = await BookingsService.postApiBookingsHold({
				resource_id: selectedResource.id!,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				booking_type: "SHORT_TERM" as any,
				start_time: startTimeStr,
				end_time: endTimeStr,
			});

			if (holdResponse.data?.id) {
				setHoldBookingId(holdResponse.data.id);
				// Set expiry time (10 minutes from now)
				const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
				setHoldExpiresAt(expiryTime);
			}
		} catch (err) {
			console.error("Failed to hold booking:", err);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const errorMessage = (err as any)?.body?.message || "Failed to hold the timeslot";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmBooking = async () => {
		if (!holdBookingId || !bookingName.trim()) {
			setError("Please enter your name");
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			// Confirm the hold booking
			await BookingsService.patchApiBookingsConfirm(holdBookingId);

			// If recurring booking is requested, create recurring pattern
			if (isRecurring && selectedResource && selectedTimeslot) {
				try {
					const requestBody = {
						resource_id: selectedResource.id!,
						recurrence_pattern: recurringPattern,
						start_date: selectedDate,
						end_date: recurringEndDate,
						start_time: `${selectedTimeslot.start_time}:00`,
						end_time: `${selectedTimeslot.end_time}:00`,
						reason: `Recurring ${recurringPattern.toLowerCase()} booking for ${selectedResource.name}`,
						...(recurringPattern === "WEEKLY" && {
							days_of_week: [parseDateYmd(selectedDate).getDay()],
						}),
					};

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await BookingsService.postApiBookingsRecurring(requestBody as any);
				} catch (recurringErr) {
					console.error("Failed to create recurring bookings:", recurringErr);
					// Don't fail the whole process if recurring booking fails
				}
			}

			// Success
			alert(`Booking confirmed for ${selectedResource?.name}!${isRecurring ? " Recurring bookings have been created." : ""}`);
			
			// Reset modal state
			setShowModal(false);
			setSelectedTimeslot(null);
			setHoldBookingId(null);
			setHoldExpiresAt(null);
			setBookingName("");
			setIsRecurring(false);
			
			// Refresh floor plan and timeslots
			if (selectedFloorPlanId) {
				const response = await FloorPlansService.getApiFloorPlans1(selectedFloorPlanId);
				setSelectedFloorPlan(response.data || null);
			}
			setSelectedResource(null);
		} catch (err) {
			console.error("Booking confirmation error:", err);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const errorMessage = (err as any)?.body?.message || "Failed to confirm booking";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelBooking = async () => {
		// Cancel the hold booking if it exists
		if (holdBookingId) {
			try {
				await BookingsService.deleteApiBookings(holdBookingId);
			} catch (err) {
				console.error("Failed to cancel hold:", err);
			}
		}
		setSelectedTimeslot(null);
		setHoldBookingId(null);
		setHoldExpiresAt(null);
		setBookingName("");
		setIsRecurring(false);
		setError(null);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Navigation Bar */}
			<nav className="bg-white shadow">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<h1 className="text-2xl font-bold text-gray-900">
							Book a Seat
						</h1>
						<Link
							href="/public/view-booking"
							className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
						>
							My Bookings
						</Link>
					</div>
				</div>
			</nav>

			<div className="max-w-7xl mx-auto py-8 px-4">
				<div className="bg-white rounded-lg shadow-md p-8">
					<h1 className="text-3xl font-extrabold text-gray-900 mb-6">Book a Desk</h1>

					{error && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
							<p className="text-red-800">{error}</p>
						</div>
					)}

					{/* Date Selector */}
					<div className="mb-6">
						<label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-2">
							Select Date (Weekdays only)
						</label>
						<DatePicker
							id="booking-date"
							selected={selectedDate ? parseDateYmd(selectedDate) : null}
							onChange={(date: Date | null) => {
								if (date) {
									setSelectedDate(formatDateYmd(date));
								}
							}}
							filterDate={isWeekday}
							minDate={new Date()}
							dateFormat="yyyy-MM-dd"
							className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
						/>
					</div>

					{/* Floor Plan Selector */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">Select Floor Plan</label>
						<div className="flex gap-3 flex-wrap">
							{floorPlans.map((fp) => (
								<button
									key={fp.id}
									onClick={() => setSelectedFloorPlanId(fp.id!)}
									className={`px-6 py-2 rounded-md font-medium transition-colors ${
										selectedFloorPlanId === fp.id
											? "bg-blue-600 text-white"
											: "bg-gray-200 text-gray-800 hover:bg-gray-300"
									}`}
								>
									{fp.name || `Floor ${fp.floor}`}
								</button>
							))}
						</div>
					</div>

					{/* Legend */}
					{selectedFloorPlan && (
						<div className="mb-6 flex flex-wrap gap-4 text-sm">
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-green-500 rounded-full"></div>
								<span>Fully Available</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
								<span>Partially Available</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-red-500 rounded-full"></div>
								<span>Fully Booked</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-gray-400 rounded-full"></div>
								<span>Disabled/No Hours</span>
							</div>
						</div>
					)}

					{/* Floor Plan Display */}
					{selectedFloorPlan && (
						<div className="mb-8 bg-white rounded shadow-lg p-6">
							<h2 className="text-xl font-medium text-gray-900 mb-2">
								{selectedFloorPlan.name || `Floor ${selectedFloorPlan.floor}`}
							</h2>
							<p className="text-sm text-gray-600 mb-5">Click on a resource to view available timeslots and make a booking</p>

							{isLoading && (
								<div className="text-center py-8">
									<p className="text-gray-600">Loading availability...</p>
								</div>
							)}

							{selectedFloorPlan.image_url ? (
								<div
									className="relative w-full border border-gray-300 rounded cursor-pointer overflow-auto bg-gray-50"
									style={{
										minHeight: "700px",
										maxHeight: "calc(100vh - 250px)",
										backgroundImage: `url(${selectedFloorPlan.image_url})`,
										backgroundSize: "contain",
										backgroundRepeat: "no-repeat",
										backgroundPosition: "top left",
									}}
								>
									{/* Resource markers */}
									{resourcesWithTimeslots.map((resource) => {
										if (
											resource.position_x === null ||
											resource.position_x === undefined ||
											resource.position_y === null ||
											resource.position_y === undefined
										) {
											return null;
										}

										return (
											<button
												key={resource.id}
												onClick={() => handleResourceClick(resource)}
												disabled={
													resource.availability === "disabled" ||
													resource.availability === "unavailable"
												}
												className="absolute flex items-center justify-center font-semibold text-xs text-white rounded-full shadow-lg transition-all duration-200 border-none"
												style={{
													left: `${resource.position_x}px`,
													top: `${resource.position_y}px`,
													width: "28px",
													height: "28px",
													transform: "translate(-50%, -50%)",
													fontSize: "9px",
													backgroundColor:
														resource.availability === "available"
															? "#388e3c"
															: resource.availability === "partial"
															? "#f57c00"
															: resource.availability === "unavailable"
															? "#d32f2f"
															: "#9e9e9e",
													cursor:
														resource.availability === "disabled" ||
														resource.availability === "unavailable"
															? "not-allowed"
															: "pointer",
													opacity:
														resource.availability === "disabled" ||
														resource.availability === "unavailable"
															? 0.5
															: 1,
												}}
												onMouseEnter={(e) => {
													if (
														resource.availability !== "disabled" &&
														resource.availability !== "unavailable"
													) {
														e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.15)";
													}
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.transform = "translate(-50%, -50%)";
												}}
												title={`${resource.name} - ${resource.availability}`}
											>
												{resource.name && resource.name.length > 4
													? resource.name.substring(0, 3)
													: resource.name || ""}
											</button>
										);
									})}
								</div>
							) : (
								<div className="bg-gray-50 rounded-lg p-12 border-2 border-dashed border-gray-300 text-center">
									<p className="text-gray-600">No floor plan image available</p>
								</div>
							)}

							{/* Resources List */}
							<div className="mt-6">
								<h3 className="text-lg font-semibold text-gray-800 mb-4">Available Resources</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{resourcesWithTimeslots.map((resource) => (
										<button
											key={resource.id}
											onClick={() => handleResourceClick(resource)}
											disabled={
												resource.availability === "disabled" ||
												resource.availability === "unavailable"
											}
											className={`p-4 rounded-lg border-2 text-left transition-all ${
												resource.availability === "available"
													? "border-green-500 bg-green-50 hover:bg-green-100"
													: resource.availability === "partial"
													? "border-yellow-500 bg-yellow-50 hover:bg-yellow-100"
													: resource.availability === "unavailable"
													? "border-red-500 bg-red-50 cursor-not-allowed opacity-60"
													: "border-gray-300 bg-gray-50 cursor-not-allowed opacity-60"
											}`}
										>
											<div className="flex items-center justify-between mb-2">
												<h4 className="font-semibold text-gray-900">{resource.name}</h4>
												<div
												className="w-4 h-4 rounded-full"
												style={{
													backgroundColor:
														resource.availability === "available"
															? "#388e3c"
															: resource.availability === "partial"
															? "#f57c00"
															: resource.availability === "unavailable"
															? "#d32f2f"
															: "#9e9e9e",
												}}
												/>
											</div>
											{resource.description && (
												<p className="text-sm text-gray-600 mb-2">{resource.description}</p>
											)}
											<p className="text-xs text-gray-500">
												{resource.timeslots.length} timeslot{resource.timeslots.length !== 1 ? "s" : ""} •{" "}
												{resource.timeslots.filter((t) => t.is_available).length} available
											</p>
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Booking Modal */}
			{showModal && selectedResource && (
				<div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
					<div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
						{!selectedTimeslot ? (
							<>
								{/* Timeslot Selection View */}
								<h2 className="text-2xl font-bold text-gray-900 mb-4">Select Time Slot</h2>
								
								<div className="mb-6 pb-4 border-b border-gray-200">
									<p className="text-gray-900 mb-2">
										<strong>Resource:</strong> {selectedResource.name}
									</p>
									{selectedResource.description && (
										<p className="text-sm text-gray-600">{selectedResource.description}</p>
									)}
									<p className="text-sm text-gray-600 mt-2">
										<strong>Date:</strong> {selectedDate}
									</p>
								</div>

								<div className="mb-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-3">Available Time Slots</h3>
									<p className="text-sm text-gray-600 mb-4">Click on an available timeslot to proceed with booking</p>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
										{selectedResource.timeslots.map((timeslot, index) => (
											<button
												key={index}
												onClick={() => handleTimeslotSelect(timeslot)}
												disabled={!timeslot.is_available || isLoading}
												className={`p-4 rounded-lg border-2 transition-all ${
													timeslot.is_available
														? "border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer"
														: "border-red-300 bg-red-50 cursor-not-allowed opacity-60"
												}`}
											>
												<div className="font-semibold text-gray-900">
													{timeslot.start_time} - {timeslot.end_time}
												</div>
												{!timeslot.is_available && timeslot.booking && (
													<div className="mt-2 text-xs text-gray-600">
														<p>Booked by: {timeslot.booking.user_name}</p>
														<p>Status: {timeslot.booking.status}</p>
													</div>
												)}
												{timeslot.is_available && (
													<div className="mt-1 text-xs text-green-600">Click to book</div>
												)}
											</button>
										))}
									</div>
									{selectedResource.timeslots.length === 0 && (
										<p className="text-gray-600 text-center py-4">No timeslots available for this date</p>
									)}
									{isLoading && (
										<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
											<div className="flex items-center gap-3">
												<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
												<span className="text-blue-800">Holding timeslot...</span>
											</div>
										</div>
									)}
								</div>

								<div className="flex justify-end">
									<button
										onClick={() => {
											setShowModal(false);
											setSelectedResource(null);
										}}
										disabled={isLoading}
										className="py-2 px-6 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
									>
										Close
									</button>
								</div>
							</>
						) : (
							<>
								{/* Booking Details View */}
								<h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Your Booking</h2>

								{/* Hold Timer */}
								{holdExpiresAt && timeRemaining !== "Expired" && (
									<div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="text-yellow-800 font-medium">⏱️ Timeslot held for:</span>
												<span className="text-yellow-900 font-bold text-lg">{timeRemaining}</span>
											</div>
											<span className="text-xs text-yellow-700">Complete booking before time expires</span>
										</div>
									</div>
								)}

								{error && (
									<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
										<p className="text-red-800">{error}</p>
									</div>
								)}

								{/* Booking Details Summary */}
								<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
									<h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Details</h3>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Resource:</span>
											<span className="font-medium text-gray-900">{selectedResource.name}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Date:</span>
											<span className="font-medium text-gray-900">{selectedDate}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Time:</span>
											<span className="font-medium text-gray-900">
												{selectedTimeslot.start_time} - {selectedTimeslot.end_time}
											</span>
										</div>
									</div>
								</div>

								{/* Name Input */}
								<div className="mb-6">
									<label htmlFor="booking-name" className="block text-sm font-medium text-gray-700 mb-2">
										Your Name *
									</label>
									<input
										id="booking-name"
										type="text"
										value={bookingName}
										onChange={(e) => setBookingName(e.target.value)}
										placeholder="Enter your name"
										className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
										required
									/>
								</div>

								{/* Recurring Booking Option */}
								<div className="mb-6 p-4 border border-gray-300 rounded-md">
									<label className="flex items-center gap-2 mb-4 cursor-pointer">
										<input
											type="checkbox"
											checked={isRecurring}
											onChange={(e) => setIsRecurring(e.target.checked)}
											className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
										/>
										<span className="text-sm font-medium text-gray-900">Make this a recurring booking</span>
									</label>

									{isRecurring && (
										<div className="pl-6 space-y-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Recurring Pattern</label>
												<div className="space-y-2">
													<label className="flex items-center gap-2 cursor-pointer">
														<input
															type="radio"
															name="recurring-pattern"
															value="DAILY"
															checked={recurringPattern === "DAILY"}
															onChange={(e) => setRecurringPattern(e.target.value as "DAILY" | "WEEKLY")}
															className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
														/>
														<span className="text-sm text-gray-700">
															Daily (every weekday)
														</span>
													</label>
													<label className="flex items-center gap-2 cursor-pointer">
														<input
															type="radio"
															name="recurring-pattern"
															value="WEEKLY"
															checked={recurringPattern === "WEEKLY"}
															onChange={(e) => setRecurringPattern(e.target.value as "DAILY" | "WEEKLY")}
															className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
														/>
														<span className="text-sm text-gray-700">
															Weekly (same day each week - {parseDateYmd(selectedDate).toLocaleDateString("en-US", { weekday: "long" })})
														</span>
													</label>
												</div>
											</div>

											<div>
												<label htmlFor="recurring-end-date" className="block text-sm font-medium text-gray-700 mb-2">
													Recurring Until
												</label>
												<DatePicker
													id="recurring-end-date"
													selected={recurringEndDate ? parseDateYmd(recurringEndDate) : null}
													onChange={(date: Date | null) => {
														if (date) {
															setRecurringEndDate(formatDateYmd(date));
														}
													}}
													filterDate={isWeekday}
													minDate={parseDateYmd(selectedDate)}
													dateFormat="yyyy-MM-dd"
													className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
												/>
											</div>

											<div className="bg-blue-50 border border-blue-200 rounded-md p-3">
												<p className="text-xs text-blue-800">
													<strong>Note:</strong> The system will attempt to create recurring bookings based on your pattern.
													Some bookings may fail if the timeslot is already taken on specific dates.
												</p>
											</div>
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<div className="flex gap-4">
									<button
										onClick={handleCancelBooking}
										disabled={isLoading}
										className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
									>
										Back
									</button>
									<button
										onClick={handleConfirmBooking}
										disabled={isLoading || !bookingName.trim() || timeRemaining === "Expired"}
										className="flex-1 py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isLoading ? "Processing..." : "Confirm Booking"}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
