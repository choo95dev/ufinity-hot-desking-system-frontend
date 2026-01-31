/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Booking = {
    id?: number;
    resource_id?: number;
    user_id?: number;
    recurring_booking_id?: number | null;
    booking_type?: Booking.booking_type;
    status?: Booking.status;
    start_time?: string;
    end_time?: string;
    reason?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
};
export namespace Booking {
    export enum booking_type {
        FULL_DAY = 'FULL_DAY',
        HALF_DAY_AM = 'HALF_DAY_AM',
        HALF_DAY_PM = 'HALF_DAY_PM',
        HOURLY = 'HOURLY',
    }
    export enum status {
        ONHOLD = 'ONHOLD',
        CONFIRMED = 'CONFIRMED',
        CANCELLED = 'CANCELLED',
        COMPLETED = 'COMPLETED',
        NO_SHOW = 'NO_SHOW',
    }
}

