export interface ValidationError {
  field: string;
  message: string;
}

export function validateRequired(value: any, field: string): ValidationError | null {
  if (value === undefined || value === null || value === "") {
    return { field, message: `${field} is required` };
  }
  return null;
}

export function validatePositiveNumber(value: any, field: string): ValidationError | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { field, message: `${field} must be a positive number` };
  }
  return null;
}

export function validateYearInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameErr = validateRequired(body.name, "name");
  if (nameErr) errors.push(nameErr);
  return errors;
}

export function validateMonthInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameErr = validateRequired(body.name, "name");
  if (nameErr) errors.push(nameErr);
  const yearIdErr = validateRequired(body.year_id, "year_id");
  if (yearIdErr) errors.push(yearIdErr);
  const budgetErr = validatePositiveNumber(body.total_budget, "total_budget");
  if (budgetErr) errors.push(budgetErr);
  return errors;
}

export function validateGroupInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameErr = validateRequired(body.name, "name");
  if (nameErr) errors.push(nameErr);
  const monthIdErr = validateRequired(body.month_id, "month_id");
  if (monthIdErr) errors.push(monthIdErr);
  const budgetErr = validatePositiveNumber(body.allocated_budget, "allocated_budget");
  if (budgetErr) errors.push(budgetErr);
  return errors;
}

export function validateCategoryInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameErr = validateRequired(body.name, "name");
  if (nameErr) errors.push(nameErr);
  const groupIdErr = validateRequired(body.group_id, "group_id");
  if (groupIdErr) errors.push(groupIdErr);
  const budgetErr = validatePositiveNumber(body.allocated_budget, "allocated_budget");
  if (budgetErr) errors.push(budgetErr);
  return errors;
}

export function validateTransactionInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const amountErr = validateRequired(body.amount, "amount");
  if (amountErr) errors.push(amountErr);
  if (body.amount !== undefined && (isNaN(Number(body.amount)) || Number(body.amount) <= 0)) {
    errors.push({ field: "amount", message: "amount must be a positive number" });
  }
  const catIdErr = validateRequired(body.category_id, "category_id");
  if (catIdErr) errors.push(catIdErr);
  const typeErr = validateRequired(body.type, "type");
  if (typeErr) errors.push(typeErr);
  if (body.type && !["income", "expense"].includes(body.type)) {
    errors.push({ field: "type", message: "type must be 'income' or 'expense'" });
  }
  const descErr = validateRequired(body.description, "description");
  if (descErr) errors.push(descErr);
  const dateErr = validateRequired(body.date, "date");
  if (dateErr) errors.push(dateErr);
  return errors;
}
