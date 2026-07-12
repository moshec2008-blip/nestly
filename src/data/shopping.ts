import type { ShoppingItem } from "@/types/shopping";

export const shoppingLists = [
  "אושר עד",
  "רמי לוי",
  "ויקטורי",
  "שופרסל",
  "ACE",
  "IKEA",
  "סופר פארם",
  "מחסני חשמל",
];

export const initialShoppingItems: ShoppingItem[] = [
  {
    id: "shopping-1",
    listName: "אושר עד",
    title: "חלב",
    quantity: "3",
    department: "מקרר",
    estimatedPrice: 24,
    buyer: "דוד",
    notes: "לבדוק תוקף ארוך",
    purchased: false,
  },
  {
    id: "shopping-2",
    listName: "סופר פארם",
    title: "משחת שיניים",
    quantity: "2",
    department: "טיפוח",
    estimatedPrice: 32,
    buyer: "מיכל",
    notes: "",
    purchased: false,
  },
  {
    id: "shopping-3",
    listName: "IKEA",
    title: "קופסאות אחסון",
    quantity: "6",
    department: "בית",
    estimatedPrice: 90,
    buyer: "הבית",
    notes: "למסמכים ומשחקים",
    purchased: true,
  },
];
