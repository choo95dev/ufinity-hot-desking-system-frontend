"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResourcesService } from "@/src/api/services/ResourcesService";
import { BookingsService } from "@/src/api/services/BookingsService";
import { FloorPlansService } from "@/src/api/services/FloorPlansService";
import { OpenAPI } from "@/src/api/core/OpenAPI";
import { getAuthToken } from "@/utils/auth";
import type { Resource } from "@/src/api/models/Resource";
import type { Booking } from "@/src/api/models/Booking";
import type { FloorPlan } from "@/src/api/models/FloorPlan";

type DeskStatus = "available" | "booked" | "unavailable" | "partially-booked";

interface TimeSlot {
	start: number;
	end: number;
	status: "available" | "booked";
	bookedBy?: string;
}

interface Desk {
	id: string;
	name: string;
	description?: string;
	status: DeskStatus;
	availableHours?: string;
	timeSlots?: TimeSlot[];
	position_x?: number | null;
	position_y?: number | null;
}

interface BookingModalData {
	deskId: string;
	deskName: string;
	deskDescription?: string;
	availableHours: string;
	timeSlots?: TimeSlot[];
}

interface BookingSlot {
	start: number;
	end: number;
}

const BOOKING_START_HOUR = 9;
const BOOKING_END_HOUR = 18;
const AM_END_HOUR = 12;
const PM_START_HOUR = 12;
const HOURS_PER_DAY = BOOKING_END_HOUR - BOOKING_START_HOUR;
const DEFAULT_START_TIME = BOOKING_START_HOUR;
const DEFAULT_END_TIME = BOOKING_START_HOUR + 1;

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

const buildHourlySlots = (): BookingSlot[] =>
	Array.from({ length: HOURS_PER_DAY }, (_, index) => ({
		start: BOOKING_START_HOUR + index,
		end: BOOKING_START_HOUR + index + 1,
	}));

const getSlotKey = (slot: BookingSlot): string => `${slot.start}-${slot.end}`;

const parseSlotKey = (slotKey: string): BookingSlot => {
	const [start, end] = slotKey.split("-").map(Number);
	return { start, end };
};

