export declare const yearService: {
    list(): Promise<import("../types/index.js").Year[]>;
    create(data: {
        name: string;
    }): Promise<import("../types/index.js").Year>;
    delete(id: number): Promise<void>;
    getData(id: number): Promise<{
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
    } | null>;
};
//# sourceMappingURL=yearService.d.ts.map