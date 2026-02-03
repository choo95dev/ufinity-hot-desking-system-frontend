"use client";

import { BookingsService } from "@/src/api";
import { getAuthToken } from "@/utils/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import { formatDateYmd } from "../../lib/utils/date";

interface Booking {
	id: number;
	user_id: number;
	resource_id: number;
	booking_type: string;
	start_time: string;
	end_time: string;
	status: string;
	created_at: string;
	updated_at: string;
	resource?: {
		id: number;
		name: string;
	};
	user?: {
		id: number;
		name: string;
	};
}

const PAGE_TITLE = "View Bookings";
const EMPTY_MESSAGE = "No bookings available.";
const SEARCH_PLACEHOLDER = "Search by seat, date, or time";

/**
 * Fetch booking records for the current user.
 * @returns Promise resolving to booking records.
 */
const fetchPublicBookings = async (): Promise<Booking[]> => {
	const token = await getAuthToken();
	const response = await BookingsService.getApiBookings();
	// API returns { statusCode, data: { items: [...], pagination: {...} } }
	if (response.data && typeof response.data === 'object' && 'items' in response.data) {
		const dataWithItems = response.data as { items?: Booking[] };
		return dataWithItems.items || [];
	}
	return Array.isArray(response.data) ? response.data : [];
};

