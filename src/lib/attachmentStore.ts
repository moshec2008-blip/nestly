"use client";

// אחסון קבצים מצורפים ב-IndexedDB — בלי מגבלת ה-5MB של localStorage.
// ב-localStorage נשארים רק המטא-נתונים (שם, גודל, סוג ומזהה).

const databaseName = "nestly-files";
const storeName = "attachments";

function isIndexedDbSupported() {
  return typeof window !== "undefined" && Boolean(window.indexedDB);
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    // IndexedDB אינו קיים בכל הקשר (למשל דפדוף פרטי בספארי ישן, webview
    // מוגבל) — נכשלים בבירור כאן במקום להישען על כל קורא שיזכור try/catch.
    if (!isIndexedDbSupported()) {
      reject(new Error("indexeddb-unsupported"));
      return;
    }

    const request = window.indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openDatabase();

  try {
    return await new Promise<T>((resolve, reject) => {
      const request = operation(
        database.transaction(storeName, mode).objectStore(storeName)
      );

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveAttachmentData(id: string, dataUrl: string) {
  await runTransaction("readwrite", (store) => store.put(dataUrl, id));
}

export async function getAttachmentData(id: string): Promise<string | null> {
  try {
    const value = await runTransaction("readonly", (store) => store.get(id));
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function deleteAttachmentData(ids: string[]) {
  for (const id of ids) {
    try {
      await runTransaction("readwrite", (store) => store.delete(id));
    } catch {
      // מחיקת קובץ בודד שנכשלה לא צריכה לעצור את השאר.
    }
  }
}
