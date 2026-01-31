/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Admin } from '../models/Admin';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Register new user
     * Create a new user account
     * @param requestBody
     * @returns any User created successfully
     * @throws ApiError
     */
    public static postApiAuthUserRegister(
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
        data?: {
            user?: User;
            token?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation error`,
            },
        });
    }
    /**
     * User login
     * Authenticate user and return token
     * @param requestBody
     * @returns any Login successful
     * @throws ApiError
     */
    public static postApiAuthUserLogin(
        requestBody: {
            email: string;
            password: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            user?: User;
            token?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/user/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
            },
        });
    }
    /**
     * Admin login
     * Authenticate admin and return token
     * @param requestBody
     * @returns any Login successful
     * @throws ApiError
     */
    public static postApiAuthAdminLogin(
        requestBody: {
            email: string;
            password: string;
        },
    ): CancelablePromise<{
        statusCode?: number;
        data?: {
            admin?: Admin;
            token?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/admin/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
            },
        });
    }
}
