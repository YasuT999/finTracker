import * as q from "../libs/query.js";
export const yearRepository = {
    async findAll() {
        return q.query("SELECT * FROM years ORDER BY name DESC");
    },
    async findById(id) {
        return q.first("SELECT * FROM years WHERE id = ?", [id]);
    },
    async findByName(name) {
        return q.first("SELECT id FROM years WHERE name = ?", [name]);
    },
    async create(data) {
        const id = await q.insert("years", data);
        return (await q.first("SELECT * FROM years WHERE id = ?", [id]));
    },
    async delete(id) {
        await q.remove("years", { id });
    },
};
//# sourceMappingURL=yearRepository.js.map