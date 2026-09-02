export declare function query(sql: string, params?: any[]): Promise<any[]>;
export declare function first(sql: string, params?: any[]): Promise<any | null>;
export declare function execute(sql: string, params?: any[]): Promise<{
    changes: number;
    lastInsertRowid: number;
}>;
export declare function insert(table: string, data: Record<string, any>): Promise<number>;
export declare function update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<void>;
export declare function remove(table: string, where: Record<string, any>): Promise<void>;
export declare function increment(table: string, column: string, amount: number, where: Record<string, any>): Promise<void>;
export declare function decrement(table: string, column: string, amount: number, where: Record<string, any>): Promise<void>;
export declare function runMigrations(): Promise<void>;
//# sourceMappingURL=query.d.ts.map