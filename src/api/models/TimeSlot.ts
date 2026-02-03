/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TimeSlot = {
    /**
     * Start time of the slot in HH:mm format
     */
    start_time: string;
    /**
     * End time of the slot in HH:mm format
     */
    end_time: string;
    /**
     * Whether the slot is available for booking
     */
    is_available: boolean;
    /**
     * Booking details if the slot is unavailable (only present when is_available is false)
     */
    booking?: {
        /**
         * Booking ID
         */
        id: number;
        /**
         * Name of the user who made the booking
         */
        user_name: string;
        /**
         * Current status of the booking
         */
        status: TimeSlot.status;
    };
};
export namespace TimeSlot {
    /**
     * Current status of the booking
     */
    export enum status {
        BOOKED = 'BOOKED',
        ONHOLD = 'ONHOLD',
    }
}

