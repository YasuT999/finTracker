# FinTracker Backend

REST API for the Financial Tracker MVP. Built with **Hono**, **TypeScript**, and **sql.js** (SQLite).

## Setup

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3001`. Database migrations run automatically on startup.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled JS |

## Database

SQLite file stored at `data/finance.db` (auto-created). No external database setup needed.

### Schema

```
months
  ├── budget_groups
  │     └── categories
  │           └── transactions
```

## API Endpoints

### Months

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/months` | List all months |
| `GET` | `/api/months/:id` | Month summary (with groups, expenses, utilization) |
| `POST` | `/api/months` | Create month `{ name, total_budget }` |
| `PUT` | `/api/months/:id` | Update month |
| `DELETE` | `/api/months/:id` | Delete month |
| `POST` | `/api/months/:id/copy` | Copy month structure `{ newMonthName }` |

### Budget Groups

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/groups/month/:monthId` | List groups for a month (with spending) |
| `GET` | `/api/groups/:id` | Group detail (with categories + spending) |
| `POST` | `/api/groups` | Create group `{ month_id, name, allocated_budget }` |
| `PUT` | `/api/groups/:id` | Update group |
| `DELETE` | `/api/groups/:id` | Delete group |

### Categories

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/categories/group/:groupId` | List categories in a group |
| `GET` | `/api/categories/:id` | Category detail (with transactions) |
| `POST` | `/api/categories` | Create category `{ group_id, name, allocated_budget }` |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

### Transactions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transactions/category/:categoryId` | List transactions for a category |
| `POST` | `/api/transactions` | Create transaction `{ category_id, amount, type, description, date }` |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |

## Calculations

All monetary values are computed server-side:

```
Remaining Budget  = Allocated Budget - Expenses
Utilization %     = (Expenses / Budget) × 100
Savings           = Income - Expenses
```

Income transactions automatically update the parent month's `total_income`.
