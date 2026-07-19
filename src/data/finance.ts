export type FinanceTransaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  status: "done" | "pending";
  reminderDate?: string;
  notes?: string;
  source?: "manual" | "receipt_scan";
  receiptReference?: string;
  documentReference?: string;
  originalTotal?: number;
  reimbursementAmount?: number;
  aiConfidence?: number;
  completedAt?: string;
};

export function isFinanceTransaction(
  value: unknown
): value is FinanceTransaction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const transaction = value as Partial<FinanceTransaction>;

  return (
    typeof transaction.id === "string" &&
    transaction.id.length > 0 &&
    typeof transaction.title === "string" &&
    typeof transaction.category === "string" &&
    typeof transaction.amount === "number" &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0 &&
    (transaction.type === "income" || transaction.type === "expense") &&
    typeof transaction.date === "string" &&
    (transaction.status === "done" || transaction.status === "pending") &&
    (transaction.reminderDate === undefined ||
      typeof transaction.reminderDate === "string") &&
    (transaction.notes === undefined || typeof transaction.notes === "string") &&
    (transaction.source === undefined ||
      transaction.source === "manual" ||
      transaction.source === "receipt_scan") &&
    (transaction.receiptReference === undefined ||
      typeof transaction.receiptReference === "string") &&
    (transaction.documentReference === undefined ||
      typeof transaction.documentReference === "string") &&
    (transaction.originalTotal === undefined ||
      typeof transaction.originalTotal === "number") &&
    (transaction.reimbursementAmount === undefined ||
      typeof transaction.reimbursementAmount === "number") &&
    (transaction.aiConfidence === undefined ||
      typeof transaction.aiConfidence === "number") &&
    (transaction.completedAt === undefined ||
      typeof transaction.completedAt === "string")
  );
}

export type CategoryReportItem = {
  category: string;
  total: number;
  count: number;
  percentage: number;
};

export type MonthlyCashflowItem = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  balance: number;
};

export type MonthlyBudget = {
  category: string;
  limit: number;
};

export type BudgetReportItem = {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "over";
};

export type SmartFinanceInsight = {
  id: string;
  title: string;
  description: string;
  tone: "good" | "warning" | "danger" | "info";
};

export const monthlyBudgets: MonthlyBudget[] = [
  {
    category: "דיור",
    limit: 4500,
  },
  {
    category: "מזון",
    limit: 3000,
  },
  {
    category: "חשבונות",
    limit: 1200,
  },
  {
    category: "רכב",
    limit: 2200,
  },
];

export const initialFinanceTransactions: FinanceTransaction[] = [
  {
    id: "1",
    title: "משכורת",
    category: "הכנסה",
    amount: 15000,
    type: "income",
    date: "2026-01-01",
    status: "done",
  },
  {
    id: "2",
    title: "שכירות",
    category: "דיור",
    amount: 4200,
    type: "expense",
    date: "2026-01-02",
    status: "done",
  },
  {
    id: "3",
    title: "קניות לבית",
    category: "מזון",
    amount: 950,
    type: "expense",
    date: "2026-01-04",
    status: "done",
  },
  {
    id: "4",
    title: "משכורת",
    category: "הכנסה",
    amount: 15000,
    type: "income",
    date: "2026-02-01",
    status: "done",
  },
  {
    id: "5",
    title: "חשבונות",
    category: "חשבונות",
    amount: 780,
    type: "expense",
    date: "2026-02-10",
    status: "done",
  },
  {
    id: "6",
    title: "קניות לבית",
    category: "מזון",
    amount: 1200,
    type: "expense",
    date: "2026-02-12",
    status: "done",
  },
  {
    id: "7",
    title: "משכורת",
    category: "הכנסה",
    amount: 15000,
    type: "income",
    date: "2026-03-01",
    status: "done",
  },
  {
    id: "8",
    title: "רכב",
    category: "רכב",
    amount: 1650,
    type: "expense",
    date: "2026-03-09",
    status: "done",
  },
  {
    id: "9",
    title: "קניות לבית",
    category: "מזון",
    amount: 980,
    type: "expense",
    date: "2026-03-13",
    status: "done",
  },
  {
    id: "10",
    title: "משכורת",
    category: "הכנסה",
    amount: 15000,
    type: "income",
    date: "2026-04-01",
    status: "done",
  },
  {
    id: "11",
    title: "שכירות",
    category: "דיור",
    amount: 4200,
    type: "expense",
    date: "2026-04-02",
    status: "done",
  },
  {
    id: "12",
    title: "טיפול רכב",
    category: "רכב",
    amount: 850,
    type: "expense",
    date: "2026-04-18",
    status: "done",
  },
  {
    id: "13",
    title: "משכורת",
    category: "הכנסה",
    amount: 15000,
    type: "income",
    date: "2026-05-01",
    status: "done",
  },
  {
    id: "14",
    title: "קניות לבית",
    category: "מזון",
    amount: 1350,
    type: "expense",
    date: "2026-05-06",
    status: "done",
  },
  {
    id: "15",
    title: "חשמל",
    category: "חשבונות",
    amount: 430,
    type: "expense",
    date: "2026-05-14",
    status: "done",
  },
  {
    id: "16",
    title: "משכורת",
    category: "הכנסה",
    amount: 15000,
    type: "income",
    date: "2026-06-01",
    status: "done",
  },
  {
    id: "17",
    title: "שכירות",
    category: "דיור",
    amount: 4200,
    type: "expense",
    date: "2026-06-02",
    status: "done",
  },
  {
    id: "18",
    title: "מים",
    category: "חשבונות",
    amount: 190,
    type: "expense",
    date: "2026-06-12",
    status: "pending",
  },
];

