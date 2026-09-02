import type { Context } from "hono";
export declare const dashboardController: {
    summary(c: Context): Promise<Response & import("hono").TypedResponse<{
        year_count: number;
        month_count: number;
        total_transactions: number;
        avg_monthly_spending: number;
        highest_spend_month: {
            name: string;
            amount: number;
        } | null;
        lowest_spend_month: {
            name: string;
            amount: number;
        } | null;
        months_over_budget: number;
        highest_spend_group: {
            name: string;
            amount: number;
            month: string;
        } | null;
        most_utilized_category: {
            name: string;
            utilization: number;
            month: string;
        } | null;
        least_utilized_category: {
            name: string;
            utilization: number;
            month: string;
        } | null;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
};
//# sourceMappingURL=dashboardController.d.ts.map