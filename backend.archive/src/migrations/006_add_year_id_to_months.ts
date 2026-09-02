export const migration = {
  name: "006_add_year_id_to_months",
  up: `ALTER TABLE months ADD COLUMN year_id INTEGER DEFAULT NULL;`,
  down: `ALTER TABLE months DROP COLUMN year_id;`,
};
