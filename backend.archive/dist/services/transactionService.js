import { transactionRepository } from "../repositories/transactionRepository.js";
export const transactionService = {
    async listByCategory(categoryId) {
        return transactionRepository.findByCategory(categoryId);
    },
    async create(data) {
        return transactionRepository.create(data);
    },
    async update(id, data) {
        const oldTx = await transactionRepository.findById(id);
        if (!oldTx)
            throw Object.assign(new Error("Transaction not found"), { status: 404 });
        const updated = await transactionRepository.update(id, data);
        return updated;
    },
    async delete(id) {
        const tx = await transactionRepository.findById(id);
        if (!tx)
            throw Object.assign(new Error("Transaction not found"), { status: 404 });
        await transactionRepository.delete(id);
    },
};
//# sourceMappingURL=transactionService.js.map