// הגבלת קצב משותפת בזיכרון (פר-מופע) לכל מסלולי ה-AI — מגינה על קרדיט
// ה-API מפני שימוש לרעה. חלון ומפה משותפים כדי שהתקרה תהיה אמיתית לכל
// לקוח על פני כל הקריאות, ולא תקרה נפרדת שמוכפלת בין מסלולים.

const rateWindowMs = 60_000;
const maxRequestsPerWindow = 10;
const requestLog = new Map<string, number[]>();

export function getClientKeyFromRequest(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export function isRateLimited(clientKey: string) {
  const now = Date.now();
  const recentRequests = (requestLog.get(clientKey) ?? []).filter(
    (timestamp) => now - timestamp < rateWindowMs
  );

  if (recentRequests.length >= maxRequestsPerWindow) {
    requestLog.set(clientKey, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(clientKey, recentRequests);

  // ניקוי בסיסי כדי שהמפה לא תגדל בלי סוף.
  if (requestLog.size > 500) {
    requestLog.clear();
  }

  return false;
}
