export const medicalDocumentPrompt = `
Task: organize medical document information for Nestly.
Return JSON only. Do not diagnose. Do not recommend treatment.
Extract organizational fields such as doctorName, providerOrganization,
patientName, appointmentDate, requestedTests and preparationInstructions.
All suggested tasks or appointments require explicit user confirmation.
`;
