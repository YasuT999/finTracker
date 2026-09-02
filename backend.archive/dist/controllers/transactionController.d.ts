import type { Context } from "hono";
export declare const transactionController: {
    listByCategory(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        category_id: number;
        amount: number;
        type: "income" | "expense";
        description: string;
        date: string;
        created_at: string;
    }[], import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    create(c: Context): Promise<(Response & import("hono").TypedResponse<{
        errors: {
            field: string;
            message: string;
        }[];
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        id: number;
        category_id: number;
        amount: number;
        type: "income" | "expense";
        description: string;
        date: string;
        created_at: string;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
    update(c: Context): Promise<(Response & import("hono").TypedResponse<{
        id: number;
        category_id: number;
        amount: number;
        type: "income" | "expense";
        description: string;
        date: string;
        created_at: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
    delete(c: Context): Promise<(Response & import("hono").TypedResponse<{
        success: true;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, any, "json">)>;
};
//# sourceMappingURL=transactionController.d.ts.map