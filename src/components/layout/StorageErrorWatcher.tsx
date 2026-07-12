"use client";

import { useEffect, useRef } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { getStorageWriteErrorEventName } from "@/utils/storage";

// כישלון שמירה נוטה לחזור על עצמו בכל שינוי — מציגים התראה אחת ולא מציפים.
const toastCooldownMs = 30_000;

export default function StorageErrorWatcher() {
  const { toast } = useFeedback();
  const lastToastAtRef = useRef(0);

  useEffect(() => {
    function handleWriteError() {
      const now = Date.now();

      if (now - lastToastAtRef.current < toastCooldownMs) {
        return;
      }

      lastToastAtRef.current = now;
      toast({
        title: "השמירה נכשלה",
        description:
          "אין מספיק מקום באחסון הדפדפן, והשינויים האחרונים לא נשמרו. מומלץ למחוק מסמכים עם קבצים גדולים ולייצא גיבוי מעמוד ההגדרות.",
        tone: "danger",
      });
    }

    window.addEventListener(getStorageWriteErrorEventName(), handleWriteError);

    return () =>
      window.removeEventListener(
        getStorageWriteErrorEventName(),
        handleWriteError
      );
  }, [toast]);

  return null;
}
