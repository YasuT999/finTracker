import type { Context } from "hono";
export declare const monthController: {
    list(c: Context): Promise<Response & import("hono").TypedResponse<{
        id: number;
        year_id: number;
        name: string;
        total_budget: number;
        total_income: number;
        created_at: string;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    getById(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        total_expenses: number;
        remaining_budget: number;
        savings: number;
        utilization_percentage: number;
        groups: {
            actual_spending: number;
            remaining_budget: number;
            utilization_percentage: number;
            categories: {
                id: number;
                name: string;
                allocated_budget: number;
                actual_spending: number;
                remaining_budget: number;
                utilization_percentage: number;
            }[];
            id: number;
            month_id: number;
            name: string;
            allocated_budget: number;
            created_at: string;
        }[];
        id: number;
        year_id: number;
        name: string;
        total_budget: number;
        total_income: number;
        created_at: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    create(c: Context): Promise<(Response & import("hono").TypedResponse<{
        errors: {
            field: string;
            message: string;
        }[];
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        year_id: number;
        name: string;
        total_budget: number;
        total_income: number;
        created_at: string;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
    update(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: number;
        year_id: number;
        name: string;
        total_budget: number;
        total_income: number;
        created_at: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
    delete(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        success: true;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    copy(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: number;
        year_id: number;
        name: string;
        total_budget: number;
        total_income: number;
        created_at: string;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
};
//# sourceMappingURL=monthController.d.ts.map