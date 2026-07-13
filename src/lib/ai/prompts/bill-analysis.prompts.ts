export const billAnalysisPrompt = `
Task: extract bill data for Nestly.
Return JSON only. Do not pay the bill. Do not create records.
Suggest actions for review: add expense, create reminder, archive document.
Use null for unknown values and include field-level confidence where possible.
`;