export default function PublicViewBookingPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
	const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);

	useEffect(() => {
		const loadBookings = async () => {
			try {
				setIsLoading(true);
				const data = await fetchPublicBookings();
				setBookings(data);
				setFilteredBookings(data);
				setErrorMessage(null);
			} catch (error) {
				console.error(error);
				setErrorMessage("Failed to load bookings.");
			} finally {
				setIsLoading(false);
			}
		};

		loadBookings();
	}, []);

	useEffect(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		let nextBookings = [...bookings];

		if (normalizedSearch) {
			nextBookings = nextBookings.filter((booking) => {
				const seatName = booking.resource?.name || "";
				const userName = booking.user?.name || "";
				const bookingDate = new Date(booking.start_time).toLocaleDateString();
				const searchTarget = `${seatName} ${bookingDate} ${booking.start_time} ${booking.end_time} ${userName} ${booking.status}`.toLowerCase();
				return searchTarget.includes(normalizedSearch);
			});
		}

		if (startDate) {
			const startValue = formatDateYmd(startDate);
			nextBookings = nextBookings.filter((booking) => {
				const bookingDate = formatDateYmd(new Date(booking.start_time));
				return bookingDate >= startValue;
			});
		}

		if (endDate) {
			const endValue = formatDateYmd(endDate);
			nextBookings = nextBookings.filter((booking) => {
				const bookingDate = formatDateYmd(new Date(booking.start_time));
				return bookingDate <= endValue;
			});
		}

		nextBookings.sort((left, right) => {
			const leftValue = new Date(left.start_time).getTime();
			const rightValue = new Date(right.start_time).getTime();
			if (sortOrder === "newest") {
				return rightValue - leftValue;
			}
			return leftValue - rightValue;
		});

		setFilteredBookings(nextBookings);
	}, [bookings, searchTerm, startDate, endDate, sortOrder]);

	const handleClearFilters = () => {
		setSearchTerm("");
		setStartDate(null);
		setEndDate(null);
		setSortOrder("newest");
	};

	const handleCancelBooking = async (bookingId: number) => {
		try {
			await BookingsService.deleteApiBookings(bookingId);
			setBookings((current) => current.filter((booking) => booking.id !== bookingId));
		} catch (error) {
			console.error("Failed to cancel booking:", error);
			setErrorMessage("Failed to cancel booking. Please try again.");
		}
	};

	const handleStartCancel = (booking: Booking) => {
		setCancelBooking(booking);
	};

	const handleCloseCancel = () => {
		setCancelBooking(null);
	};

	const handleConfirmCancel = () => {
		if (!cancelBooking) return;
		handleCancelBooking(cancelBooking.id);
		handleCloseCancel();
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<p className="text-gray-600" data-testid="view-booking-loading">
					Loading bookings...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<nav className="bg-white shadow">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<h1 className="text-2xl font-bold text-gray-900" data-testid="view-booking-title" id="view-booking-title">
							{PAGE_TITLE}
						</h1>
						<Link
							href="/public/booking"
							className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
							data-testid="view-booking-new-link"
							id="view-booking-new-link"
						>
							Book a Seat
						</Link>
					</div>
				</div>
			</nav>

			<main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{errorMessage && (
					<div className="rounded-md border border-red-200 bg-red-50 p-4 mb-6" data-testid="view-booking-error" id="view-booking-error">
						<p className="text-sm text-red-700">{errorMessage}</p>
					</div>
				)}

				<section className="bg-white shadow rounded-lg p-6 mb-6" data-testid="view-booking-filters" id="view-booking-filters">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Bookings</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
						<div className="lg:col-span-2">
							<label htmlFor="view-booking-search" className="block text-sm font-medium text-gray-700 mb-2">
								Search
							</label>
							<input
								id="view-booking-search"
								name="view-booking-search"
								type="text"
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder={SEARCH_PLACEHOLDER}
								className="block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								data-testid="view-booking-search"
							/>
						</div>
						<div>
							<label htmlFor="view-booking-start-date" className="block text-sm font-medium text-gray-700 mb-2">
								Start Date
							</label>
							<DatePickerInput
								id="view-booking-start-date"
								name="view-booking-start-date"
								selected={startDate}
								onChange={(date: Date | null) => setStartDate(date)}
								dataTestId="view-booking-start-date"
							/>
						</div>
						<div>
							<label htmlFor="view-booking-end-date" className="block text-sm font-medium text-gray-700 mb-2">
								End Date
							</label>
							<DatePickerInput
								id="view-booking-end-date"
								name="view-booking-end-date"
								selected={endDate}
								onChange={(date: Date | null) => setEndDate(date)}
								minDate={startDate}
								dataTestId="view-booking-end-date"
							/>
						</div>
						<div>
							<label htmlFor="view-booking-sort" className="block text-sm font-medium text-gray-700 mb-2">
								Sort by
							</label>
							<select
								id="view-booking-sort"
								name="view-booking-sort"
								value={sortOrder}
								onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}
								className="block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
								data-testid="view-booking-sort"
							>
								<option value="newest">Newest first</option>
								<option value="oldest">Oldest first</option>
							</select>
						</div>
						<div>
							<button
								onClick={handleClearFilters}
								className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
								data-testid="view-booking-clear"
								id="view-booking-clear"
							>
								Clear Filters
							</button>
						</div>
					</div>
				</section>

				<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
					<table className="min-w-full divide-y divide-gray-200" data-testid="view-booking-table" id="view-booking-table">
						<thead className="bg-gray-50">
							<tr>
								<th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">
									Booked Seat
								</th>
								<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Date
								</th>
								<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Start Time
								</th>
								<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									End Time
								</th>
								<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Created At
								</th>
								<th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Action
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 bg-white">
							{filteredBookings.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-6 text-center text-sm text-gray-500">
										{EMPTY_MESSAGE}
									</td>
								</tr>
							) : (
								filteredBookings.map((booking) => {
									const startDate = new Date(booking.start_time);
									const endDate = new Date(booking.end_time);
									return (
										<tr key={booking.id} data-testid={`view-booking-row-${booking.id}`} id={`view-booking-row-${booking.id}`}>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
												<span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
													{booking.resource?.name || `Seat ${booking.resource_id}`}
												</span>
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
												{startDate.toLocaleDateString()}
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
												{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
												{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
												{new Date(booking.created_at).toLocaleString()}
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
												<button
													onClick={() => handleStartCancel(booking)}
													className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
													data-testid={`view-booking-cancel-${booking.id}`}
													id={`view-booking-cancel-${booking.id}`}
												>
													Cancel
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				<p className="mt-4 text-sm text-gray-600" data-testid="view-booking-count" id="view-booking-count">
					Showing <span className="font-semibold">{filteredBookings.length}</span> of <span className="font-semibold">{bookings.length}</span> bookings
				</p>
			</main>

			{cancelBooking && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
					<div className="w-full max-w-md rounded-lg bg-white shadow-lg" data-testid="cancel-booking-modal" id="cancel-booking-modal">
						<div className="border-b px-6 py-4">
							<h2 className="text-lg font-semibold text-gray-900" id="cancel-booking-title">
								Cancel Booking
							</h2>
						</div>
						<div className="px-6 py-4">
							<p className="text-sm text-gray-600">
								Are you sure you want to cancel the booking for <span className="font-semibold">{cancelBooking.resource?.name || `Seat ${cancelBooking.resource_id}`}</span> on <span className="font-semibold">{new Date(cancelBooking.start_time).toLocaleDateString()}</span>?
							</p>
						</div>
						<div className="flex justify-end gap-3 border-t px-6 py-4">
							<button
								onClick={handleCloseCancel}
								className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
								data-testid="cancel-booking-close"
								id="cancel-booking-close"
							>
								Keep Booking
							</button>
							<button
								onClick={handleConfirmCancel}
								className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
								data-testid="cancel-booking-confirm"
								id="cancel-booking-confirm"
							>
								Confirm Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
