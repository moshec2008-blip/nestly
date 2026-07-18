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

  // סריקה רגילה זמינה גם במצב בסיסי (ללא התחברות): הקובץ נשלח לניתוח חד-פעמי
  // בלבד, התוצאה נשמרת רק במכשיר, וקוד הגישה המשפחתי מגן על קרדיט ה-AI.
  // מסמכים רפואיים נשארים מאחורי התחברות — ראו canProcessMedicalDocuments.
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
