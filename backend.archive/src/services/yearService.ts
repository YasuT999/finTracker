import { yearRepository } from "../repositories/yearRepository.js";
import { monthRepository } from "../repositories/monthRepository.js";
import { groupRepository } from "../repositories/groupRepository.js";
import { categoryRepository } from "../repositories/categoryRepository.js";
import { transactionRepository } from "../repositories/transactionRepository.js";

export const yearService = {
  async list() {
    return yearRepository.findAll();
  },

  async create(data: { name: string }) {
    const existing = await yearRepository.findByName(data.name);
    if (existing) throw Object.assign(new Error("Year already exists"), { status: 400 });
    return yearRepository.create(data);
  },

  async delete(id: number) {
    await yearRepository.delete(id);
  },

  async getData(id: number) {
    const year = await yearRepository.findById(id);
    if (!year) return null;

    const months = await monthRepository.findByYear(id);
    const monthData = [];

    for (const month of months) {
      const rawGroups = await groupRepository.findByMonth(month.id);
      const groups = [];

      for (const group of rawGroups) {
        const rawCategories = await categoryRepository.findByGroup(group.id);
        const catIds = rawCategories.map((c) => c.id);
        const groupActual = await transactionRepository.sumExpensesByCategories(catIds);
        const categories = [];

        for (const cat of rawCategories) {
          const transactions = await transactionRepository.findByCategory(cat.id);
          const spent = transactions
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + Number(t.amount), 0);
          categories.push({
            id: cat.id,
            name: cat.name,
            allocated_budget: Number(cat.allocated_budget),
            actual_spending: spent,
            remaining_budget: Math.max(0, Number(cat.allocated_budget) - spent),
            utilization_percentage: Number(cat.allocated_budget) > 0
              ? Math.round((spent / Number(cat.allocated_budget)) * 10000) / 100
              : 0,
            transactions: transactions.map((t) => ({
              id: t.id,
              amount: Number(t.amount),
              description: t.description,
              date: t.date,
            })),
          });
        }

        groups.push({
          id: group.id,
          name: group.name,
          allocated_budget: Number(group.allocated_budget),
          actual_spending: groupActual,
          remaining_budget: Math.max(0, Number(group.allocated_budget) - groupActual),
          utilization_percentage: Number(group.allocated_budget) > 0
            ? Math.round((groupActual / Number(group.allocated_budget)) * 10000) / 100
            : 0,
          categories,
        });
      }

      const totalExpenses = groups.reduce((s, g) => s + g.actual_spending, 0);
      monthData.push({
        id: month.id,
        name: month.name,
        total_budget: Number(month.total_budget),
        total_expenses: totalExpenses,
        remaining_budget: Math.max(0, Number(month.total_budget) - totalExpenses),
        utilization_percentage: Number(month.total_budget) > 0
          ? Math.round((totalExpenses / Number(month.total_budget)) * 10000) / 100
          : 0,
        groups,
      });
    }

    const yearTotalBudget = monthData.reduce((s, m) => s + m.total_budget, 0);
    const yearTotalExpenses = monthData.reduce((s, m) => s + m.total_expenses, 0);

    return {
      year: { id: year.id, name: year.name },
      summary: {
        total_budget: yearTotalBudget,
        total_expenses: yearTotalExpenses,
        remaining_budget: Math.max(0, yearTotalBudget - yearTotalExpenses),
        utilization_percentage: yearTotalBudget > 0
          ? Math.round((yearTotalExpenses / yearTotalBudget) * 10000) / 100
          : 0,
        month_count: monthData.length,
      },
      months: monthData,
    };
  },
};
