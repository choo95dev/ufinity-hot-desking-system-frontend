/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimeSlot } from '../models/TimeSlot';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TimeslotsService {
    /**
     * Get available timeslots for a resource
     * Retrieves hourly timeslots for a specific resource on a given date.
     * Shows which slots are available and which are booked with booking details.
     * Slots are generated based on the resource's operating hours for that day.
     *
     * @param resourceId ID of the resource to get timeslots for
     * @param date Date to get timeslots for (YYYY-MM-DD format)
     * @returns any Timeslots retrieved successfully
     * @throws ApiError
     */
    public static getApiTimeslots(
        resourceId: number,
        date: string,
    ): CancelablePromise<{
        statusCode?: number;
        data?: Array<TimeSlot>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/timeslots',
            query: {
                'resource_id': resourceId,
                'date': date,
            },
            errors: {
                400: `Invalid request parameters`,
            },
        });
    }
}
