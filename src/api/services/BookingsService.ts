/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Booking } from '../models/Booking';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BookingsService {
    /**
     * List all bookings
     * Get paginated list of all bookings with optional filtering (Admin sees all, users see their own)
     * @param page Page number
     * @param limit Items per page
     * @param status Filter by booking status
     * @param resourceId Filter by resource ID
     * @param startDate Filter bookings starting from this date
     * @param endDate Filter bookings until this date
     * @returns PaginatedResponse List of bookings retrieved successfully
     * @throws ApiError
     */
    public static getApiBookings(
        page: number = 1,
        limit: number = 20,
        status?: 'ONHOLD' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
        resourceId?: number,
        startDate?: string,
        endDate?: string,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookings',
            query: {
                'page': page,
                'limit': limit,
                'status': status,
                'resource_id': resourceId,
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Create ONHOLD booking
     * Reserve a resource slot for 10 minutes (Step 1 of two-step booking)
     * @param requestBody
     * @returns any Booking held successfully (expires in 10 minutes)
     * @throws ApiError
     */
    public static postApiBookingsHold(
        requestBody: {
            resource_id: number;
            booking_type: 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'HOURLY';
            start_time: string;
            end_time: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: (Booking & {
            hold_expires_at?: string;
        });
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bookings/hold',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error or resource unavailable`,
            },
        });
    }
    /**
     * Get booking by ID
     * Retrieve a specific booking by its ID
     * @param id Booking ID
     * @returns any Booking retrieved successfully
     * @throws ApiError
     */
    public static getApiBookings1(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Booking;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookings/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Booking not found`,
            },
        });
    }
    /**
     * Update booking
     * Update booking details (notes, reason, etc.)
     * @param id Booking ID
     * @param requestBody
     * @returns any Booking updated successfully
     * @throws ApiError
     */
    public static putApiBookings(
        id: number,
        requestBody: {
            reason?: string;
            notes?: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Booking;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/bookings/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Booking not found`,
            },
        });
    }
    /**
     * Cancel booking
     * Cancel a booking (soft delete)
     * @param id Booking ID
     * @returns any Booking cancelled successfully
     * @throws ApiError
     */
    public static deleteApiBookings(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bookings/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Booking not found`,
                401: `Unauthorized to cancel this booking`,
            },
        });
    }
    /**
     * Confirm ONHOLD booking
     * Confirm a booking within 10 minutes (Step 2 of two-step booking)
     * @param id Booking ID
     * @returns any Booking confirmed successfully
     * @throws ApiError
     */
    public static patchApiBookingsConfirm(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Booking;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/bookings/{id}/confirm',
            path: {
                'id': id,
            },
            errors: {
                400: `Booking expired or already confirmed`,
                404: `Booking not found`,
            },
        });
    }
    /**
     * Cancel booking
     * Cancel a booking (status changes to CANCELLED)
     * @param id Booking ID
     * @returns any Booking cancelled successfully
     * @throws ApiError
     */
    public static patchApiBookingsCancel(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Booking;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/bookings/{id}/cancel',
            path: {
                'id': id,
            },
            errors: {
                400: `Cannot cancel completed booking`,
                404: `Booking not found`,
            },
        });
    }
    /**
     * Mark booking as no-show
     * Mark a booking as no-show (Admin only)
     * @param id Booking ID
     * @returns any Booking marked as no-show
     * @throws ApiError
     */
    public static patchApiBookingsNoShow(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Booking;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/bookings/{id}/no-show',
            path: {
                'id': id,
            },
            errors: {
                404: `Booking not found`,
            },
        });
    }
    /**
     * Complete booking
     * Mark a booking as completed (Admin only)
     * @param id Booking ID
     * @returns any Booking marked as completed
     * @throws ApiError
     */
    public static patchApiBookingsComplete(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Booking;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/bookings/{id}/complete',
            path: {
                'id': id,
            },
            errors: {
                404: `Booking not found`,
            },
        });
    }
    /**
     * Create recurring booking
     * Create a recurring booking pattern
     * @param requestBody
     * @returns any Recurring booking created successfully
     * @throws ApiError
     */
    public static postApiBookingsRecurring(
        requestBody: {
            resource_id: number;
            booking_type: 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'HOURLY';
            start_time: string;
            end_time: string;
            recurrence_pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY';
            recurrence_end_date: string;
            reason?: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            recurring_booking_id?: number;
            created_bookings?: Array<Booking>;
            failed_dates?: Array<string>;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bookings/recurring',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Get recurring booking details
     * Get details of a recurring booking pattern
     * @param id Recurring booking ID
     * @returns any Recurring booking details retrieved
     * @throws ApiError
     */
    public static getApiBookingsRecurring(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            id?: number;
            resource_id?: number;
            user_id?: number;
            recurrence_pattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
            bookings?: Array<Booking>;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookings/recurring/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Recurring booking not found`,
            },
        });
    }
    /**
     * Cancel recurring booking
     * Cancel all future bookings in a recurring pattern
     * @param id Recurring booking ID
     * @returns any Recurring booking cancelled successfully
     * @throws ApiError
     */
    public static deleteApiBookingsRecurring(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
            cancelled_count?: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bookings/recurring/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Recurring booking not found`,
            },
        });
    }
    /**
     * Update recurring booking
     * Update recurring booking pattern details
     * @param id Recurring booking ID
     * @param requestBody
     * @returns any Recurring booking updated successfully
     * @throws ApiError
     */
    public static putApiBookingsRecurring(
        id: number,
        requestBody: {
            recurrence_end_date?: string;
            reason?: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/bookings/recurring/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Recurring booking not found`,
            },
        });
    }
    /**
     * Get upcoming bookings
     * Get list of upcoming bookings for authenticated user
     * @param page
     * @param limit
     * @returns PaginatedResponse Upcoming bookings retrieved successfully
     * @throws ApiError
     */
    public static getApiBookingsUpcoming(
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookings/upcoming',
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get booking history
     * Get past bookings for authenticated user
     * @param page
     * @param limit
     * @returns PaginatedResponse Booking history retrieved successfully
     * @throws ApiError
     */
    public static getApiBookingsHistory(
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bookings/history',
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Detach booking from recurring
     * Detach a single booking from its recurring pattern
     * @param id Booking ID
     * @returns any Booking detached successfully
     * @throws ApiError
     */
    public static deleteApiBookingsDetach(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bookings/{id}/detach',
            path: {
                'id': id,
            },
            errors: {
                404: `Booking not found`,
            },
        });
    }
    /**
     * Cleanup expired holds
     * System endpoint to cleanup expired ONHOLD bookings (Admin only)
     * @returns any Expired holds cleaned up successfully
     * @throws ApiError
     */
    public static postApiBookingsCleanupExpired(): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
            /**
             * Number of bookings cancelled
             */
            count?: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bookings/cleanup-expired',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
}
