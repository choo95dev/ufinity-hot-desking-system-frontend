# View Booking Page Requirements

## Implementation Status: ✅ Complete

## Features Implemented

### 1. Bookings Table

- Displays all bookings in a table with the following columns:
    - **Booked Seat**: The seat number/identifier
    - **Date**: Booking date in YYYY-MM-DD format
    - **Start Time**: Booking start time in HH:MM format
    - **End Time**: Booking end time in HH:MM format
    - **Created At**: Timestamp when booking was created
    - **Action**: Cancel button for each booking

### 2. Filter Bookings Section (Single Row Layout)

- **Title**: "Filter Bookings"
- **Search**: Text input to search across seat, date, and time fields
- **Start Date**: React DatePicker to filter bookings from a specific date (weekends disabled)
- **End Date**: React DatePicker to filter bookings until a specific date (weekends disabled)
- **Sort by**: Dropdown to sort by newest or oldest booking time
- **Clear Filters**: Button to reset all filters

### 3. Mock API

- `fetchPublicBookings()` returns 5 hardcoded bookings
- Mock data includes varied seats (A-001 to A-005), dates (2026-02-02 to 2026-02-10), and times

### 4. Search Functionality

- Real-time search across:
    - Booked seat
    - Booking date
    - Booking start time
    - Booking end time

### 5. Date Range Filter

- Filter bookings between start date and end date (inclusive)
- Only weekdays can be selected (weekends disabled)
- Uses React DatePicker component

### 6. Sort Functionality

- Sort by booking time (date + start time combination)
- Options: "Newest first" or "Oldest first"

### 7. Cancel Booking

- Click cancel button opens confirmation modal
- Modal shows booking details (seat, date, time)
- Confirms cancellation before removing booking from list
- Modal can be dismissed by clicking "No, Keep Booking" or clicking outside

### 8. UI/UX Features

- Loading state with spinner
- Error handling with error messages
- Empty state when no bookings match filters
- Responsive design with Tailwind CSS
- All inputs have proper labels and testid attributes
- "Book New Desk" link to navigate to booking page

## Technical Details

- **Component**: Client-side React component (`"use client"`)
- **State Management**: React hooks (useState, useEffect)
- **Styling**: Tailwind CSS
- **Date Handling**: react-datepicker library
- **TypeScript**: Fully typed with Booking interface
