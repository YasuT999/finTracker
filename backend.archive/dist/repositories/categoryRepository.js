import * as q from "../libs/query.js";
export const categoryRepository = {
    async findByGroup(groupId) {
        return q.query("SELECT * FROM categories WHERE group_id = ?", [groupId]);
    },
    async findById(id) {
        return q.first("SELECT * FROM categories WHERE id = ?", [id]);
    },
    async create(data) {
        const id = await q.insert("categories", data);
        return (await q.first("SELECT * FROM categories WHERE id = ?", [id]));
    },
    async update(id, data) {
        const updates = {};
        if (data.name !== undefined)
            updates.name = data.name;
        if (data.allocated_budget !== undefined)
            updates.allocated_budget = data.allocated_budget;
        if (Object.keys(updates).length > 0) {
            await q.update("categories", updates, { id });
        }
        return q.first("SELECT * FROM categories WHERE id = ?", [id]);
    },
    async delete(id) {
        await q.remove("categories", { id });
    },
};
//# sourceMappingURL=categoryRepository.js.map