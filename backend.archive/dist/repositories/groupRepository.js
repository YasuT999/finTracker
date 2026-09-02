import * as q from "../libs/query.js";
export const groupRepository = {
    async findByMonth(monthId) {
        return q.query("SELECT * FROM budget_groups WHERE month_id = ?", [monthId]);
    },
    async findById(id) {
        return q.first("SELECT * FROM budget_groups WHERE id = ?", [id]);
    },
    async create(data) {
        const id = await q.insert("budget_groups", data);
        return (await q.first("SELECT * FROM budget_groups WHERE id = ?", [id]));
    },
    async update(id, data) {
        const updates = {};
        if (data.name !== undefined)
            updates.name = data.name;
        if (data.allocated_budget !== undefined)
            updates.allocated_budget = data.allocated_budget;
        if (Object.keys(updates).length > 0) {
            await q.update("budget_groups", updates, { id });
        }
        return q.first("SELECT * FROM budget_groups WHERE id = ?", [id]);
    },
    async delete(id) {
        await q.remove("budget_groups", { id });
    },
};
//# sourceMappingURL=groupRepository.js.map