export interface Year {
  id: number;
  name: string;
  created_at: string;
}

export interface Month {
  id: number;
  year_id: number;
  name: string;
  total_budget: number;
  total_income: number;
  created_at: string;
}

export interface BudgetGroup {
  id: number;
  month_id: number;
  name: string;
  allocated_budget: number;
  created_at: string;
}

export interface Category {
  id: number;
  group_id: number;
  name: string;
  allocated_budget: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  category_id: number;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  created_at: string;
}

export interface YearCreate {
  name: string;
}

export interface MonthCreate {
  year_id: number;
  name: string;
  total_budget: number;
}

export interface BudgetGroupCreate {
  month_id: number;
  name: string;
  allocated_budget: number;
}

export interface CategoryCreate {
  group_id: number;
  name: string;
  allocated_budget: number;
}

export interface TransactionCreate {
  category_id: number;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
}

export interface GroupDetail extends BudgetGroup {
  actual_spending: number;
  remaining_budget: number;
  utilization_percentage: number;
  categories: CategorySummary[];
}

export interface CategorySummary {
  id: number;
  name: string;
  allocated_budget: number;
  actual_spending: number;
  remaining_budget: number;
  utilization_percentage: number;
}

export interface CategoryDetail extends Category {
  actual_spending: number;
  remaining_budget: number;
  utilization_percentage: number;
  transactions: Transaction[];
}

export interface GroupWithUtilization extends BudgetGroup {
  actual_spending: number;
  remaining_budget: number;
  utilization_percentage: number;
  categories: CategorySummary[];
}

export interface MonthSummary extends Month {
  total_expenses: number;
  remaining_budget: number;
  savings: number;
  utilization_percentage: number;
  groups: GroupWithUtilization[];
}
