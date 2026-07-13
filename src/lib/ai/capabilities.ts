import type { AIUserMode, AnalysisType } from "@/lib/ai/types";

export type AICapabilityCheck = {
  allowed: boolean;
  reason?: string;
  requiresAuth?: boolean;
};

export function canUseAI(userMode: AIUserMode): AICapabilityCheck {
  if (userMode === "demo") {
    return { allowed: true, reason: "מצב הדגמה משתמש בניתוח mock בלבד." };
  }

  if (userMode === "basic") {
    return {
      allowed: false,
      requiresAuth: true,
      reason:
        "סריקת מסמכים רגישה זמינה רק במרחב משפחתי מאובטח. במצב בסיסי המידע נשמר במכשיר בלבד.",
    };
  }

  return { allowed: true };
}

export function canScanDocuments(userMode: AIUserMode): AICapabilityCheck {
  return canUseAI(userMode);
}

export function canProcessMedicalDocuments(
  userMode: AIUserMode
): AICapabilityCheck {
  if (userMode !== "authenticated") {
    return {
      allowed: false,
      requiresAuth: true,
      reason: "מסמכים רפואיים דורשים התחברות ואישור מפורש לפני עיבוד.",
    };
  }

  return { allowed: true };
}

export function getCapabilityForAnalysis(
  userMode: AIUserMode,
  analysisType: AnalysisType
): AICapabilityCheck {
  if (analysisType === "medical_document") {
    return canProcessMedicalDocuments(userMode);
  }

  return canScanDocuments(userMode);
}
