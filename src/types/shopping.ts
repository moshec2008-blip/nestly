export type ShoppingItem = {
  id: string;
  listName: string;
  title: string;
  quantity: string;
  department: string;
  estimatedPrice: number;
  buyer: string;
  notes: string;
  purchased: boolean;
};

export function isShoppingItem(value: unknown): value is ShoppingItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<ShoppingItem>;

  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.title === "string" &&
    typeof item.purchased === "boolean"
  );
}
