/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Resource } from './Resource';
export type FloorPlan = {
    id?: number;
    name?: string;
    building?: string | null;
    floor?: string | null;
    image_url?: string;
    image_width?: number | null;
    image_height?: number | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    resources?: Array<Resource>;
};

