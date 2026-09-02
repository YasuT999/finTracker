import { yearRepository } from "../repositories/yearRepository.js";
import { monthRepository } from "../repositories/monthRepository.js";
import { groupRepository } from "../repositories/groupRepository.js";
import { categoryRepository } from "../repositories/categoryRepository.js";
import { transactionRepository } from "../repositories/transactionRepository.js";
export const dashboardController = {
    async summary(c) {
        const years = await yearRepository.findAll();
        let monthCount = 0;
        let totalTransactions = 0;
        let monthsOverBudget = 0;
        let totalExpensesAll = 0;
        let highestMonth = null;
        let lowestMonth = null;
        let highestGroup = null;
        let mostUtilizedCat = null;
        let leastUtilizedCat = null;
        for (const year of years) {
            const months = await monthRepository.findByYear(year.id);
            monthCount += months.length;
            for (const month of months) {
                const groups = await groupRepository.findByMonth(month.id);
                let monthExpenses = 0;
                for (const group of groups) {
                    const cats = await categoryRepository.findByGroup(group.id);
                    let groupExpenses = 0;
                    for (const cat of cats) {
                        const txns = await transactionRepository.findByCategory(cat.id);
                        const expenses = txns
                            .filter((t) => t.type === "expense")
                            .reduce((s, t) => s + Number(t.amount), 0);
                        totalTransactions += txns.length;
                        groupExpenses += expenses;
                        if (Number(cat.allocated_budget) > 0) {
                            const u = Math.round((expenses / Number(cat.allocated_budget)) * 10000) / 100;
                            if (!mostUtilizedCat || u > mostUtilizedCat.utilization) {
                                mostUtilizedCat = { name: cat.name, utilization: u, month: month.name };
                            }
                            if (!leastUtilizedCat || u < leastUtilizedCat.utilization) {
                                leastUtilizedCat = { name: cat.name, utilization: u, month: month.name };
                            }
                        }
                    }
                    monthExpenses += groupExpenses;
                    if (groupExpenses > (highestGroup?.amount ?? -1)) {
                        highestGroup = { name: group.name, amount: groupExpenses, month: month.name };
                    }
                }
                totalExpensesAll += monthExpenses;
                if (!highestMonth || monthExpenses > highestMonth.amount) {
                    highestMonth = { name: month.name, amount: monthExpenses };
                }
                if (!lowestMonth || monthExpenses < lowestMonth.amount) {
                    lowestMonth = { name: month.name, amount: monthExpenses };
                }
                if (monthExpenses > Number(month.total_budget)) {
                    monthsOverBudget++;
                }
            }
        }
        const avgMonthly = monthCount > 0 ? Math.round((totalExpensesAll / monthCount) * 100) / 100 : 0;
        return c.json({
            year_count: years.length,
            month_count: monthCount,
            total_transactions: totalTransactions,
            avg_monthly_spending: avgMonthly,
            highest_spend_month: highestMonth,
            lowest_spend_month: lowestMonth,
            months_over_budget: monthsOverBudget,
            highest_spend_group: highestGroup,
            most_utilized_category: mostUtilizedCat,
            least_utilized_category: leastUtilizedCat,
        });
    },
};
//# sourceMappingURL=dashboardController.js.map