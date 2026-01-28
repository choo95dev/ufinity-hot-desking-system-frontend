'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Booking {
  userId: string;
  userName: string;
  bookedSeat: string;
  bookingTime: string;
  bookedAt: string;
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
    },
    {
      userId: 'U002',
      userName: 'Jane Smith',
      bookedSeat: 'B-03',
      bookingTime: '10:00 AM - 04:00 PM',
      bookedAt: '2026-01-28 09:15 AM',
    },
    {
      userId: 'U003',
      userName: 'Michael Johnson',
      bookedSeat: 'A-05',
      bookingTime: '08:00 AM - 06:00 PM',
      bookedAt: '2026-01-27 04:45 PM',
    },
    {
      userId: 'U004',
      userName: 'Sarah Williams',
      bookedSeat: 'C-02',
      bookingTime: '09:30 AM - 05:30 PM',
      bookedAt: '2026-01-28 07:00 AM',
    },
    {
      userId: 'U005',
      userName: 'Robert Brown',
      bookedSeat: 'B-01',
      bookingTime: '08:30 AM - 04:30 PM',
      bookedAt: '2026-01-27 03:20 PM',
    },
  ];
};

export default function ViewBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchBookings();
        setBookings(data);
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
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
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
                    Booking Time
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Booked At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {bookings.map((booking) => (
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
                      {booking.bookingTime}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {booking.bookedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Total bookings: <span className="font-semibold">{bookings.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
