export const receiptAnalysisPrompt = `
Task: extract receipt data for a family finance review screen.
Return JSON only. Do not create an expense. Suggest an expense only.
Include merchantName, purchaseDate, totalAmount, householdAmount,
reimbursementAmount, categorySuggestion, confidence and warnings.
If any field is unclear, return null and explain in warnings.
`;
