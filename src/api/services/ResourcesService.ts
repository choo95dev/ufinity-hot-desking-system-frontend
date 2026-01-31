/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Booking } from '../models/Booking';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { Resource } from '../models/Resource';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResourcesService {
    /**
     * List all resources
     * Get paginated list of all resources with optional filtering
     * @param page Page number
     * @param limit Items per page
     * @param type Filter by resource type
     * @param floor Filter by floor
     * @param building Filter by building
     * @param isActive Filter by active status
     * @returns PaginatedResponse List of resources retrieved successfully
     * @throws ApiError
     */
    public static getApiResources(
        page: number = 1,
        limit: number = 20,
        type?: 'SOLO' | 'TEAM' | 'PARKING',
        floor?: string,
        building?: string,
        isActive: boolean = true,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources',
            query: {
                'page': page,
                'limit': limit,
                'type': type,
                'floor': floor,
                'building': building,
                'is_active': isActive,
            },
        });
    }
    /**
     * Create resource
     * Create a new resource (Admin only)
     * @param requestBody
     * @returns any Resource created successfully
     * @throws ApiError
     */
    public static postApiResources(
        requestBody: {
            name: string;
            description?: string;
            type: 'SOLO' | 'TEAM' | 'PARKING';
            capacity: number;
            pictures?: Array<string>;
            floor?: string;
            building?: string;
            amenities?: Array<string>;
            /**
             * Time slot granularity in minutes
             */
            time_slot_granularity?: number;
            /**
             * Maximum booking duration in minutes
             */
            max_booking_duration?: number;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Resource;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/resources',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Get resource by ID
     * Retrieve a specific resource by its ID
     * @param id Resource ID
     * @returns any Resource retrieved successfully
     * @throws ApiError
     */
    public static getApiResources1(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Resource;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Update resource
     * Update resource information (Admin only)
     * @param id Resource ID
     * @param requestBody
     * @returns any Resource updated successfully
     * @throws ApiError
     */
    public static putApiResources(
        id: number,
        requestBody: {
            name?: string;
            description?: string;
            type?: 'SOLO' | 'TEAM' | 'PARKING';
            capacity?: number;
            pictures?: Array<string>;
            floor?: string;
            building?: string;
            amenities?: Array<string>;
            time_slot_granularity?: number;
            max_booking_duration?: number;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Resource;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/resources/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Delete resource
     * Soft delete a resource (Admin only)
     * @param id Resource ID
     * @returns any Resource deleted successfully
     * @throws ApiError
     */
    public static deleteApiResources(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/resources/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Toggle resource active status
     * Activate or deactivate a resource (Admin only)
     * @param id Resource ID
     * @param requestBody
     * @returns any Resource status updated successfully
     * @throws ApiError
     */
    public static patchApiResourcesActivate(
        id: number,
        requestBody: {
            is_active: boolean;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Resource;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/resources/{id}/activate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Check resource availability
     * Check if a resource is available for booking in a time range
     * @param id Resource ID
     * @param startTime Start time for availability check
     * @param endTime End time for availability check
     * @returns any Availability information retrieved
     * @throws ApiError
     */
    public static getApiResourcesAvailability(
        id: number,
        startTime: string,
        endTime: string,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            available?: boolean;
            conflicting_bookings?: Array<Booking>;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/{id}/availability',
            path: {
                'id': id,
            },
            query: {
                'start_time': startTime,
                'end_time': endTime,
            },
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Batch check resource availability
     * Check availability for multiple resources at once
     * @param requestBody
     * @returns any Batch availability check completed
     * @throws ApiError
     */
    public static postApiResourcesAvailabilityBatch(
        requestBody: {
            resource_ids: Array<number>;
            start_time: string;
            end_time: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Array<{
            resource_id?: number;
            available?: boolean;
            conflicting_bookings?: any[];
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/resources/availability/batch',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Get resource bookings
     * Retrieve all bookings for a specific resource
     * @param id Resource ID
     * @param startDate Filter bookings starting from this date
     * @param endDate Filter bookings until this date
     * @param page
     * @param limit
     * @returns PaginatedResponse Resource bookings retrieved successfully
     * @throws ApiError
     */
    public static getApiResourcesBookings(
        id: number,
        startDate?: string,
        endDate?: string,
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/{id}/bookings',
            path: {
                'id': id,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'page': page,
                'limit': limit,
            },
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Search available resources
     * Search for available resources based on type, location, and time range
     * @param startTime
     * @param endTime
     * @param type
     * @param floor
     * @param building
     * @param page
     * @param limit
     * @returns PaginatedResponse Available resources found
     * @throws ApiError
     */
    public static getApiResourcesSearch(
        startTime: string,
        endTime: string,
        type?: 'SOLO' | 'TEAM' | 'PARKING',
        floor?: string,
        building?: string,
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/search',
            query: {
                'type': type,
                'floor': floor,
                'building': building,
                'start_time': startTime,
                'end_time': endTime,
                'page': page,
                'limit': limit,
            },
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Get resource operating hours
     * Retrieve the weekly operating hours schedule for a resource
     * @param id Resource ID
     * @returns any Operating hours retrieved successfully
     * @throws ApiError
     */
    public static getApiResourcesOperatingHours(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Array<{
            id?: number;
            resource_id?: number;
            /**
             * 0=Sunday, 1=Monday, ..., 6=Saturday
             */
            day_of_week?: number;
            start_time?: string;
            end_time?: string;
            is_available?: boolean;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/{id}/operating-hours',
            path: {
                'id': id,
            },
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Set resource operating hours
     * Set or bulk update the weekly operating hours for a resource (Admin only)
     * @param id Resource ID
     * @param requestBody
     * @returns any Operating hours set successfully
     * @throws ApiError
     */
    public static postApiResourcesOperatingHours(
        id: number,
        requestBody: {
            operating_hours: Array<{
                /**
                 * 0=Sunday, 1=Monday, ..., 6=Saturday
                 */
                day_of_week: number;
                start_time: string;
                end_time: string;
                is_available?: boolean;
            }>;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Array<Record<string, any>>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/resources/{id}/operating-hours',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Update single operating hour
     * Update a specific operating hour entry (Admin only)
     * @param id Resource ID
     * @param hourId Operating hour ID
     * @param requestBody
     * @returns any Operating hour updated successfully
     * @throws ApiError
     */
    public static putApiResourcesOperatingHours(
        id: number,
        hourId: number,
        requestBody: {
            start_time?: string;
            end_time?: string;
            is_available?: boolean;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/resources/{id}/operating-hours/{hourId}',
            path: {
                'id': id,
                'hourId': hourId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Operating hour not found`,
            },
        });
    }
    /**
     * Delete operating hour
     * Delete a specific operating hour entry (Admin only)
     * @param id Resource ID
     * @param hourId Operating hour ID
     * @returns any Operating hour deleted successfully
     * @throws ApiError
     */
    public static deleteApiResourcesOperatingHours(
        id: number,
        hourId: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/resources/{id}/operating-hours/{hourId}',
            path: {
                'id': id,
                'hourId': hourId,
            },
            errors: {
                404: `Operating hour not found`,
            },
        });
    }
    /**
     * Get availability overrides
     * Retrieve availability overrides for a resource within a date range
     * @param id Resource ID
     * @param startDate Start date for override query
     * @param endDate End date for override query
     * @returns any Availability overrides retrieved successfully
     * @throws ApiError
     */
    public static getApiResourcesAvailabilityOverrides(
        id: number,
        startDate?: string,
        endDate?: string,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Array<{
            id?: number;
            resource_id?: number;
            override_date?: string;
            start_time?: string | null;
            end_time?: string | null;
            is_available?: boolean;
            reason?: string;
            created_by?: number;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resources/{id}/availability-overrides',
            path: {
                'id': id,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                404: `Resource not found`,
            },
        });
    }
    /**
     * Create availability override
     * Create an availability override to block or force availability on specific dates (Admin only)
     * @param id Resource ID
     * @param requestBody
     * @returns any Availability override created successfully
     * @throws ApiError
     */
    public static postApiResourcesAvailabilityOverrides(
        id: number,
        requestBody: {
            override_date: string;
            /**
             * Optional - null means all day
             */
            start_time?: string | null;
            /**
             * Optional - null means all day
             */
            end_time?: string | null;
            /**
             * false = block resource, true = force available
             */
            is_available: boolean;
            reason: string;
            /**
             * Admin user ID
             */
            created_by: number;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/resources/{id}/availability-overrides',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Delete availability override
     * Remove an availability override (Admin only)
     * @param id Resource ID
     * @param overrideId Override ID
     * @returns any Availability override deleted successfully
     * @throws ApiError
     */
    public static deleteApiResourcesAvailabilityOverrides(
        id: number,
        overrideId: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/resources/{id}/availability-overrides/{overrideId}',
            path: {
                'id': id,
                'overrideId': overrideId,
            },
            errors: {
                404: `Override not found`,
            },
        });
    }
}