export default function BookingPage() {
	const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
	const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [modalData, setModalData] = useState<BookingModalData | null>(null);
	const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
	const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedFloorPlan, setSelectedFloorPlan] = useState<number | null>(null);
	const [floorPlanData, setFloorPlanData] = useState<FloorPlan | null>(null);
	const [resources, setResources] = useState<Resource[]>([]);
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState(() => {
		const today = new Date();
		const dayOfWeek = today.getDay();
		// If today is Saturday (6) or Sunday (0), set to next Monday
		if (dayOfWeek === 0) {
			// Sunday - add 1 day to get Monday
			today.setDate(today.getDate() + 1);
		} else if (dayOfWeek === 6) {
			// Saturday - add 2 days to get Monday
			today.setDate(today.getDate() + 2);
		}
		return formatDateYmd(today);
	});
	const [bookingMode, setBookingMode] = useState<"single" | "recurring">("single");
	const [recurringPattern, setRecurringPattern] = useState<"daily" | "weekly">("daily");
	const [showDailyInfo, setShowDailyInfo] = useState(false);
	const [showWeeklyInfo, setShowWeeklyInfo] = useState(false);
	const [recurringEndDate, setRecurringEndDate] = useState(() => {
		const today = new Date();
		const dayOfWeek = today.getDay();
		// Start from next Monday if today is a weekend
		if (dayOfWeek === 0) {
			today.setDate(today.getDate() + 1);
		} else if (dayOfWeek === 6) {
			today.setDate(today.getDate() + 2);
		}
		// Add 7 days from the adjusted start date
		today.setDate(today.getDate() + 7);
		return formatDateYmd(today);
	});

	// Set authentication token on component mount
	useEffect(() => {
		const token = getAuthToken();
		if (token) {
			OpenAPI.TOKEN = token;
		}
	}, []);

	// Convert resources and bookings to desk data
	const desks: Desk[] = resources.map((resource) => {
		// Check if resource has operating hours for the selected date
		const operatingHours = resource.operating_hours?.find((oh) => oh.date === selectedDate);

		// If resource is not active or has no operating hours for selected date, mark as unavailable
		if (!resource.is_active || !operatingHours || !operatingHours.is_available) {
			return {
				id: `desk-${resource.id}`,
				name: resource.name || `Desk ${resource.id}`,
				description: resource.description ?? undefined,
				status: "unavailable" as DeskStatus,
				availableHours: "0 hours",
				timeSlots: [],
			};
		}

		// Parse operating hours
		const opStartTime = operatingHours?.start_time?.split(":").map(Number)[0] ?? BOOKING_START_HOUR;
		const opEndTime = operatingHours?.end_time?.split(":").map(Number)[0] ?? BOOKING_END_HOUR;

		// Filter bookings - include CONFIRMED, COMPLETED, and ONHOLD (within 10 min window)
		const resourceBookings = bookings.filter((b) => {
			if (b.resource_id !== resource.id) return false;

			// Include CONFIRMED and COMPLETED bookings
			if (b.status === "CONFIRMED" || b.status === "COMPLETED") return true;

			// Include ONHOLD bookings that are still within the 10-minute hold window
			if (b.status === "ONHOLD" && b.created_at) {
				const createdAt = new Date(b.created_at);
				const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
				return new Date() < expiresAt;
			}

			return false;
		});

		// Build time slots for the resource
		const timeSlots: TimeSlot[] = [];

		if (resourceBookings.length === 0) {
			// No bookings - fully available during operating hours
			timeSlots.push({ start: opStartTime, end: opEndTime, status: "available" });
		} else {
			// Sort bookings by start time
			const sortedBookings = [...resourceBookings].sort((a, b) => {
				if (!a.start_time || !b.start_time) return 0;
				const aStart = new Date(a.start_time).getHours();
				const bStart = new Date(b.start_time).getHours();
				return aStart - bStart;
			});

			let currentHour = opStartTime;

			for (const booking of sortedBookings) {
				if (!booking.start_time || !booking.end_time) continue;

				const bookingStart = new Date(booking.start_time).getHours();
				const bookingEnd = new Date(booking.end_time).getHours();

				// Add available slot before this booking
				if (currentHour < bookingStart) {
					timeSlots.push({ start: currentHour, end: bookingStart, status: "available" });
				}

				// Add booked slot
				timeSlots.push({
					start: bookingStart,
					end: bookingEnd,
					status: "booked",
					bookedBy: `User ${booking.user_id}`,
				});

				currentHour = bookingEnd;
			}

			// Add remaining available time
			if (currentHour < opEndTime) {
				timeSlots.push({ start: currentHour, end: opEndTime, status: "available" });
			}
		}

		// Calculate total available hours
		const availableHours = timeSlots.filter((slot) => slot.status === "available").reduce((sum, slot) => sum + (slot.end - slot.start), 0);

		// Determine desk status
		let status: DeskStatus;
		if (availableHours === 0) {
			status = "booked";
		} else if (availableHours === opEndTime - opStartTime) {
			status = "available";
		} else {
			status = "partially-booked";
		}

		return {
			id: `desk-${resource.id}`,
			name: resource.name || `Desk ${resource.id}`,
			description: resource.description ?? undefined,
			status,
			availableHours: `${availableHours} hours`,
			timeSlots,
			position_x: resource.position_x ?? null,
			position_y: resource.position_y ?? null,
		};
	});

	const getDeskColor = (desk: Desk): string => {
		if (selectedDesk === desk.id) {
			return "bg-blue-100 text-blue-800 border border-blue-200";
		}

		if (hoveredDesk === desk.id && (desk.status === "available" || desk.status === "partially-booked")) {
			return "bg-yellow-100 text-yellow-800 border border-yellow-200";
		}

		switch (desk.status) {
			case "available":
				return "bg-green-100 text-green-800 border border-green-200 hover:bg-yellow-100 hover:text-yellow-800";
			case "booked":
				return "bg-red-100 text-red-800 border border-red-200 cursor-not-allowed";
			case "unavailable":
				return "bg-gray-100 text-gray-800 border border-gray-200 cursor-not-allowed";
			case "partially-booked":
				return "bg-gradient-to-r from-red-100 to-green-100 text-gray-900 border border-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 border border-gray-200";
		}
	};

	const isStartTimeAvailable = (hour: number, timeSlots?: TimeSlot[]): boolean => {
		if (!timeSlots) return false;
		return timeSlots.some((slot) => slot.status === "available" && hour >= slot.start && hour < slot.end);
	};

	const isEndTimeAvailable = (hour: number, selectedStart: number, timeSlots?: TimeSlot[]): boolean => {
		if (!timeSlots) return false;
		const slot = timeSlots.find((s) => s.status === "available" && selectedStart >= s.start && selectedStart < s.end);
		return slot ? hour > selectedStart && hour <= slot.end : false;
	};

	// Fetch floor plan data when selected
	useEffect(() => {
		const fetchFloorPlan = async () => {
			if (!selectedFloorPlan) {
				setFloorPlanData(null);
				return;
			}
			try {
				const floorPlanResponse = await FloorPlansService.getApiFloorPlans1(selectedFloorPlan);
				setFloorPlanData(floorPlanResponse.data || null);
			} catch (err) {
				console.error("Error fetching floor plan:", err);
			}
		};

		fetchFloorPlan();
	}, [selectedFloorPlan]);

	// Fetch resources for selected floor plan
	useEffect(() => {
		const fetchResources = async () => {
			if (!selectedFloorPlan) {
				setResources([]);
				return;
			}

			try {
				setIsLoadingData(true);
				setError(null);

				const resourcesResponse = await ResourcesService.getApiResourcesByFloorPlan(selectedFloorPlan);
				setResources(resourcesResponse.data || []);
			} catch (err) {
				console.error("Error fetching resources:", err);
				setError("Failed to load resources. Please try again.");
			} finally {
				setIsLoadingData(false);
			}
		};

		fetchResources();
	}, [selectedFloorPlan]);

	// Fetch bookings when date or resources change
	useEffect(() => {
		const fetchBookings = async () => {
			if (resources.length === 0 || !selectedDate) {
				setBookings([]);
				return;
			}

			try {
				setIsLoadingData(true);
				setError(null);

				// Calculate date range for the selected date
				const startDate = selectedDate;
				const endDateObj = parseDateYmd(selectedDate);
				endDateObj.setDate(endDateObj.getDate() + 1);
				const endDate = formatDateYmd(endDateObj);

				// Fetch bookings for all resources
				const bookingsResponse = await BookingsService.getApiBookings(1, 1000, undefined, undefined, startDate, endDate);
				const items = bookingsResponse.data?.items || [];
				setBookings(items as Booking[]);
			} catch (err) {
				console.error("Error fetching bookings:", err);
				setError("Failed to load bookings. Please try again.");
			} finally {
				setIsLoadingData(false);
			}
		};

		fetchBookings();
	}, [selectedDate, resources]);

	const hourlySlots = buildHourlySlots();

	const getPeriodAvailability = (desk: Desk, periodStart: number, periodEnd: number): DeskStatus => {
		if (desk.status === "unavailable") return "unavailable";
		if (desk.status === "booked") return "booked";
		if (!desk.timeSlots) return "unavailable";

		let hasAvailable = false;
		let hasBooked = false;
		desk.timeSlots.forEach((slot) => {
			const overlaps = slot.end > periodStart && slot.start < periodEnd;
			if (!overlaps) return;
			if (slot.status === "available") {
				hasAvailable = true;
			} else {
				hasBooked = true;
			}
		});

		if (hasAvailable && hasBooked) return "partially-booked";
		if (hasAvailable) return "available";
		if (hasBooked) return "booked";
		return "unavailable";
	};

	const getAvailabilityLabel = (status: DeskStatus): string => {
		switch (status) {
			case "available":
				return "Available";
			case "booked":
				return "Booked";
			case "unavailable":
				return "Unavailable";
			case "partially-booked":
				return "Partial";
			default:
				return "Unavailable";
		}
	};

	const getAvailabilityClassName = (status: DeskStatus): string => {
		switch (status) {
			case "available":
				return "bg-green-100 text-green-800 border-green-200";
			case "booked":
				return "bg-red-100 text-red-800 border-red-200";
			case "unavailable":
				return "bg-gray-100 text-gray-800 border-gray-200";
			case "partially-booked":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getBookedByInfo = (desk: Desk, periodStart: number, periodEnd: number): string[] => {
		if (!desk.timeSlots) return [];
		const bookedByList: string[] = [];
		desk.timeSlots.forEach((slot) => {
			const overlaps = slot.end > periodStart && slot.start < periodEnd;
			if (overlaps && slot.status === "booked" && slot.bookedBy) {
				if (!bookedByList.includes(slot.bookedBy)) {
					bookedByList.push(slot.bookedBy);
				}
			}
		});
		return bookedByList;
	};

	const handleDeskClick = (desk: Desk) => {
		if (desk.status === "booked" || desk.status === "unavailable") {
			return;
		}

		setSelectedDesk(desk.id);
		setModalData({
			deskId: desk.id,
			deskName: desk.name,
			deskDescription: desk.description,
			availableHours: desk.availableHours || "0 hours",
			timeSlots: desk.timeSlots,
		});
		const firstAvailableSlot = desk.timeSlots?.find((slot) => slot.status === "available");
		if (firstAvailableSlot) {
			setStartTime(firstAvailableSlot.start);
			setEndTime(Math.min(firstAvailableSlot.start + 1, firstAvailableSlot.end));
		}
		setShowModal(true);
	};

	const generateRecurringDates = (): string[] => {
		if (bookingMode !== "recurring") return [selectedDate];

		const dates: string[] = [];
		const start = parseDateYmd(selectedDate);
		const end = parseDateYmd(recurringEndDate);

		if (recurringPattern === "daily") {
			let current = new Date(start);
			while (current <= end) {
				if (isWeekday(current)) {
					dates.push(formatDateYmd(current));
				}
				current.setDate(current.getDate() + 1);
			}
		} else if (recurringPattern === "weekly") {
			let current = new Date(start);
			while (current <= end) {
				if (isWeekday(current)) {
					dates.push(formatDateYmd(current));
				}
				current.setDate(current.getDate() + 7);
			}
		}

		return dates;
	};

	const handleConfirmBooking = async () => {
		if (!modalData) return;

		setIsLoading(true);

		try {
			const bookingDates = generateRecurringDates();
			const resourceId = parseInt(modalData.deskId.replace("desk-", ""));

			if (bookingMode === "recurring") {
				// Create recurring booking
				const startDateObj = parseDateYmd(selectedDate);
				startDateObj.setHours(startTime, 0, 0, 0);
				const endDateObj = parseDateYmd(selectedDate);
				endDateObj.setHours(endTime, 0, 0, 0);

				const recurrenceEndDateObj = parseDateYmd(recurringEndDate);
				recurrenceEndDateObj.setHours(23, 59, 59, 999);

				await BookingsService.postApiBookingsRecurring({
					resource_id: resourceId,
					booking_type: "HOURLY",
					start_time: startDateObj.toISOString(),
					end_time: endDateObj.toISOString(),
					recurrence_pattern: recurringPattern === "daily" ? "DAILY" : "WEEKLY",
					recurrence_end_date: recurrenceEndDateObj.toISOString(),
				});

				const message = `${bookingDates.length} recurring bookings confirmed for ${modalData.deskName} from ${startTime}:00 to ${endTime}:00`;
				alert(message);
			} else {
				// Create single booking using two-step process
				const startDateObj = parseDateYmd(selectedDate);
				startDateObj.setHours(startTime, 0, 0, 0);
				const endDateObj = parseDateYmd(selectedDate);
				endDateObj.setHours(endTime, 0, 0, 0);

				// Step 1: Hold the booking
				const holdResponse = await BookingsService.postApiBookingsHold({
					resource_id: resourceId,
					booking_type: "HOURLY",
					start_time: startDateObj.toISOString(),
					end_time: endDateObj.toISOString(),
				});

				// Step 2: Confirm the booking
				if (holdResponse.data?.id) {
					await BookingsService.patchApiBookingsConfirm(holdResponse.data.id);
					alert(`Booking confirmed for ${modalData.deskName} from ${startTime}:00 to ${endTime}:00`);
				}
			}

			setShowModal(false);
			setSelectedDesk(null);
			setStartTime(DEFAULT_START_TIME);
			setEndTime(DEFAULT_END_TIME);
			setBookingMode("single");

			// Refresh bookings
			const startDate = selectedDate;
			const endDateObj = parseDateYmd(selectedDate);
			endDateObj.setDate(endDateObj.getDate() + 1);
			const endDate = formatDateYmd(endDateObj);
			const bookingsResponse = await BookingsService.getApiBookings(1, 1000, undefined, undefined, startDate, endDate);
			const items = bookingsResponse.data?.items || [];
			setBookings(items as Booking[]);
		} catch (error: any) {
			console.error("Booking error:", error);
			const errorMessage = error?.body?.message || error?.message || "Failed to create booking. Please try again.";
			alert(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedDesk(null);
		setStartTime(DEFAULT_START_TIME);
		setEndTime(DEFAULT_END_TIME);
		setBookingMode("single");
	};

	const renderTimelineTooltip = (desk: Desk) => {
		if (!desk.timeSlots) return null;

		const bookedSlots = desk.timeSlots.filter((slot) => slot.status === "booked");

		return (
			<div className="space-y-2" data-testid={`tooltip-${desk.id}`}>
				<div className="text-xs font-semibold mb-1 text-white">Booking Status</div>
				<div className="flex items-center gap-1 mb-2">
					{desk.timeSlots.map((slot, index) => {
						const widthPercentage = ((slot.end - slot.start) / HOURS_PER_DAY) * 100;
						return (
							<div
								key={index}
								className={`h-2 ${slot.status === "available" ? "bg-green-200" : "bg-red-200"}`}
								style={{ width: `${widthPercentage}%` }}
								title={`${slot.start}:00 - ${slot.end}:00`}
							></div>
						);
					})}
				</div>
				<div className="flex justify-between text-xs text-white">
					<span>09:00</span>
					<span>18:00</span>
				</div>
				{bookedSlots.length > 0 && (
					<div className="border-t border-white border-opacity-30 pt-2 mt-2">
						<div className="text-xs font-semibold mb-1 text-white">Booked Times:</div>
						{bookedSlots.map((slot, index) => (
							<div key={index} className="text-xs text-white">
								✗ {slot.start}:00 - {slot.end}:00
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="bg-white rounded-lg shadow-md p-8">
						<div className="text-center py-8">
							<p className="text-red-600 mb-4">{error}</p>
							<button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
								Retry
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-6xl mx-auto">
				<div className="bg-white rounded-lg shadow-md p-8">
					<h1 className="text-3xl font-extrabold text-gray-900 mb-6" data-testid="booking-title">
						Book a Desk
					</h1>
					{isLoadingData && (
						<div className="text-center py-8">
							<p className="text-gray-600">Loading...</p>
						</div>
					)}
					<div className="mb-6">
						<label htmlFor="booking-date" className="block text-sm font-medium text-black mb-2">
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
							data-testid="date-picker"
							className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
						/>
						<p className="text-xs text-gray-600 mt-1">Weekends are not available for booking</p>
					</div>
					<div className="mb-6">
						<label className="block text-sm font-medium text-black mb-2">Select Floor Plan</label>
						<div className="flex gap-3">
							{[1, 2, 3].map((floorId) => (
								<button
									key={floorId}
									onClick={() => setSelectedFloorPlan(floorId)}
									data-testid={`floor-plan-${floorId}`}
									className={`px-6 py-2 rounded-md font-medium transition-colors ${
										selectedFloorPlan === floorId ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
									}`}
								>
									Floor {floorId}
								</button>
							))}
						</div>
					</div>
					{selectedFloorPlan && (
						<>
							<div className="mb-8">
								<h2 className="text-xl font-semibold text-gray-800 mb-4">Seat Availability</h2>
								<div className="overflow-x-auto" data-testid="seat-availability">
									<table className="min-w-full border border-gray-200 text-sm text-black">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-2 text-left font-semibold">Seat</th>
												<th className="px-4 py-2 text-left font-semibold">AM</th>
												<th className="px-4 py-2 text-left font-semibold">PM</th>
												<th className="px-4 py-2 text-left font-semibold">Booked By (AM)</th>
												<th className="px-4 py-2 text-left font-semibold">Booked By (PM)</th>
												<th className="px-4 py-2 text-left font-semibold">Action</th>
											</tr>
										</thead>
										<tbody>
											{desks.map((desk) => {
												const amStatus = getPeriodAvailability(desk, BOOKING_START_HOUR, AM_END_HOUR);
												const pmStatus = getPeriodAvailability(desk, PM_START_HOUR, BOOKING_END_HOUR);
												const amBookedBy = getBookedByInfo(desk, BOOKING_START_HOUR, AM_END_HOUR);
												const pmBookedBy = getBookedByInfo(desk, PM_START_HOUR, BOOKING_END_HOUR);
												return (
													<tr key={`availability-${desk.id}`} className="border-t border-gray-200">
														<td className="px-4 py-2 font-medium">{desk.name}</td>
														<td className="px-4 py-2">
															<span
																data-testid={`availability-${desk.id}-am`}
																className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${getAvailabilityClassName(amStatus)}`}
															>
																{getAvailabilityLabel(amStatus)}
															</span>
														</td>
														<td className="px-4 py-2">
															<span
																data-testid={`availability-${desk.id}-pm`}
																className={`inline-flex items-center px-2 py-1 rounded border text-xs font-semibold ${getAvailabilityClassName(pmStatus)}`}
															>
																{getAvailabilityLabel(pmStatus)}
															</span>
														</td>
														<td className="px-4 py-2 text-xs text-gray-600">{amBookedBy.length > 0 ? amBookedBy.join(", ") : "-"}</td>
														<td className="px-4 py-2 text-xs text-gray-600">{pmBookedBy.length > 0 ? pmBookedBy.join(", ") : "-"}</td>
														<td className="px-4 py-2">
															<button
																onClick={() => handleDeskClick(desk)}
																disabled={desk.status === "booked" || desk.status === "unavailable"}
																data-testid={`book-${desk.id}`}
																className={`px-3 py-1 rounded text-xs font-medium ${
																	desk.status === "booked" || desk.status === "unavailable"
																		? "bg-gray-300 text-gray-500 cursor-not-allowed"
																		: "bg-blue-600 text-white hover:bg-blue-700"
																}`}
															>
																Book
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
							<div className="mb-8">
								<h2 className="text-xl font-semibold text-gray-800 mb-4">Floor Plan</h2>
								{floorPlanData?.name && (
									<div className="mb-4">
										<p className="text-sm text-gray-600">{floorPlanData.name}</p>
										{floorPlanData.building && floorPlanData.floor && (
											<p className="text-xs text-gray-500">
												{floorPlanData.building} - {floorPlanData.floor}
											</p>
										)}
									</div>
								)}

								<div className="mb-6 flex flex-wrap gap-4 text-sm text-black">
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
										<span className="text-black">Available</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
										<span className="text-black">Booked</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
										<span className="text-black">Unavailable</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
										<span className="text-black">Selected</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
										<span className="text-black">Hover</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-gradient-to-r from-red-100 to-green-100 border border-yellow-200 rounded"></div>
										<span className="text-black">Partially Booked</span>
									</div>
								</div>

								{floorPlanData?.image_url ? (
									<div className="mb-8">
										<div className="bg-slate-100 rounded-lg p-6 border-2 border-slate-300 shadow-lg relative overflow-auto" style={{ maxHeight: "800px" }}>
											<div className="relative inline-block">
												<img
													src={floorPlanData.image_url}
													alt={floorPlanData.name || `Floor ${selectedFloorPlan} Plan`}
													className="rounded-lg shadow-md"
													style={{
														width: floorPlanData.image_width ? `${floorPlanData.image_width}px` : "auto",
														height: floorPlanData.image_height ? `${floorPlanData.image_height}px` : "auto",
													}}
													data-testid="floor-plan-image"
													onLoad={() => console.log("Floor plan image loaded successfully:", floorPlanData.image_url)}
													onError={(e) => {
														console.error("Failed to load floor plan image:", floorPlanData.image_url);
														console.error("Image element:", e.target);
													}}
												/>
												{/* Overlay desks on floor plan */}
												{desks.map((desk) => {
													if (desk.position_x === null || desk.position_x === undefined || desk.position_y === null || desk.position_y === undefined) {
														return null;
													}
													const isHovered = hoveredDesk === desk.id;
													return (
														<div
															key={desk.id}
															className="absolute flex items-center justify-center"
															style={{
																left: `${desk.position_x}px`,
																top: `${desk.position_y}px`,
																transform: "translate(-50%, -50%)",
															}}
														>
															{!isHovered && desk.status !== "booked" && desk.status !== "unavailable" && (
																<div
																	className="absolute rounded-full animate-ping opacity-75"
																	style={{
																		width: "20px",
																		height: "20px",
																		backgroundColor: desk.status === "available" ? "rgb(134, 239, 172)" : "rgb(253, 224, 71)",
																	}}
																></div>
															)}
															<button
																onClick={() => handleDeskClick(desk)}
																onMouseEnter={() => setHoveredDesk(desk.id)}
																onMouseLeave={() => setHoveredDesk(null)}
																data-testid={`desk-${desk.id}`}
																data-status={desk.status}
																className={`relative z-10 ${
																	isHovered ? "px-3 py-2 rounded-lg text-xs font-semibold min-w-[60px]" : "w-3 h-3 rounded-full"
																} transition-all duration-200 shadow-lg hover:shadow-xl ${getDeskColor(desk)}`}
																disabled={desk.status === "booked" || desk.status === "unavailable"}
															>
																{isHovered ? desk.name : ""}
															</button>

															{hoveredDesk === desk.id && desk.status !== "booked" && desk.status !== "unavailable" && (
																<div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-3 px-4 min-w-[200px] pointer-events-none">
																	{renderTimelineTooltip(desk)}
																	<div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
																</div>
															)}
														</div>
													);
												})}
											</div>
										</div>
										<p className="text-xs text-center text-gray-500 mt-2">Click on a desk on the floor plan to make a booking</p>
									</div>
								) : (
									<div className="mb-8 bg-slate-50 rounded-lg p-12 border-2 border-dashed border-slate-300 text-center">
										<div className="text-6xl mb-4">🖼️</div>
										<p className="text-slate-600 font-medium mb-2">No floor plan image available</p>
										<p className="text-sm text-slate-500">Viewing desk list below</p>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{showModal && modalData && (
				<div className="fixed inset-0 flex items-center justify-center z-50" data-testid="booking-modal">
					<div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-black">
						<h2 className="text-2xl font-bold text-black mb-4">Confirm Booking</h2>
						<div className="mb-4 pb-4 border-b border-gray-200">
							<p className="text-black mb-2">
								<strong>Desk:</strong> {modalData.deskName}
							</p>
							{modalData.deskDescription && (
								<div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
									<p className="text-xs font-semibold text-gray-700 mb-1">Description:</p>
									<p className="text-sm text-gray-800">{modalData.deskDescription}</p>
								</div>
							)}
						</div>
						<div className="mb-6 pb-6 border-b border-gray-200">
							<label className="block text-sm font-medium text-black mb-3">Booking Type</label>
							<div className="flex flex-col gap-3 mb-4">
								<label className="flex items-center gap-2 text-sm text-black cursor-pointer">
									<input
										type="radio"
										name="booking-mode"
										value="single"
										checked={bookingMode === "single"}
										onChange={(e) => setBookingMode(e.target.value as "single" | "recurring")}
										data-testid="booking-mode-single"
										className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
									/>
									Single booking
								</label>
								<label className="flex items-center gap-2 text-sm text-black cursor-pointer">
									<input
										type="radio"
										name="booking-mode"
										value="recurring"
										checked={bookingMode === "recurring"}
										onChange={(e) => setBookingMode(e.target.value as "single" | "recurring")}
										data-testid="booking-mode-recurring"
										className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
									/>
									Recurring booking
								</label>
							</div>

							{bookingMode === "recurring" && (
								<div className="ml-6 space-y-4">
									<div>
										<label className="block text-sm font-medium text-black mb-2">Recurring Pattern</label>
										<div className="flex gap-4 mb-4">
											<div className="flex items-center gap-2">
												<label className="flex items-center gap-2 text-sm text-black cursor-pointer">
													<input
														type="radio"
														name="recurring-pattern"
														value="daily"
														checked={recurringPattern === "daily"}
														onChange={(e) => setRecurringPattern(e.target.value as "daily" | "weekly")}
														data-testid="recurring-pattern-daily"
														className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
													/>
													Daily
												</label>
												<div className="relative">
													<button
														type="button"
														onMouseEnter={() => setShowDailyInfo(true)}
														onMouseLeave={() => setShowDailyInfo(false)}
														className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
														data-testid="daily-info-button"
													>
														?
													</button>
													{showDailyInfo && (
														<div className="absolute z-10 left-0 top-6 bg-gray-900 text-white text-xs rounded py-2 px-3 w-64 shadow-lg">
															Book the same desk every weekday (Monday-Friday)
															<div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
														</div>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<label className="flex items-center gap-2 text-sm text-black cursor-pointer">
													<input
														type="radio"
														name="recurring-pattern"
														value="weekly"
														checked={recurringPattern === "weekly"}
														onChange={(e) => setRecurringPattern(e.target.value as "daily" | "weekly")}
														data-testid="recurring-pattern-weekly"
														className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
													/>
													Weekly
												</label>
												<div className="relative">
													<button
														type="button"
														onMouseEnter={() => setShowWeeklyInfo(true)}
														onMouseLeave={() => setShowWeeklyInfo(false)}
														className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
														data-testid="weekly-info-button"
													>
														?
													</button>
													{showWeeklyInfo && (
														<div className="absolute z-10 left-0 top-6 bg-gray-900 text-white text-xs rounded py-2 px-3 w-64 shadow-lg">
															Book the same desk on the same day each week (e.g., every Monday)
															<div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
									<div>
										<label htmlFor="recurring-end-date" className="block text-sm font-medium text-black mb-1">
											End Date (Weekdays only)
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
											minDate={selectedDate ? parseDateYmd(selectedDate) : new Date()}
											dateFormat="yyyy-MM-dd"
											data-testid="recurring-end-date"
											className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
										/>
									</div>
									<div className="bg-blue-50 border border-blue-200 rounded-md p-3">
										<p className="text-xs font-semibold text-black mb-1">Preview:</p>
										<p className="text-xs text-black">
											{recurringPattern === "weekly" && (
												<span className="block mb-1">
													Every {parseDateYmd(selectedDate).toLocaleDateString("en-US", { weekday: "long" })} until{" "}
													{parseDateYmd(recurringEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
												</span>
											)}
											{generateRecurringDates().length} booking{generateRecurringDates().length > 1 ? "s" : ""} will be created
											{generateRecurringDates().length <= 5 && (
												<span className="block mt-1">
													{generateRecurringDates().map((date, idx) => (
														<span key={date}>
															{idx > 0 && ", "}
															{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
														</span>
													))}
												</span>
											)}
										</p>
									</div>
								</div>
							)}
						</div>

						<div className="mb-6">
							<label className="block text-sm font-medium text-black mb-2">Select Time Range</label>
							<div className="space-y-3">
								<div className="flex items-center gap-1 mb-3">
									{modalData.timeSlots?.map((slot, index) => {
										const widthPercentage = ((slot.end - slot.start) / HOURS_PER_DAY) * 100;
										return (
											<div
												key={index}
												className={`h-6 flex items-center justify-center text-xs font-semibold ${
													slot.status === "available" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
												}`}
												style={{ width: `${widthPercentage}%` }}
											>
												{slot.start}-{slot.end}
											</div>
										);
									})}
								</div>
								<div className="flex justify-between text-xs text-black mb-3">
									<span>9:00 AM</span>
									<span>1:00 PM</span>
									<span>6:00 PM</span>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label htmlFor="start-time" className="block text-sm font-medium text-black mb-1">
											Start Time
										</label>
										<select
											id="start-time"
											value={startTime}
											onChange={(e) => {
												const newStart = Number(e.target.value);
												setStartTime(newStart);
												if (!isEndTimeAvailable(endTime, newStart, modalData?.timeSlots)) {
													setEndTime(newStart + 1);
												}
											}}
											data-testid="start-time-select"
											className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
										>
											{Array.from({ length: HOURS_PER_DAY }, (_, i) => i + BOOKING_START_HOUR).map((hour) => (
												<option key={hour} value={hour} disabled={!isStartTimeAvailable(hour, modalData?.timeSlots)}>
													{hour}:00 {!isStartTimeAvailable(hour, modalData?.timeSlots) ? "(Unavailable)" : ""}
												</option>
											))}
										</select>
									</div>
									<div>
										<label htmlFor="end-time" className="block text-sm font-medium text-black mb-1">
											End Time
										</label>
										<select
											id="end-time"
											value={endTime}
											onChange={(e) => setEndTime(Number(e.target.value))}
											data-testid="end-time-select"
											className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
										>
											{Array.from({ length: BOOKING_END_HOUR - startTime }, (_, i) => i + startTime + 1).map((hour) => (
												<option key={hour} value={hour} disabled={!isEndTimeAvailable(hour, startTime, modalData?.timeSlots)}>
													{hour}:00 {!isEndTimeAvailable(hour, startTime, modalData?.timeSlots) ? "(Unavailable)" : ""}
												</option>
											))}
										</select>
									</div>
								</div>
								<p className="text-xs text-black mt-2">Duration: {endTime - startTime} hour(s)</p>
							</div>
						</div>

						<div className="flex gap-4">
							<button
								onClick={handleCloseModal}
								disabled={isLoading}
								data-testid="cancel-button"
								className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmBooking}
								disabled={isLoading}
								data-testid="confirm-button"
								className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? "Processing..." : "Confirm"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
