import type { GroupDetail } from "../types/index.js";
export declare const groupService: {
    listByMonth(monthId: number): Promise<GroupDetail[]>;
    getDetail(id: number): Promise<GroupDetail | null>;
    create(data: {
        month_id: number;
        name: string;
        allocated_budget: number;
    }): Promise<import("../types/index.js").BudgetGroup>;
    update(id: number, data: {
        name?: string;
        allocated_budget?: number;
    }): Promise<import("../types/index.js").BudgetGroup>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=groupService.d.ts.map