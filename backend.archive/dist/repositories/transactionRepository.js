import * as q from "../libs/query.js";
export const transactionRepository = {
    async findByCategory(categoryId) {
        return q.query("SELECT * FROM transactions WHERE category_id = ? ORDER BY date DESC", [categoryId]);
    },
    async findById(id) {
        return q.first("SELECT * FROM transactions WHERE id = ?", [id]);
    },
    async create(data) {
        const id = await q.insert("transactions", data);
        return (await q.first("SELECT * FROM transactions WHERE id = ?", [id]));
    },
    async update(id, data) {
        const updates = {};
        if (data.amount !== undefined)
            updates.amount = data.amount;
        if (data.type !== undefined)
            updates.type = data.type;
        if (data.description !== undefined)
            updates.description = data.description;
        if (data.date !== undefined)
            updates.date = data.date;
        if (Object.keys(updates).length > 0) {
            await q.update("transactions", updates, { id });
        }
        return q.first("SELECT * FROM transactions WHERE id = ?", [id]);
    },
    async delete(id) {
        await q.remove("transactions", { id });
    },
    async sumExpensesByCategory(categoryId) {
        const row = await q.first("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id = ? AND type = 'expense'", [categoryId]);
        return row?.total || 0;
    },
    async sumExpensesByCategories(categoryIds) {
        if (categoryIds.length === 0)
            return 0;
        const placeholders = categoryIds.map(() => "?").join(",");
        const row = await q.first(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id IN (${placeholders}) AND type = 'expense'`, categoryIds);
        return row?.total || 0;
    },
};
//# sourceMappingURL=transactionRepository.js.map