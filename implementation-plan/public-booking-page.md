# Booking Page Requirements

## User Interface

1. **Floor Plan View**
    - Display a floor plan using buttons to represent desks (tables)
    - Date picker disables weekends and defaults to next Monday if today is a weekend

2. **Desk Status Colors**
    - Red: Booked desks
    - Green: Available desks
    - Grey: Unavailable desks
    - Blue: Currently selected desk
    - Yellow: Hovered desk
    - Red-to-green gradient: Partially booked desks
    - Use for seat availability and floor plan

3. **Seat Availability View**
    - Show availability for the selected date in a list
    - Add a book button then display confirm booking modal on click
    - Display AM/PM availability per seat and booked by who

4. **Booking Hours**
    - Available booking time: 9:00 AM to 6:00 PM (9 hours), can be dynamic based on backend data
    - Minimum booking duration: 1 hour

5. **Floor Plan Interactions**

    **Hover Interactions**
    - When hovering over an available or partially-booked desk, display hover color
    - Show a tooltip with a graphical horizontal timeline
    - Display all booked time ranges in the tooltip (exclude mid-times, show only start/end)

    **Booked Desk Behavior**
    - Red desks are fully booked and cannot be selected, hover can show who booked
    - Clicking on booked desks has no effect

    **Unavailable Desk Behavior**
    - Grey desks are unavailable and cannot be selected
    - Clicking on unavailable desks has no effect

    **Selection Behavior**
    - Clicking an available or partially-booked desk changes it to selected color (blue)

6. **List/Desk Selection and Booking Modal**
    - Opens a modal to confirm booking with time range selection
    - Modal does not have a dark background overlay
    - Confirm button completes the booking
    - After confirmation, desk status updates to booked (red)

7. **Time Selection Interface**
    - Display time in hourly blocks (9:00, 10:00, 11:00, etc.)
    - Use dropdown selectors for selecting start and end times
    - Show all time slots but disable unavailable times (do not hide them)
    - Disabled options are marked with "(Unavailable)" label
    - Ensure end time is always after start time

8. **Non-Interactive Desks**
    - Clicking on booked or unavailable desks triggers no action

9. **Backend Integration**
    - Backend API is currently mocked
    - TODO comment marks location for actual API integration

10. **Recurring Bookings**
    - Radio button to enable recurring booking
    - Pattern selection: Daily (every weekday) or Weekly (same weekday each week)
    - Info icons with hover tooltips explain each pattern
    - Automatically skips weekends in date generation
    - End date picker disables weekends
    - Visual preview showing number of bookings and dates (up to 5 dates displayed)
    - Weekly preview displays selected weekday summary
    - Backend receives array of dates with booking details

11. **Text Styling**
    - Primary text uses black/white; helper text uses muted grey
    - Text inputs display black text
