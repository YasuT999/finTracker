import type { CategoryDetail } from "../types/index.js";
export declare const categoryService: {
    listByGroup(groupId: number): Promise<import("../types/index.js").Category[]>;
    getDetail(id: number): Promise<CategoryDetail | null>;
    create(data: {
        group_id: number;
        name: string;
        allocated_budget: number;
    }): Promise<import("../types/index.js").Category>;
    update(id: number, data: {
        name?: string;
        allocated_budget?: number;
    }): Promise<import("../types/index.js").Category>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=categoryService.d.ts.map