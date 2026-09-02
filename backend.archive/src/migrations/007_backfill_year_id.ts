export const migration = {
  name: "007_backfill_year_id",
  up: `
    INSERT OR IGNORE INTO years (name) VALUES ('2026');
    UPDATE months SET year_id = (SELECT id FROM years WHERE name = '2026') WHERE year_id IS NULL;
  `,
  down: `UPDATE months SET year_id = NULL WHERE year_id = (SELECT id FROM years WHERE name = '2026');`,
};
