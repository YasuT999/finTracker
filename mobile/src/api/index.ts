import type { Year, Month, MonthSummary, BudgetGroup, GroupDetail, Category, CategoryDetail, Transaction } from "../types";
import type { DashboardSummary } from "../types";
import { dashboardService } from "../services/dashboardService";
import { yearService } from "../services/yearService";
import { monthService } from "../services/monthService";
import { groupService } from "../services/groupService";
import { categoryService } from "../services/categoryService";
import { transactionService } from "../services/transactionService";
import { getDb } from "../db";

// local-only shim: same shape as frontend/src/utils/api.ts but calls services directly, no fetch
export const api = {
  dashboard: {
    summary: (): Promise<DashboardSummary> => dashboardService.summary(),
  },
  years: {
    list: (): Promise<Year[]> => yearService.list(),
    getData: (id: number) => yearService.getData(id),
    create: (data: { name: string }): Promise<Year> => yearService.create(data),
    delete: async (id: number): Promise<{ success: boolean }> => {
      await yearService.delete(id);
      return { success: true };
    },
  },
  months: {
    list: (): Promise<Month[]> => monthService.list(),
    listByYear: (yearId: number): Promise<Month[]> => monthService.listByYear(yearId),
    get: (id: number): Promise<MonthSummary> =>
      monthService.getSummary(id).then((m) => {
        if (!m) throw new Error("Month not found");
        return m;
      }),
    create: (data: { year_id: number; name: string; total_budget: number }): Promise<Month> => monthService.create(data),
    update: (id: number, data: Partial<{ name: string; total_budget: number }>): Promise<Month> => monthService.update(id, data),
    delete: async (id: number): Promise<{ success: boolean }> => {
      await monthService.delete(id);
      return { success: true };
    },
    copy: (id: number, newMonthName: string): Promise<Month> => monthService.copy(id, newMonthName),
  },
  groups: {
    listByMonth: (monthId: number): Promise<GroupDetail[]> => groupService.listByMonth(monthId),
    get: (id: number): Promise<GroupDetail> =>
      groupService.getDetail(id).then((g) => {
        if (!g) throw new Error("Group not found");
        return g;
      }),
    create: (data: { month_id: number; name: string; allocated_budget: number }): Promise<BudgetGroup> => groupService.create(data),
    update: (id: number, data: Partial<{ name: string; allocated_budget: number }>): Promise<BudgetGroup> => groupService.update(id, data),
    delete: async (id: number): Promise<{ success: boolean }> => {
      await groupService.delete(id);
      return { success: true };
    },
  },
  categories: {
    listByGroup: (groupId: number): Promise<Category[]> => categoryService.listByGroup(groupId),
    get: (id: number): Promise<CategoryDetail> =>
      categoryService.getDetail(id).then((c) => {
        if (!c) throw new Error("Category not found");
        return c;
      }),
    create: (data: { group_id: number; name: string; allocated_budget: number }): Promise<Category> => categoryService.create(data),
    update: (id: number, data: Partial<{ name: string; allocated_budget: number }>): Promise<Category> => categoryService.update(id, data),
    delete: async (id: number): Promise<{ success: boolean }> => {
      await categoryService.delete(id);
      return { success: true };
    },
  },
  transactions: {
    listByCategory: (categoryId: number): Promise<Transaction[]> => transactionService.listByCategory(categoryId),
    create: (data: { category_id: number; amount: number; type: "income" | "expense"; description: string; date: string }): Promise<Transaction> =>
      transactionService.create(data),
    update: (id: number, data: Partial<{ amount: number; type: "income" | "expense"; description: string; date: string }>): Promise<Transaction> =>
      transactionService.update(id, data),
    delete: async (id: number): Promise<{ success: boolean }> => {
      await transactionService.delete(id);
      return { success: true };
    },
  },
  data: {
    clear: async (): Promise<{ success: boolean }> => {
      const db = await getDb();
      await db.execAsync("DELETE FROM transactions; DELETE FROM categories; DELETE FROM budget_groups; DELETE FROM months; DELETE FROM years;");
      return { success: true };
    },
  },
};
