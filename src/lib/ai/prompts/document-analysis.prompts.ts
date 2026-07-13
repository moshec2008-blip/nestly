export const documentAnalysisPrompt = `
Task: extract structured family document data for Nestly.
Return JSON only. Do not invent values. Use null for unknown fields.
Allowed documentType values: receipt, invoice, utility_bill, bank_document,
insurance_document, medical_referral, appointment_document, medical_result,
prescription, vehicle_document, government_document, family_document, unknown.
Every suggestion requires user review. Include confidence and warnings.
`;
