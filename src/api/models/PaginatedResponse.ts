/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PaginatedResponse = {
    statusCode?: number;
    data?: {
        items?: Array<Record<string, any>>;
        pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            totalPages?: number;
        };
    };
};

