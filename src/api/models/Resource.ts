/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Resource = {
    id?: number;
    name?: string;
    description?: string | null;
    type?: Resource.type;
    capacity?: number;
    pictures?: Array<string>;
    floor?: string | null;
    building?: string | null;
    amenities?: Array<string>;
    time_slot_granularity?: number;
    max_booking_duration?: number | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
};
export namespace Resource {
    export enum type {
        SOLO = 'SOLO',
        TEAM = 'TEAM',
        PARKING = 'PARKING',
    }
}

