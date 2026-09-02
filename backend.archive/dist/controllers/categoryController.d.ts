import type { Context } from "hono";
export declare const categoryController: {
    listByGroup(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        group_id: number;
        name: string;
        allocated_budget: number;
        created_at: string;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    getById(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        actual_spending: number;
        remaining_budget: number;
        utilization_percentage: number;
        transactions: {
            id: number;
            category_id: number;
            amount: number;
            type: "income" | "expense";
            description: string;
            date: string;
            created_at: string;
        }[];
        id: number;
        group_id: number;
        name: string;
        allocated_budget: number;
        created_at: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    create(c: Context): Promise<(Response & import("hono").TypedResponse<{
        errors: {
            field: string;
            message: string;
        }[];
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        group_id: number;
        name: string;
        allocated_budget: number;
        created_at: string;
    }, 201, "json">)>;
    update(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: number;
        group_id: number;
        name: string;
        allocated_budget: number;
        created_at: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
    delete(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        success: true;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
};
//# sourceMappingURL=categoryController.d.ts.map