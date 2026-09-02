import type { Transaction, TransactionCreate } from "../types/index.js";
export declare const transactionRepository: {
    findByCategory(categoryId: number): Promise<Transaction[]>;
    findById(id: number): Promise<Transaction | null>;
    create(data: TransactionCreate): Promise<Transaction>;
    update(id: number, data: Partial<TransactionCreate>): Promise<Transaction | null>;
    delete(id: number): Promise<void>;
    sumExpensesByCategory(categoryId: number): Promise<number>;
    sumExpensesByCategories(categoryIds: number[]): Promise<number>;
};
//# sourceMappingURL=transactionRepository.d.ts.map