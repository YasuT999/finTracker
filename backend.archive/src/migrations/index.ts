import { migration as m001 } from "./001_create_months.js";
import { migration as m002 } from "./002_create_budget_groups.js";
import { migration as m003 } from "./003_create_categories.js";
import { migration as m004 } from "./004_create_transactions.js";
import { migration as m005 } from "./005_create_years.js";
import { migration as m006 } from "./006_add_year_id_to_months.js";
import { migration as m007 } from "./007_backfill_year_id.js";

export const MIGRATIONS = [m001, m002, m003, m004, m005, m006, m007];
