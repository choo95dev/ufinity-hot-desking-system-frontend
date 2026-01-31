'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      userId: 'U001',
      userName: 'John Doe',
      bookedSeat: 'A-01',
      bookingTime: '09:00 AM - 05:00 PM',
      bookedAt: '2026-01-28 08:30 AM',
      createdAt: '2026-01-27 03:15 PM',
    },
    {
      userId: 'U002',
      userName: 'Jane Smith',
      bookedSeat: 'B-03',
      bookingTime: '10:00 AM - 04:00 PM',
      bookedAt: '2026-01-28 09:15 AM',
      createdAt: '2026-01-27 04:22 PM',
    },
    {
      userId: 'U003',
      userName: 'Michael Johnson',
      bookedSeat: 'A-05',
      bookingTime: '08:00 AM - 06:00 PM',
      bookedAt: '2026-01-27 04:45 PM',
      createdAt: '2026-01-26 02:10 PM',
    },
    {
      userId: 'U004',
      userName: 'Sarah Williams',
      bookedSeat: 'C-02',
      bookingTime: '09:30 AM - 05:30 PM',
      bookedAt: '2026-01-28 07:00 AM',
      createdAt: '2026-01-27 05:45 PM',
    },
    {
      userId: 'U005',
      userName: 'Robert Brown',
      bookedSeat: 'B-01',
      bookingTime: '08:30 AM - 04:30 PM',
      bookedAt: '2026-01-27 03:20 PM',
      createdAt: '2026-01-26 01:30 PM',
    },
  ];
};

// Extract date from booking datetime string
const extractDate = (bookedAt: string): string => {
  return bookedAt.split(' ')[0]; // Extract YYYY-MM-DD
};

export default function ViewBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchBookings();
        setBookings(data);
        setFilteredBookings(data);
        setError(null);
      } catch (err) {
        setError('Failed to load bookings');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Filter bookings based on date range
  useEffect(() => {
    let filtered = bookings;

    if (startDate) {
      filtered = filtered.filter((booking) => {
        const bookingDate = extractDate(booking.bookedAt);
        return bookingDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter((booking) => {
        const bookingDate = extractDate(booking.bookedAt);
        return bookingDate <= endDate;
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, startDate, endDate]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleDatePickerClick = (pickerId: string, inputRef: HTMLInputElement | null) => {
    if (openPickerId === pickerId) {
      // Picker is already open, close it by blurring
      inputRef?.blur();
      setOpenPickerId(null);
    } else {
      // Open the picker
      inputRef?.showPicker?.();
      setOpenPickerId(pickerId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">View Bookings</h1>
            </div>
            <div className="flex items-center">
              <Link
                href="/admin/manage-seat"
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
              >
                Manage Seat
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Date Filter Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Booking Date Time</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={(e) => {
                    handleDatePickerClick('startDate', e.currentTarget);
                  }}
                  onBlur={() => setOpenPickerId(null)}
                  placeholder="YYYY-MM-DD"
                  className="block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={(e) => {
                    handleDatePickerClick('endDate', e.currentTarget);
                  }}
                  onBlur={() => setOpenPickerId(null)}
                  placeholder="YYYY-MM-DD"
                  className="block w-full px-4 py-2 text-base border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
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
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    User ID
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    User Name
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Booked Seat
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Booking Date Time
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.userId}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {booking.userId}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {booking.userName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                          {booking.bookedSeat}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {booking.bookedAt}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {booking.createdAt}
                      </td>
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
            Showing <span className="font-semibold">{filteredBookings.length}</span> of{' '}
            <span className="font-semibold">{bookings.length}</span> bookings
          </div>
        </div>
      </div>
    </div>
  );
}
