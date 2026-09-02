import type { Year, YearCreate } from "../types/index.js";
export declare const yearRepository: {
    findAll(): Promise<Year[]>;
    findById(id: number): Promise<Year | null>;
    findByName(name: string): Promise<Year | null>;
    create(data: YearCreate): Promise<Year>;
    delete(id: number): Promise<void>;
};
//# sourceMappingURL=yearRepository.d.ts.map