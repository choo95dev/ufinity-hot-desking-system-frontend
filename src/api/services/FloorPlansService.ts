/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FloorPlan } from '../models/FloorPlan';
import type { PaginatedResponse } from '../models/PaginatedResponse';
import type { Resource } from '../models/Resource';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FloorPlansService {
    /**
     * List all floor plans
     * Get a paginated list of all floor plans with optional filtering
     * @param page Page number for pagination
     * @param limit Number of items per page
     * @param building Filter by building name
     * @param floor Filter by floor
     * @param isActive Filter by active status
     * @returns any Successful response
     * @throws ApiError
     */
    public static getApiFloorPlans(
        page: number = 1,
        limit: number = 20,
        building?: string,
        floor?: string,
        isActive?: string,
    ): CancelablePromise<(PaginatedResponse & {
        data?: Array<FloorPlan>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/floor-plans',
            query: {
                'page': page,
                'limit': limit,
                'building': building,
                'floor': floor,
                'is_active': isActive,
            },
            errors: {
                401: `Authentication required or token invalid`,
            },
        });
    }
    /**
     * Create a new floor plan
     * Create a new floor plan (Admin only)
     * @param requestBody
     * @returns any Floor plan created successfully
     * @throws ApiError
     */
    public static postApiFloorPlans(
        requestBody: {
            name: string;
            building?: string;
            floor?: string;
            image_url: string;
            image_width?: number;
            image_height?: number;
        },
    ): CancelablePromise<(SuccessResponse & {
        data?: FloorPlan;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/floor-plans',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request parameters`,
                401: `Authentication required or token invalid`,
                403: `Insufficient permissions`,
            },
        });
    }
    /**
     * Get floor plan by ID
     * Retrieve a specific floor plan with all related resources
     * @param id Floor plan ID
     * @returns any Successful response
     * @throws ApiError
     */
    public static getApiFloorPlans1(
        id: number,
    ): CancelablePromise<(SuccessResponse & {
        data?: FloorPlan;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/floor-plans/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Authentication required or token invalid`,
                404: `Resource not found`,
            },
        });
    }
    /**
     * Update floor plan
     * Update an existing floor plan (Admin only)
     * @param id Floor plan ID
     * @param requestBody
     * @returns any Floor plan updated successfully
     * @throws ApiError
     */
    public static putApiFloorPlans(
        id: number,
        requestBody: {
            name?: string;
            building?: string;
            floor?: string;
            image_url?: string;
            image_width?: number;
            image_height?: number;
            is_active?: boolean;
        },
    ): CancelablePromise<(SuccessResponse & {
        data?: FloorPlan;
    })> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/floor-plans/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request parameters`,
                401: `Authentication required or token invalid`,
                403: `Insufficient permissions`,
                404: `Resource not found`,
            },
        });
    }
    /**
     * Delete floor plan
     * Soft delete a floor plan (Admin only). Resources will be unlinked from this floor plan.
     * @param id Floor plan ID
     * @returns any Floor plan deleted successfully
     * @throws ApiError
     */
    public static deleteApiFloorPlans(
        id: number,
    ): CancelablePromise<(SuccessResponse & {
        data?: {
            message?: string;
        };
    })> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/floor-plans/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Authentication required or token invalid`,
                403: `Insufficient permissions`,
                404: `Resource not found`,
            },
        });
    }
    /**
     * Toggle floor plan active status
     * Activate or deactivate a floor plan (Admin only)
     * @param id Floor plan ID
     * @param requestBody
     * @returns any Floor plan status updated successfully
     * @throws ApiError
     */
    public static patchApiFloorPlansActivate(
        id: number,
        requestBody: {
            is_active: boolean;
        },
    ): CancelablePromise<(SuccessResponse & {
        data?: FloorPlan;
    })> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/floor-plans/{id}/activate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request parameters`,
                401: `Authentication required or token invalid`,
                403: `Insufficient permissions`,
                404: `Resource not found`,
            },
        });
    }
    /**
     * Get all resources on floor plan
     * Retrieve all resources positioned on a specific floor plan
     * @param id Floor plan ID
     * @returns any Successful response
     * @throws ApiError
     */
    public static getApiFloorPlansResources(
        id: number,
    ): CancelablePromise<(SuccessResponse & {
        data?: Array<Resource>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/floor-plans/{id}/resources',
            path: {
                'id': id,
            },
            errors: {
                401: `Authentication required or token invalid`,
                404: `Resource not found`,
            },
        });
    }
}
