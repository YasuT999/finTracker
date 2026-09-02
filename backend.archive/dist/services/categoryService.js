import { categoryRepository } from "../repositories/categoryRepository.js";
import { transactionRepository } from "../repositories/transactionRepository.js";
export const categoryService = {
    async listByGroup(groupId) {
        return categoryRepository.findByGroup(groupId);
    },
    async getDetail(id) {
        const category = await categoryRepository.findById(id);
        if (!category)
            return null;
        const transactions = await transactionRepository.findByCategory(id);
        const expenses = transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const remaining = Number(category.allocated_budget) - expenses;
        const utilization = Number(category.allocated_budget) > 0
            ? (expenses / Number(category.allocated_budget)) * 100
            : 0;
        return {
            ...category,
            actual_spending: expenses,
            remaining_budget: Math.max(0, remaining),
            utilization_percentage: Math.round(utilization * 100) / 100,
            transactions,
        };
    },
    async create(data) {
        return categoryRepository.create(data);
    },
    async update(id, data) {
        const category = await categoryRepository.update(id, data);
        if (!category)
            throw Object.assign(new Error("Category not found"), { status: 404 });
        return category;
    },
    async delete(id) {
        await categoryRepository.delete(id);
    },
};
//# sourceMappingURL=categoryService.js.map