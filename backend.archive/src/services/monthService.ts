import { monthRepository } from "../repositories/monthRepository.js";
import { groupRepository } from "../repositories/groupRepository.js";
import { categoryRepository } from "../repositories/categoryRepository.js";
import { transactionRepository } from "../repositories/transactionRepository.js";
import type { MonthSummary, GroupWithUtilization, CategorySummary } from "../types/index.js";

export const monthService = {
  async list() {
    return monthRepository.findAll();
  },

  async listByYear(yearId: number) {
    return monthRepository.findByYear(yearId);
  },

  async getSummary(id: number): Promise<MonthSummary | null> {
    const month = await monthRepository.findById(id);
    if (!month) return null;

    const rawGroups = await groupRepository.findByMonth(id);
    const groups: GroupWithUtilization[] = [];
    let totalExpenses = 0;

    for (const group of rawGroups) {
      const categories = await categoryRepository.findByGroup(group.id);
      const catIds = categories.map((c) => c.id);
      const groupExpenses = await transactionRepository.sumExpensesByCategories(catIds);
      totalExpenses += groupExpenses;

      const groupUtilization = Number(group.allocated_budget) > 0
        ? (groupExpenses / Number(group.allocated_budget)) * 100
        : 0;

      const catSummaries: CategorySummary[] = [];
      for (const cat of categories) {
        const spent = await transactionRepository.sumExpensesByCategory(cat.id);
        catSummaries.push({
          id: cat.id,
          name: cat.name,
          allocated_budget: Number(cat.allocated_budget),
          actual_spending: spent,
          remaining_budget: Math.max(0, Number(cat.allocated_budget) - spent),
          utilization_percentage: Number(cat.allocated_budget) > 0
            ? Math.round((spent / Number(cat.allocated_budget)) * 10000) / 100
            : 0,
        });
      }

      groups.push({
        ...group,
        actual_spending: groupExpenses,
        remaining_budget: Math.max(0, Number(group.allocated_budget) - groupExpenses),
        utilization_percentage: Math.round(groupUtilization * 100) / 100,
        categories: catSummaries,
      });
    }

    const remaining = Number(month.total_budget) - totalExpenses;
    const savings = Number(month.total_income) - totalExpenses;
    const utilization = Number(month.total_budget) > 0
      ? (totalExpenses / Number(month.total_budget)) * 100
      : 0;

    return {
      ...month,
      total_expenses: totalExpenses,
      remaining_budget: Math.max(0, remaining),
      savings: Math.max(0, savings),
      utilization_percentage: Math.round(utilization * 100) / 100,
      groups,
    };
  },

  async create(data: { year_id: number; name: string; total_budget: number }) {
    const existing = await monthRepository.findByName(data.name);
    if (existing) throw Object.assign(new Error("Month already exists"), { status: 400 });
    return monthRepository.create(data);
  },

  async update(id: number, data: { name?: string; total_budget?: number }) {
    const month = await monthRepository.update(id, data);
    if (!month) throw Object.assign(new Error("Month not found"), { status: 404 });
    return month;
  },

  async delete(id: number) {
    await monthRepository.delete(id);
  },

  async copy(sourceId: number, newMonthName: string) {
    const sourceMonth = await monthRepository.findById(sourceId);
    if (!sourceMonth) throw Object.assign(new Error("Source month not found"), { status: 404 });

    const existing = await monthRepository.findByName(newMonthName);
    if (existing) throw Object.assign(new Error("Month already exists"), { status: 400 });

    const newMonth = await monthRepository.create({
      year_id: Number(sourceMonth.year_id),
      name: newMonthName,
      total_budget: Number(sourceMonth.total_budget),
    });

    const groups = await groupRepository.findByMonth(sourceId);
    for (const group of groups) {
      const newGroup = await groupRepository.create({
        month_id: newMonth.id,
        name: group.name,
        allocated_budget: Number(group.allocated_budget),
      });

      const categories = await categoryRepository.findByGroup(group.id);
      for (const cat of categories) {
        await categoryRepository.create({
          group_id: newGroup.id,
          name: cat.name,
          allocated_budget: Number(cat.allocated_budget),
        });
      }
    }

    return newMonth;
  },
};
