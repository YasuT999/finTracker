export interface ValidationError {
    field: string;
    message: string;
}
export declare function validateRequired(value: any, field: string): ValidationError | null;
export declare function validatePositiveNumber(value: any, field: string): ValidationError | null;
export declare function validateYearInput(body: any): ValidationError[];
export declare function validateMonthInput(body: any): ValidationError[];
export declare function validateGroupInput(body: any): ValidationError[];
export declare function validateCategoryInput(body: any): ValidationError[];
export declare function validateTransactionInput(body: any): ValidationError[];
//# sourceMappingURL=index.d.ts.map