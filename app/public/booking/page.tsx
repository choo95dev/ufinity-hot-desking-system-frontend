"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DeskStatus = "available" | "booked" | "unavailable" | "partially-booked";

interface TimeSlot {
	start: number;
	end: number;
	status: "available" | "booked";
}

interface Desk {
	id: string;
	name: string;
	status: DeskStatus;
	availableHours?: string;
	timeSlots?: TimeSlot[];
}

interface BookingModalData {
	deskId: string;
	deskName: string;
	availableHours: string;
	timeSlots?: TimeSlot[];
}

export default function BookingPage() {
	const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
	const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [modalData, setModalData] = useState<BookingModalData | null>(null);
	const [startTime, setStartTime] = useState(9);
	const [endTime, setEndTime] = useState(10);
	const [isLoading, setIsLoading] = useState(false);
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
		return today.toISOString().split("T")[0];
	});
	const [isRecurring, setIsRecurring] = useState(false);
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
		return today.toISOString().split("T")[0];
	});

	const desks: Desk[] = [
		{
			id: "desk-1",
			name: "Desk 1",
			status: "available",
			availableHours: "9 hours",
			timeSlots: [{ start: 9, end: 18, status: "available" }],
		},
		{
			id: "desk-2",
			name: "Desk 2",
			status: "booked",
			availableHours: "0 hours",
			timeSlots: [{ start: 9, end: 18, status: "booked" }],
		},
		{
			id: "desk-3",
			name: "Desk 3",
			status: "available",
			availableHours: "9 hours",
			timeSlots: [{ start: 9, end: 18, status: "available" }],
		},
		{
			id: "desk-4",
			name: "Desk 4",
			status: "unavailable",
			availableHours: "0 hours",
			timeSlots: [{ start: 9, end: 18, status: "booked" }],
		},
		{
			id: "desk-5",
			name: "Desk 5",
			status: "partially-booked",
			availableHours: "5 hours",
			timeSlots: [
				{ start: 9, end: 12, status: "booked" },
				{ start: 12, end: 17, status: "available" },
				{ start: 17, end: 18, status: "booked" },
			],
		},
		{
			id: "desk-6",
			name: "Desk 6",
			status: "available",
			availableHours: "9 hours",
			timeSlots: [{ start: 9, end: 18, status: "available" }],
		},
		{
			id: "desk-7",
			name: "Desk 7",
			status: "booked",
			availableHours: "0 hours",
			timeSlots: [{ start: 9, end: 18, status: "booked" }],
		},
		{
			id: "desk-8",
			name: "Desk 8",
			status: "available",
			availableHours: "9 hours",
			timeSlots: [{ start: 9, end: 18, status: "available" }],
		},
		{
			id: "desk-9",
			name: "Desk 9",
			status: "available",
			availableHours: "9 hours",
			timeSlots: [{ start: 9, end: 18, status: "available" }],
		},
		{
			id: "desk-10",
			name: "Desk 10",
			status: "partially-booked",
			availableHours: "6 hours",
			timeSlots: [
				{ start: 9, end: 11, status: "available" },
				{ start: 11, end: 14, status: "booked" },
				{ start: 14, end: 18, status: "available" },
			],
		},
		{
			id: "desk-11",
			name: "Desk 11",
			status: "unavailable",
			availableHours: "0 hours",
			timeSlots: [{ start: 9, end: 18, status: "booked" }],
		},
		{
			id: "desk-12",
			name: "Desk 12",
			status: "available",
			availableHours: "9 hours",
			timeSlots: [{ start: 9, end: 18, status: "available" }],
		},
	];

	const getDeskColor = (desk: Desk): string => {
		if (selectedDesk === desk.id) {
			return "bg-blue-500 hover:bg-blue-500 text-white";
		}

		if (hoveredDesk === desk.id && (desk.status === "available" || desk.status === "partially-booked")) {
			return "bg-yellow-400 text-black";
		}

		switch (desk.status) {
			case "available":
				return "bg-green-500 hover:bg-yellow-400 text-white";
			case "booked":
				return "bg-red-500 text-white cursor-not-allowed";
			case "unavailable":
				return "bg-gray-400 text-white cursor-not-allowed";
			case "partially-booked":
				return "bg-gradient-to-r from-red-500 to-green-500 hover:bg-yellow-400 text-white";
			default:
				return "bg-gray-300";
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

	const handleDeskClick = (desk: Desk) => {
		if (desk.status === "booked" || desk.status === "unavailable") {
			return;
		}

		setSelectedDesk(desk.id);
		setModalData({
			deskId: desk.id,
			deskName: desk.name,
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
		if (!isRecurring) return [selectedDate];

		const dates: string[] = [];
		const start = new Date(selectedDate);
		const end = new Date(recurringEndDate);

		if (recurringPattern === "daily") {
			let current = new Date(start);
			while (current <= end) {
				const dayOfWeek = current.getDay();
				// Only include weekdays (1 = Monday, 5 = Friday)
				if (dayOfWeek !== 0 && dayOfWeek !== 6) {
					dates.push(current.toISOString().split("T")[0]);
				}
				current.setDate(current.getDate() + 1);
			}
		} else if (recurringPattern === "weekly") {
			let current = new Date(start);
			while (current <= end) {
				const dayOfWeek = current.getDay();
				// Only include weekdays
				if (dayOfWeek !== 0 && dayOfWeek !== 6) {
					dates.push(current.toISOString().split("T")[0]);
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

			// TODO: Replace with actual backend API call
			// const response = await fetch('/api/bookings', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({
			//     deskId: modalData.deskId,
			//     startTime: startTime,
			//     endTime: endTime,
			//     dates: bookingDates,
			//     isRecurring: isRecurring,
			//     recurringPattern: isRecurring ? recurringPattern : undefined
			//   }),
			// });
			// const data = await response.json();
			// if (response.ok) {
			//   // Handle successful booking
			// } else {
			//   // Handle error (including partial failures)
			// }

			// Mock API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			console.log("Booking confirmed:", {
				desk: modalData.deskId,
				startTime: startTime,
				endTime: endTime,
				dates: bookingDates,
				isRecurring: isRecurring,
			});

			const message = isRecurring
				? `${bookingDates.length} recurring bookings confirmed for ${modalData.deskName} from ${startTime}:00 to ${endTime}:00`
				: `Booking confirmed for ${modalData.deskName} from ${startTime}:00 to ${endTime}:00`;
			alert(message);
			setShowModal(false);
			setSelectedDesk(null);
			setStartTime(9);
			setEndTime(10);
			setIsRecurring(false);
		} catch (error) {
			console.error("Booking error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedDesk(null);
		setStartTime(9);
		setEndTime(10);
		setIsRecurring(false);
	};

	const renderTimelineTooltip = (desk: Desk) => {
		if (!desk.timeSlots) return null;

		const bookedSlots = desk.timeSlots.filter((slot) => slot.status === "booked");

		return (
			<div className="space-y-2" data-testid={`tooltip-${desk.id}`}>
				<div className="text-xs font-semibold mb-1 text-white">Booking Status</div>
				<div className="flex items-center gap-1 mb-2">
					{desk.timeSlots.map((slot, index) => {
						const widthPercentage = ((slot.end - slot.start) / 9) * 100;
						return (
							<div
								key={index}
								className={`h-2 ${slot.status === "available" ? "bg-green-400" : "bg-red-400"}`}
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

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-6xl mx-auto">
				<div className="bg-white rounded-lg shadow-md p-8">
					<h1 className="text-3xl font-extrabold text-gray-900 mb-6" data-testid="booking-title">
						Book a Desk
					</h1>

					<div className="mb-6">
						<label htmlFor="booking-date" className="block text-sm font-medium text-black mb-2">
							Select Date (Weekdays only)
						</label>
						<DatePicker
							id="booking-date"
							selected={selectedDate ? new Date(selectedDate + "T00:00:00") : null}
							onChange={(date: Date | null) => {
								if (date) {
									const year = date.getFullYear();
									const month = String(date.getMonth() + 1).padStart(2, "0");
									const day = String(date.getDate()).padStart(2, "0");
									setSelectedDate(`${year}-${month}-${day}`);
								}
							}}
							filterDate={(date) => {
								const day = date.getDay();
								return day !== 0 && day !== 6;
							}}
							minDate={new Date()}
							dateFormat="yyyy-MM-dd"
							data-testid="date-picker"
							className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
						/>
						<p className="text-xs text-gray-600 mt-1">Weekends are not available for booking</p>
					</div>
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-gray-800 mb-4">Floor Plan</h2>
						<div className="mb-6 flex flex-wrap gap-4 text-sm text-black">
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-green-500 rounded"></div>
								<span className="text-black">Available</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-red-500 rounded"></div>
								<span className="text-black">Booked</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-gray-400 rounded"></div>
								<span className="text-black">Unavailable</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-blue-500 rounded"></div>
								<span className="text-black">Selected</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-yellow-400 rounded"></div>
								<span className="text-black">Hover</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-4 h-4 bg-gradient-to-r from-red-500 to-green-500 rounded"></div>
								<span className="text-black">Partially Booked</span>
							</div>
						</div>

						<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="desk-grid">
							{desks.map((desk) => (
								<div key={desk.id} className="relative group">
									<button
										onClick={() => handleDeskClick(desk)}
										onMouseEnter={() => setHoveredDesk(desk.id)}
										onMouseLeave={() => setHoveredDesk(null)}
										data-testid={`desk-${desk.id}`}
										data-status={desk.status}
										className={`w-full h-24 rounded-lg font-semibold transition-colors duration-200 ${getDeskColor(desk)}`}
										disabled={desk.status === "booked" || desk.status === "unavailable"}
									>
										{desk.name}
									</button>

									{hoveredDesk === desk.id && desk.status !== "booked" && desk.status !== "unavailable" && (
										<div className="absolute z-10 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-3 px-4 min-w-[200px]">
											{renderTimelineTooltip(desk)}
											<div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{showModal && modalData && (
				<div className="fixed inset-0 flex items-center justify-center z-50" data-testid="booking-modal">
					<div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-black">
						<h2 className="text-2xl font-bold text-black mb-4">Confirm Booking</h2>
						<p className="text-black mb-4">
							<strong>Desk:</strong> {modalData.deskName}
						</p>
						<div className="mb-6 pb-6 border-b border-gray-200">
							<label className="flex items-center gap-2 text-sm font-medium text-black mb-4">
								<input
									type="checkbox"
									checked={isRecurring}
									onChange={(e) => setIsRecurring(e.target.checked)}
									data-testid="recurring-checkbox"
									className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								Make this a recurring booking
							</label>

							{isRecurring && (
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
											selected={recurringEndDate ? new Date(recurringEndDate + "T00:00:00") : null}
											onChange={(date: Date | null) => {
												if (date) {
													const year = date.getFullYear();
													const month = String(date.getMonth() + 1).padStart(2, "0");
													const day = String(date.getDate()).padStart(2, "0");
													setRecurringEndDate(`${year}-${month}-${day}`);
												}
											}}
											filterDate={(date) => {
												const day = date.getDay();
												return day !== 0 && day !== 6;
											}}
											minDate={selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()}
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
													Every {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })} until{" "}
													{new Date(recurringEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
										const widthPercentage = ((slot.end - slot.start) / 9) * 100;
										return (
											<div
												key={index}
												className={`h-6 flex items-center justify-center text-xs font-semibold ${
													slot.status === "available" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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
											{Array.from({ length: 9 }, (_, i) => i + 9).map((hour) => (
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
											{Array.from({ length: 18 - startTime }, (_, i) => i + startTime + 1).map((hour) => (
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
