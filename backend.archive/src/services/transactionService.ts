import { transactionRepository } from "../repositories/transactionRepository.js";
import type { Transaction } from "../types/index.js";

export const transactionService = {
  async listByCategory(categoryId: number) {
    return transactionRepository.findByCategory(categoryId);
  },

  async create(data: {
    category_id: number;
    amount: number;
    type: "income" | "expense";
    description: string;
    date: string;
  }): Promise<Transaction> {
    return transactionRepository.create(data);
  },

  async update(
    id: number,
    data: Partial<{
      amount: number;
      type: "income" | "expense";
      description: string;
      date: string;
    }>
  ): Promise<Transaction> {
    const oldTx = await transactionRepository.findById(id);
    if (!oldTx) throw Object.assign(new Error("Transaction not found"), { status: 404 });

    const updated = await transactionRepository.update(id, data);
    return updated!;
  },

  async delete(id: number) {
    const tx = await transactionRepository.findById(id);
    if (!tx) throw Object.assign(new Error("Transaction not found"), { status: 404 });

    await transactionRepository.delete(id);
  },
};
