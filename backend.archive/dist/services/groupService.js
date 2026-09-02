import { groupRepository } from "../repositories/groupRepository.js";
import { categoryRepository } from "../repositories/categoryRepository.js";
import { transactionRepository } from "../repositories/transactionRepository.js";
export const groupService = {
    async listByMonth(monthId) {
        const groups = await groupRepository.findByMonth(monthId);
        const result = [];
        for (const group of groups) {
            const categories = await categoryRepository.findByGroup(group.id);
            const catIds = categories.map((c) => c.id);
            const actualSpending = await transactionRepository.sumExpensesByCategories(catIds);
            const remaining = Number(group.allocated_budget) - actualSpending;
            const utilization = Number(group.allocated_budget) > 0
                ? (actualSpending / Number(group.allocated_budget)) * 100
                : 0;
            const catSummaries = [];
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
            result.push({
                ...group,
                actual_spending: actualSpending,
                remaining_budget: Math.max(0, remaining),
                utilization_percentage: Math.round(utilization * 100) / 100,
                categories: catSummaries,
            });
        }
        return result;
    },
    async getDetail(id) {
        const group = await groupRepository.findById(id);
        if (!group)
            return null;
        const categories = await categoryRepository.findByGroup(id);
        const catIds = categories.map((c) => c.id);
        const actualSpending = await transactionRepository.sumExpensesByCategories(catIds);
        const remaining = Number(group.allocated_budget) - actualSpending;
        const utilization = Number(group.allocated_budget) > 0
            ? (actualSpending / Number(group.allocated_budget)) * 100
            : 0;
        const catSummaries = [];
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
        return {
            ...group,
            actual_spending: actualSpending,
            remaining_budget: Math.max(0, remaining),
            utilization_percentage: Math.round(utilization * 100) / 100,
            categories: catSummaries,
        };
    },
    async create(data) {
        return groupRepository.create(data);
    },
    async update(id, data) {
        const group = await groupRepository.update(id, data);
        if (!group)
            throw Object.assign(new Error("Group not found"), { status: 404 });
        return group;
    },
    async delete(id) {
        await groupRepository.delete(id);
    },
};
//# sourceMappingURL=groupService.js.map