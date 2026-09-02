import type { BudgetGroup, BudgetGroupCreate } from "../types/index.js";
export declare const groupRepository: {
    findByMonth(monthId: number): Promise<BudgetGroup[]>;
    findById(id: number): Promise<BudgetGroup | null>;
    create(data: BudgetGroupCreate): Promise<BudgetGroup>;
    update(id: number, data: Partial<BudgetGroupCreate>): Promise<BudgetGroup | null>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=groupRepository.d.ts.map