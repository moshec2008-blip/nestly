// מתאם הפרעות גלובלי: פופאפ אחד בלבד רשאי לתפוס את תשומת הלב בכל רגע.
// מי שלא הצליח לתפוס את המנעול פשוט מדלג על ההצגה הנוכחית — בלי תור,
// כדי שהמשתמש לא יקבל רצף של חלונות קופצים.

let activeInterruptionId: string | null = null;

export function acquireInterruption(id: string): boolean {
  if (activeInterruptionId && activeInterruptionId !== id) {
    return false;
  }

  activeInterruptionId = id;
  return true;
}

export function releaseInterruption(id: string) {
  if (activeInterruptionId === id) {
    activeInterruptionId = null;
  }
}