export function getFinanceStats(transactions: FinanceTransaction[]) {
  // הכנסות/הוצאות/יתרה נספרות רק מפעולות שבוצעו — תשלום עתידי שעדיין
  // לא קרה לא אמור להזיז את היתרה המוצגת.
  const completedTransactions = transactions.filter(
    (item) => item.status === "done"
  );

  const income = completedTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = completedTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const pendingPayments = transactions.filter(
    (item) => item.status === "pending"
  ).length;

  return {
    income,
    expenses,
    balance: income - expenses,
    pendingPayments,
    totalTransactions: transactions.length,
  };
}

export function getExpenseCategoryReport(
  transactions: FinanceTransaction[]
): CategoryReportItem[] {
  const expenseTransactions = transactions.filter(
    (item) => item.type === "expense"
  );

  const totalExpenses = expenseTransactions.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const categoryMap = new Map<string, { total: number; count: number }>();

  expenseTransactions.forEach((item) => {
    const current = categoryMap.get(item.category) ?? {
      total: 0,
      count: 0,
    };

    categoryMap.set(item.category, {
      total: current.total + item.amount,
      count: current.count + 1,
    });
  });

  return Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      total: value.total,
      count: value.count,
      percentage:
        totalExpenses === 0
          ? 0
          : Math.round((value.total / totalExpenses) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyCashflowReport(
  transactions: FinanceTransaction[]
): MonthlyCashflowItem[] {
  const monthMap = new Map<string, { income: number; expenses: number }>();

  transactions.forEach((item) => {
    const month = item.date.slice(0, 7);

    const current = monthMap.get(month) ?? {
      income: 0,
      expenses: 0,
    };

    monthMap.set(month, {
      income: current.income + (item.type === "income" ? item.amount : 0),
      expenses: current.expenses + (item.type === "expense" ? item.amount : 0),
    });
  });

  return Array.from(monthMap.entries())
    .map(([month, value]) => ({
      month,
      label: formatMonthLabel(month),
      income: value.income,
      expenses: value.expenses,
      balance: value.income - value.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getBudgetReport(
  transactions: FinanceTransaction[],
  budgets: MonthlyBudget[] = monthlyBudgets
): BudgetReportItem[] {
  const latestMonth = getLatestMonth(transactions);

  const currentMonthExpenses = transactions.filter(
    (item) => item.type === "expense" && item.date.startsWith(latestMonth)
  );

  const spentByCategory = new Map<string, number>();

  currentMonthExpenses.forEach((item) => {
    const currentAmount = spentByCategory.get(item.category) ?? 0;
    spentByCategory.set(item.category, currentAmount + item.amount);
  });

  const allCategories = new Set<string>([
    ...budgets.map((budget) => budget.category),
    ...Array.from(spentByCategory.keys()),
  ]);

  return Array.from(allCategories)
    .map((category) => {
      const budget = budgets.find((item) => item.category === category);
      const limit = budget?.limit ?? 0;
      const spent = spentByCategory.get(category) ?? 0;
      const remaining = limit - spent;
      const percentage =
        limit === 0 ? 0 : Math.min(Math.round((spent / limit) * 100), 999);

      return {
        category,
        limit,
        spent,
        remaining,
        percentage,
        status: getBudgetStatus(percentage, spent, limit),
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

export function getSmartFinanceInsights(
  transactions: FinanceTransaction[]
): SmartFinanceInsight[] {
  if (transactions.length === 0) {
    return [
      {
        id: "empty",
        title: "אין עדיין נתונים",
        description: "כדאי להתחיל בהוספת פעולה ראשונה כדי לקבל תובנות חכמות.",
        tone: "info",
      },
    ];
  }

  const insights: SmartFinanceInsight[] = [];
  const stats = getFinanceStats(transactions);
  const budgetReport = getBudgetReport(transactions);
  const monthlyCashflow = getMonthlyCashflowReport(transactions);
  const latestMonth = getLatestMonth(transactions);
  const latestMonthLabel = formatMonthLabel(latestMonth);

  const latestMonthCashflow =
    monthlyCashflow.find((item) => item.month === latestMonth) ??
    monthlyCashflow[monthlyCashflow.length - 1];

  const overBudgetItems = budgetReport.filter((item) => item.status === "over");
  const warningBudgetItems = budgetReport.filter(
    (item) => item.status === "warning"
  );

  const latestMonthExpensesByCategory =
    getLatestMonthExpensesByCategory(transactions);

  const topCategory = latestMonthExpensesByCategory[0];

  if (latestMonthCashflow) {
    if (latestMonthCashflow.balance >= 0) {
      insights.push({
        id: "positive-cashflow",
        title: "תזרים חיובי",
        description: `בחודש ${latestMonthLabel} נשארה יתרה של ${formatCurrency(
          latestMonthCashflow.balance
        )}.`,
        tone: "good",
      });
    } else {
      insights.push({
        id: "negative-cashflow",
        title: "תזרים שלילי",
        description: `בחודש ${latestMonthLabel} ההוצאות עברו את ההכנסות ב־${formatCurrency(
          Math.abs(latestMonthCashflow.balance)
        )}.`,
        tone: "danger",
      });
    }
  }

  if (overBudgetItems.length > 0) {
    const firstOverBudgetItem = overBudgetItems[0];

    insights.push({
      id: "over-budget",
      title: "יש חריגה בתקציב",
      description: `קטגוריית ${firstOverBudgetItem.category} חרגה ב־${formatCurrency(
        Math.abs(firstOverBudgetItem.remaining)
      )}.`,
      tone: "danger",
    });
  } else if (warningBudgetItems.length > 0) {
    const firstWarningItem = warningBudgetItems[0];

    insights.push({
      id: "near-budget-limit",
      title: "קרובים לגבול התקציב",
      description: `קטגוריית ${firstWarningItem.category} כבר ניצלה ${firstWarningItem.percentage}% מהתקציב.`,
      tone: "warning",
    });
  } else {
    insights.push({
      id: "budget-good",
      title: "התקציב נראה יציב",
      description: "אין כרגע קטגוריות בחריגה או קרובות לחריגה.",
      tone: "good",
    });
  }

  if (topCategory) {
    insights.push({
      id: "top-category",
      title: "הקטגוריה הגבוהה החודש",
      description: `בחודש ${latestMonthLabel}, ${topCategory.category} היא הקטגוריה הגבוהה ביותר עם ${formatCurrency(
        topCategory.total
      )}.`,
      tone: "info",
    });
  }

  if (stats.pendingPayments > 0) {
    insights.push({
      id: "pending-payments",
      title: "יש פעולות עתידיות",
      description: `יש ${stats.pendingPayments} תשלומים או הכנסות שעדיין לא בוצעו.`,
      tone: "warning",
    });
  } else {
    insights.push({
      id: "no-pending-payments",
      title: "אין פעולות עתידיות פתוחות",
      description: "כל הפעולות מסומנות כבוצעו.",
      tone: "good",
    });
  }

  return insights.slice(0, 4);
}

function getLatestMonthExpensesByCategory(transactions: FinanceTransaction[]) {
  const latestMonth = getLatestMonth(transactions);

  const categoryMap = new Map<string, number>();

  transactions
    .filter((item) => item.type === "expense" && item.date.startsWith(latestMonth))
    .forEach((item) => {
      const currentAmount = categoryMap.get(item.category) ?? 0;
      categoryMap.set(item.category, currentAmount + item.amount);
    });

  return Array.from(categoryMap.entries())
    .map(([category, total]) => ({
      category,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

function getBudgetStatus(
  percentage: number,
  spent: number,
  limit: number
): BudgetReportItem["status"] {
  if (limit > 0 && spent > limit) {
    return "over";
  }

  if (percentage >= 80) {
    return "warning";
  }

  return "good";
}

function getLatestMonth(transactions: FinanceTransaction[]) {
  const months = transactions
    .map((item) => item.date.slice(0, 7))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return months[0] ?? new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);

  // חודש לא תקין (למשל מנתונים ישנים) לא יפיל את המסך — מציגים כמו שהוא.
  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("he-IL", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}
