"use client";

import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import type { FinanceTransaction } from "@/data/finance";
import { formatIlsCurrency } from "@/utils/formatters";

type InsightItem = {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: AppIconName;
  tone: string;
};

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getMonthlyExpenses(transactions: FinanceTransaction[], monthKey: string) {
  return transactions
    .filter((transaction) => {
      return (
        transaction.type === "expense" &&
        transaction.status === "done" &&
        getMonthKey(transaction.date) === monthKey
      );
    })
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function buildFinanceInsights(transactions: FinanceTransaction[]): InsightItem[] {
  const doneExpenses = transactions
    .filter((transaction) => transaction.type === "expense" && transaction.status === "done")
    .sort((a, b) => b.amount - a.amount);
  const doneIncome = transactions
    .filter((transaction) => transaction.type === "income" && transaction.status === "done")
    .sort((a, b) => b.amount - a.amount);
  const pendingTransactions = transactions.filter(
    (transaction) => transaction.status === "pending"
  );

  const insights: InsightItem[] = [];
  const highestExpense = doneExpenses[0];
  const biggestIncome = doneIncome[0];

  if (highestExpense) {
    insights.push({
      id: "highest-expense",
      title: "הוצאה בולטת",
      value: formatIlsCurrency(highestExpense.amount),
      description: highestExpense.title,
      icon: "finance",
      tone: "bg-rose-50 text-rose-700 ring-rose-100",
    });
  }

  if (biggestIncome) {
    insights.push({
      id: "biggest-income",
      title: "הכנסה בולטת",
      value: formatIlsCurrency(biggestIncome.amount),
      description: biggestIncome.title,
      icon: "finance",
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    });
  }

  if (pendingTransactions.length > 0) {
    const pendingTotal = pendingTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

    insights.push({
      id: "pending-payments",
      title: "ממתין לטיפול",
      value: formatIlsCurrency(pendingTotal),
      description: `${pendingTransactions.length} פעולות פתוחות`,
      icon: "calendar",
      tone: "bg-amber-50 text-amber-700 ring-amber-100",
    });
  }

  const monthKeys = Array.from(new Set(transactions.map((item) => getMonthKey(item.date))))
    .filter(Boolean)
    .sort()
    .reverse();

  if (monthKeys.length >= 2) {
    const currentExpenses = getMonthlyExpenses(transactions, monthKeys[0]);
    const previousExpenses = getMonthlyExpenses(transactions, monthKeys[1]);

    if (currentExpenses > 0 && previousExpenses > 0) {
      const change = currentExpenses - previousExpenses;
      const isHigher = change > 0;

      insights.push({
        id: "expense-trend",
        title: "מגמת הוצאות",
        value: formatIlsCurrency(Math.abs(change)),
        description: isHigher ? "יותר מהחודש הקודם" : "פחות מהחודש הקודם",
        icon: "dashboard",
        tone: isHigher
          ? "bg-orange-50 text-orange-700 ring-orange-100"
          : "bg-sky-50 text-sky-700 ring-sky-100",
      });
    }
  }

  return insights.slice(0, 4);
}

export default function FinanceInsightStrip({
  transactions,
}: {
  transactions: FinanceTransaction[];
}) {
  const insights = buildFinanceInsights(transactions);

  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[#ece4d7] bg-[#fffdf8] p-3 text-right shadow-[0_16px_34px_rgba(15,23,42,0.045)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#e6d8c6] bg-white px-3 py-1 text-[11px] font-black text-[#7a5212]">
          לפי הנתונים שלך
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            תובנות כספיות
          </p>
          <h2 className="text-base font-black text-[#111827]">מה כדאי לשים לב אליו</h2>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className="flex min-h-[76px] items-center justify-between gap-3 rounded-[18px] bg-white px-3 py-2.5 ring-1 ring-[#edf0f3] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.06)]"
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ring-1 ${insight.tone}`}>
              <AppIcon name={insight.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-black text-slate-500">{insight.title}</p>
              <p
                dir="ltr"
                className="mt-0.5 whitespace-nowrap text-base font-black text-[#111827] [unicode-bidi:isolate]"
              >
                {insight.value}
              </p>
              <p className="truncate text-[11px] font-semibold text-slate-400">
                {insight.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
