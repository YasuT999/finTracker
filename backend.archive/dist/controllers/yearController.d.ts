import type { Context } from "hono";
export declare const yearController: {
    list(c: Context): Promise<Response & import("hono").TypedResponse<{
        id: number;
        name: string;
        created_at: string;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">>;
    create(c: Context): Promise<(Response & import("hono").TypedResponse<{
        errors: {
            field: string;
            message: string;
        }[];
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        name: string;
        created_at: string;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
    delete(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        success: true;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    exportData(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        year: {
            id: number;
            name: string;
        };
        summary: {
            total_budget: number;
            total_expenses: number;
            remaining_budget: number;
            utilization_percentage: number;
            month_count: number;
        };
        months: {
            id: number;
            name: string;
            total_budget: number;
            total_expenses: number;
            remaining_budget: number;
            utilization_percentage: number;
            groups: {
                id: number;
                name: string;
                allocated_budget: number;
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
                    transactions: {
                        id: number;
                        amount: number;
                        description: string;
                        date: string;
                    }[];
                }[];
            }[];
        }[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
};
//# sourceMappingURL=yearController.d.ts.map