/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Admin } from '../models/Admin';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminsService {
    /**
     * List all admins
     * Get paginated list of all admins with optional filtering
     * @param page Page number
     * @param limit Items per page
     * @param isActive Filter by active status
     * @returns PaginatedResponse List of admins retrieved successfully
     * @throws ApiError
     */
    public static getApiAdmins(
        page: number = 1,
        limit: number = 20,
        isActive?: boolean,
    ): CancelablePromise<PaginatedResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admins',
            query: {
                'page': page,
                'limit': limit,
                'is_active': isActive,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get admin by ID
     * Retrieve a specific admin by their ID
     * @param id Admin ID
     * @returns any Admin retrieved successfully
     * @throws ApiError
     */
    public static getApiAdmins1(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Admin;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admins/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Admin not found`,
            },
        });
    }
    /**
     * Update admin
     * Update admin information
     * @param id Admin ID
     * @param requestBody
     * @returns any Admin updated successfully
     * @throws ApiError
     */
    public static putApiAdmins(
        id: number,
        requestBody: {
            name?: string;
            phone?: string;
            email?: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Admin;
    }> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admins/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Admin not found`,
            },
        });
    }
    /**
     * Delete admin
     * Soft delete an admin (sets is_active to false)
     * @param id Admin ID
     * @returns any Admin deleted successfully
     * @throws ApiError
     */
    public static deleteApiAdmins(
        id: number,
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            message?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/admins/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Admin not found`,
            },
        });
    }
    /**
     * Toggle admin active status
     * Activate or deactivate an admin account
     * @param id Admin ID
     * @param requestBody
     * @returns any Admin status updated successfully
     * @throws ApiError
     */
    public static patchApiAdminsActivate(
        id: number,
        requestBody: {
            is_active: boolean;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: Admin;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admins/{id}/activate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Admin not found`,
            },
        });
    }
}
