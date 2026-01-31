# API Client

Auto-generated TypeScript API client from OpenAPI specification.

## Setup

Configure the API base URL before making requests:

```typescript
import { OpenAPI } from './api';

// Set the base URL for all API requests
OpenAPI.BASE = 'http://localhost:3000';

// Set authentication token (if needed)
OpenAPI.TOKEN = 'your-jwt-token';
```

## Usage Examples

### Authentication

```typescript
import { AuthenticationService } from './api';

// User Login
const loginResponse = await AuthenticationService.postApiAuthUserLogin({
  email: 'user@example.com',
  password: 'password123'
});

console.log(loginResponse.data.token);
console.log(loginResponse.data.user);

// User Registration
const registerResponse = await AuthenticationService.postApiAuthUserRegister({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'John Doe',
  employee_id: 'EMP001'
});
```

### Resources

```typescript
import { ResourcesService } from './api';

// Get all resources
const resources = await ResourcesService.getApiResources({
  page: 1,
  limit: 20,
  type: 'SOLO',
  isActive: true
});

console.log(resources.data.items);
console.log(resources.data.pagination);

// Get resource by ID
const resource = await ResourcesService.getApiResources1({
  id: 1
});

console.log(resource.data);

// Check availability
const availability = await ResourcesService.getApiResourcesAvailability({
  id: 1,
  startTime: '2026-02-01T09:00:00Z',
  endTime: '2026-02-01T17:00:00Z'
});

console.log(availability.data.available);
```

### Bookings

```typescript
import { BookingsService } from './api';

// Create ONHOLD booking (Step 1)
const holdBooking = await BookingsService.postApiBookingsHold({
  resource_id: 1,
  booking_type: 'FULL_DAY',
  start_time: '2026-02-01T09:00:00Z',
  end_time: '2026-02-01T17:00:00Z'
});

console.log(holdBooking.data.id);
console.log(holdBooking.data.hold_expires_at);

// Confirm booking (Step 2)
const confirmedBooking = await BookingsService.patchApiBookingsConfirm({
  id: holdBooking.data.id
});

console.log(confirmedBooking.data.status); // CONFIRMED

// Get all bookings
const bookings = await BookingsService.getApiBookings({
  page: 1,
  limit: 20,
  status: 'CONFIRMED'
});

// Cancel booking
await BookingsService.patchApiBookingsCancel({
  id: holdBooking.data.id
});
```

### Users (Admin)

```typescript
import { UsersService } from './api';

// Get all users
const users = await UsersService.getApiUsers({
  page: 1,
  limit: 20,
  department: 'Engineering',
  isActive: true
});

// Create user
const newUser = await UsersService.postApiUsers({
  email: 'newuser@example.com',
  password: 'User123!',
  name: 'Jane Smith',
  employee_id: 'EMP002',
  department: 'Engineering'
});

// Update user
await UsersService.putApiUsers({
  id: 1,
  name: 'Jane Smith Updated',
  department: 'Product'
});
```

### Error Handling

```typescript
import { ApiError } from './api';

try {
  const resource = await ResourcesService.getApiResources1({ id: 999 });
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.body);
    // error.body will contain { statusCode, data: { errorCode, errorMessage } }
  }
}
```

## React Hook Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ResourcesService } from '@/api';

export function ResourceList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const response = await ResourcesService.getApiResources({
          page: 1,
          limit: 20,
          isActive: true
        });
        setResources(response.data.items);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {resources.map((resource) => (
        <div key={resource.id}>{resource.name}</div>
      ))}
    </div>
  );
}
```

## Updating API Client

Whenever the backend API changes, run:

```bash
npm run api:update
```

This will:
1. Fetch the latest OpenAPI spec from `http://localhost:3000/api/docs/swagger.json`
2. Regenerate all TypeScript types and services

## Manual Steps

If you need to run steps individually:

```bash
# Fetch latest spec
npm run api:fetch

# Generate client from spec
npm run api:generate
```
