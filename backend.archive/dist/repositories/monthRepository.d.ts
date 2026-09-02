import type { Month, MonthCreate } from "../types/index.js";
export declare const monthRepository: {
    findAll(): Promise<Month[]>;
    findByYear(yearId: number): Promise<Month[]>;
    findById(id: number): Promise<Month | null>;
    findByName(name: string): Promise<Month | null>;
    create(data: MonthCreate): Promise<Month>;
    update(id: number, data: Partial<MonthCreate>): Promise<Month | null>;
    delete(id: number): Promise<void>;
    incrementIncome(id: number, amount: number): Promise<void>;
    decrementIncome(id: number, amount: number): Promise<void>;
};
//# sourceMappingURL=monthRepository.d.ts.map