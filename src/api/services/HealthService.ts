/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Check API health status
     * Returns the health status of the API server including uptime
     * @returns any Server is healthy
     * @throws ApiError
     */
    public static getApiHealth(): CancelablePromise<{
        statusCode?: number;
        data?: {
            status?: string;
            timestamp?: string;
            uptime?: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health',
        });
    }
}
