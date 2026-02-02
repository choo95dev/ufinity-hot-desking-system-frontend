"use client";

import { useEffect, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import AdminSideNav from "@/components/AdminSideNav";
import { extractDate, formatDateYmd } from "../../lib/utils/date";

interface Booking {
	userId: string;
	userName: string;
	bookedSeat: string;
	bookingTime: string;
	bookedAt: string;
	createdAt: string;
}

// Mock API function
const fetchBookings = async (): Promise<Booking[]> => {
	// TODO: Replace with actual API call
	// Expected endpoint: GET /api/bookings
	return [
		{
			userId: "U001",
			userName: "John Doe",
			bookedSeat: "A-01",
			bookingTime: "09:00 AM - 05:00 PM",
			bookedAt: "2026-01-28 08:30 AM",
			createdAt: "2026-01-27 03:15 PM",
		},
		{
			userId: "U002",
			userName: "Jane Smith",
			bookedSeat: "B-03",
			bookingTime: "10:00 AM - 04:00 PM",
			bookedAt: "2026-01-28 09:15 AM",
			createdAt: "2026-01-27 04:22 PM",
		},
		{
			userId: "U003",
			userName: "Michael Johnson",
			bookedSeat: "A-05",
			bookingTime: "08:00 AM - 06:00 PM",
			bookedAt: "2026-01-27 04:45 PM",
			createdAt: "2026-01-26 02:10 PM",
		},
		{
			userId: "U004",
			userName: "Sarah Williams",
			bookedSeat: "C-02",
			bookingTime: "09:30 AM - 05:30 PM",
			bookedAt: "2026-01-28 07:00 AM",
			createdAt: "2026-01-27 05:45 PM",
		},
		{
			userId: "U005",
			userName: "Robert Brown",
			bookedSeat: "B-01",
			bookingTime: "08:30 AM - 04:30 PM",
			bookedAt: "2026-01-27 03:20 PM",
			createdAt: "2026-01-26 01:30 PM",
		},
	];
};

export default function ViewBookingPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
	const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

	useEffect(() => {
		const loadBookings = async () => {
			try {
				setIsLoading(true);
				const data = await fetchBookings();
				setBookings(data);
				setFilteredBookings(data);
				setError(null);
			} catch (err) {
				setError("Failed to load bookings");
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};

		loadBookings();
	}, []);

	// Filter bookings based on search, date range, and sort
	useEffect(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		let filtered = [...bookings];

		if (normalizedSearch) {
			filtered = filtered.filter((booking) => {
				const searchTarget = `${booking.userId} ${booking.userName} ${booking.bookedSeat} ${booking.bookedAt} ${booking.createdAt}`.toLowerCase();
				return searchTarget.includes(normalizedSearch);
			});
		}

		if (startDate) {
			const startValue = formatDateYmd(startDate);
			filtered = filtered.filter((booking) => {
				const bookingDate = extractDate(booking.bookedAt);
				return bookingDate >= startValue;
			});
		}

		if (endDate) {
			const endValue = formatDateYmd(endDate);
			filtered = filtered.filter((booking) => {
				const bookingDate = extractDate(booking.bookedAt);
				return bookingDate <= endValue;
			});
		}

		filtered.sort((left, right) => {
			const leftValue = new Date(left.bookedAt).getTime();
			const rightValue = new Date(right.bookedAt).getTime();
			if (sortOrder === "newest") {
				return rightValue - leftValue;
			}
			return leftValue - rightValue;
		});

		setFilteredBookings(filtered);
	}, [bookings, searchTerm, startDate, endDate, sortOrder]);

	const handleClearFilters = () => {
		setSearchTerm("");
		setStartDate(null);
		setEndDate(null);
		setSortOrder("newest");
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					<p className="mt-4 text-gray-600">Loading bookings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 flex">
			<AdminSideNav />
			<div className="flex-1 ml-64 transition-all duration-300">
				<div className="p-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-6">View Bookings</h1>
				<div className="px-4 py-6 sm:px-0">
					{error && (
						<div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
							<p className="text-sm text-red-700">{error}</p>
						</div>
					)}

					{/* Filter Section */}
					<div className="bg-white shadow rounded-lg p-6 mb-6">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Bookings</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
							<div className="lg:col-span-2">
								<label htmlFor="admin-view-booking-search" className="block text-sm font-medium text-gray-700 mb-2">
									Search
								</label>
								<input
									id="admin-view-booking-search"
									name="admin-view-booking-search"
									type="text"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder="Search by user ID, name, seat..."
									className="block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									data-testid="admin-view-booking-search"
								/>
							</div>
							<div>
								<label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
									Start Date
								</label>
								<DatePickerInput 
									id="startDate" 
									name="startDate" 
									selected={startDate} 
									onChange={(date) => setStartDate(date)} 
									placeholderText="Select start date"
									dataTestId="start-date-input" 
								/>
							</div>
							<div>
								<label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
									End Date
								</label>
								<DatePickerInput 
									id="endDate" 
									name="endDate" 
									selected={endDate} 
									onChange={(date) => setEndDate(date)} 
									placeholderText="Select end date"
									minDate={startDate} 
									dataTestId="end-date-input" 
								/>
							</div>
							<div>
								<label htmlFor="admin-view-booking-sort" className="block text-sm font-medium text-gray-700 mb-2">
									Sort by
								</label>
								<select
									id="admin-view-booking-sort"
									name="admin-view-booking-sort"
									value={sortOrder}
									onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
									className="block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
									data-testid="admin-view-booking-sort"
								>
									<option value="newest">Newest first</option>
									<option value="oldest">Oldest first</option>
								</select>
							</div>
							<div>
								<button
									onClick={handleClearFilters}
									className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
									data-testid="admin-view-booking-clear"
								>
									Clear Filters
								</button>
							</div>
						</div>
					</div>

					<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
						<table className="min-w-full divide-y divide-gray-300">
							<thead className="bg-gray-50">
								<tr>
									<th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">User ID</th>
									<th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">User Name</th>
									<th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Booked Seat</th>
									<th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Booking Date Time</th>
									<th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 bg-white">
								{filteredBookings.length > 0 ? (
									filteredBookings.map((booking) => (
										<tr key={booking.userId}>
											<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{booking.userId}</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{booking.userName}</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
												<span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">{booking.bookedSeat}</span>
											</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{booking.bookedAt}</td>
											<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{booking.createdAt}</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={5} className="py-4 text-center text-sm text-gray-500">
											No bookings found for the selected date range.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<div className="mt-4 text-sm text-gray-600">
						Showing <span className="font-semibold">{filteredBookings.length}</span> of <span className="font-semibold">{bookings.length}</span> bookings
					</div>
				</div>
			</div>
		</div>
		</div>
	);
}