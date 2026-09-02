import * as q from "../libs/query.js";
export const monthRepository = {
    async findAll() {
        return q.query("SELECT * FROM months ORDER BY created_at DESC");
    },
    async findByYear(yearId) {
        return q.query("SELECT * FROM months WHERE year_id = ? ORDER BY created_at DESC", [yearId]);
    },
    async findById(id) {
        return q.first("SELECT * FROM months WHERE id = ?", [id]);
    },
    async findByName(name) {
        return q.first("SELECT id FROM months WHERE name = ?", [name]);
    },
    async create(data) {
        const id = await q.insert("months", data);
        return (await q.first("SELECT * FROM months WHERE id = ?", [id]));
    },
    async update(id, data) {
        const updates = {};
        if (data.name !== undefined)
            updates.name = data.name;
        if (data.total_budget !== undefined)
            updates.total_budget = data.total_budget;
        if (Object.keys(updates).length > 0) {
            await q.update("months", updates, { id });
        }
        return q.first("SELECT * FROM months WHERE id = ?", [id]);
    },
    async delete(id) {
        await q.remove("months", { id });
    },
    async incrementIncome(id, amount) {
        await q.increment("months", "total_income", amount, { id });
    },
    async decrementIncome(id, amount) {
        await q.decrement("months", "total_income", amount, { id });
    },
};
//# sourceMappingURL=monthRepository.js.map