import type { Category, CategoryCreate } from "../types/index.js";
export declare const categoryRepository: {
    findByGroup(groupId: number): Promise<Category[]>;
    findById(id: number): Promise<Category | null>;
    create(data: CategoryCreate): Promise<Category>;
    update(id: number, data: Partial<CategoryCreate>): Promise<Category | null>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=categoryRepository.d.ts.map