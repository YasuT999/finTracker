import type { Transaction } from "../types/index.js";
export declare const transactionService: {
    listByCategory(categoryId: number): Promise<Transaction[]>;
    create(data: {
        category_id: number;
        amount: number;
        type: "income" | "expense";
        description: string;
        date: string;
    }): Promise<Transaction>;
    update(id: number, data: Partial<{
        amount: number;
        type: "income" | "expense";
        description: string;
        date: string;
    }>): Promise<Transaction>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=transactionService.d.ts.map