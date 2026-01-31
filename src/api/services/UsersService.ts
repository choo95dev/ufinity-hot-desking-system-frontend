/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * List all users
     * Get paginated list of all users with optional filtering
     * @param page Page number
     * @param limit Items per page
     * @param department Filter by department
     * @param isActive Filter by active status
     * @param search Search by name or email
     * @returns PaginatedResponse List of users retrieved successfully
     * @throws ApiError
     */
    public static getApiUsers(
        page: number = 1,
        limit: number = 20,
        department?: string,
        isActive?: boolean,
        search?: string,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users',
            query: {
                'page': page,
                'limit': limit,
                'department': department,
                'is_active': isActive,
                'search': search,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Create user
     * Create a new user (Admin only)
     * @param requestBody
     * @returns any User created successfully
     * @throws ApiError
     */
    public static postApiUsers(
        requestBody: {
            email: string;
            password: string;
            name: string;
            phone?: string;
            employee_id: string;
            department?: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: User;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * Get user by ID
     * Retrieve a specific user by their ID
     * @param id User ID
     * @returns any User retrieved successfully
     * @throws ApiError
     */
    public static getApiUsers1(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: User;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Update user
     * Update user information
     * @param id User ID
     * @param requestBody
     * @returns any User updated successfully
     * @throws ApiError
     */
    public static putApiUsers(
        id: number,
        requestBody: {
            name?: string;
            phone?: string;
            email?: string;
            department?: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: User;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Delete user
     * Soft delete a user (sets is_active to false)
     * @param id User ID
     * @returns any User deleted successfully
     * @throws ApiError
     */
    public static deleteApiUsers(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Toggle user active status
     * Activate or deactivate a user account
     * @param id User ID
     * @param requestBody
     * @returns any User status updated successfully
     * @throws ApiError
     */
    public static patchApiUsersActivate(
        id: number,
        requestBody: {
            is_active: boolean;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: User;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}/activate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Get user bookings
     * Retrieve all bookings for a specific user
     * @param id User ID
     * @param page
     * @param limit
     * @returns PaginatedResponse User bookings retrieved successfully
     * @throws ApiError
     */
    public static getApiUsersBookings(
        id: number,
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/bookings',
            path: {
                'id': id,
            },
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Get user recurring bookings
     * Retrieve all recurring bookings for a specific user
     * @param id User ID
     * @param page
     * @param limit
     * @returns PaginatedResponse User recurring bookings retrieved successfully
     * @throws ApiError
     */
    public static getApiUsersRecurringBookings(
        id: number,
        page: number = 1,
        limit: number = 20,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/recurring-bookings',
            path: {
                'id': id,
            },
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
}
