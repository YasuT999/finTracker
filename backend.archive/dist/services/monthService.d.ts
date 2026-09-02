import type { MonthSummary } from "../types/index.js";
export declare const monthService: {
    list(): Promise<import("../types/index.js").Month[]>;
    listByYear(yearId: number): Promise<import("../types/index.js").Month[]>;
    getSummary(id: number): Promise<MonthSummary | null>;
    create(data: {
        year_id: number;
        name: string;
        total_budget: number;
    }): Promise<import("../types/index.js").Month>;
    update(id: number, data: {
        name?: string;
        total_budget?: number;
    }): Promise<import("../types/index.js").Month>;
    delete(id: number): Promise<void>;
    copy(sourceId: number, newMonthName: string): Promise<import("../types/index.js").Month>;
};
//# sourceMappingURL=monthService.d.ts.map