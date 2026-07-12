import { demoFamilyEvents, demoFamilyTreePeople } from "@/data/demoFamilyData";
import { storageKeys } from "@/lib/storageKeys";
import {
  demoStorageScope,
  getActiveStorageUserScope,
  getScopedStorageKeyForScope,
  guestStorageScope,
  setActiveStorageUserScope,
} from "@/utils/storage";

// מצב דמו: מעבר למרחב אחסון נפרד ("demo-family-space") עם משפחה בדויה.
// הנתונים האמיתיים נשארים במרחב הקודם ולא נפגעים.

const previousScopeStorageKey = "nestly-demo-previous-scope";

export function isDemoModeActive() {
  if (typeof window === "undefined") {
    return false;
  }

  return getActiveStorageUserScope() === demoStorageScope;
}

function clearDemoScopedData() {
  for (const key of Object.values(storageKeys)) {
    const demoKey = getScopedStorageKeyForScope(demoStorageScope, key);

    // מפתחות שאינם תלויי-מרחב חוזרים כמו שהם — לא נוגעים בהם.
    if (demoKey && demoKey !== key) {
      window.localStorage.removeItem(demoKey);
    }
  }
}

function writeDemoSeed(key: string, value: unknown) {
  const demoKey = getScopedStorageKeyForScope(demoStorageScope, key);

  if (demoKey && demoKey !== key) {
    window.localStorage.setItem(demoKey, JSON.stringify(value));
  }
}

export function enterDemoMode() {
  if (typeof window === "undefined" || isDemoModeActive()) {
    return;
  }

  const currentScope = getActiveStorageUserScope();

  if (currentScope) {
    window.localStorage.setItem(previousScopeStorageKey, currentScope);
  }

  // הדמו מתחיל תמיד נקי: מוחקים שאריות מכניסה קודמת וכותבים את
  // המשפחה הבדויה. שאר המודולים מקבלים את נתוני הדוגמה הכלליים דרך fallback.
  clearDemoScopedData();
  writeDemoSeed(storageKeys.birthdays, demoFamilyEvents);
  writeDemoSeed(storageKeys.familyTree, demoFamilyTreePeople);

  setActiveStorageUserScope(demoStorageScope);
}

export function exitDemoMode() {
  if (typeof window === "undefined" || !isDemoModeActive()) {
    return;
  }

  const previousScope =
    window.localStorage.getItem(previousScopeStorageKey) || guestStorageScope;
  window.localStorage.removeItem(previousScopeStorageKey);

  setActiveStorageUserScope(previousScope);
}
