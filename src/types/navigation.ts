export type AppRoute =
  | "/"
  | "/finance"
  | "/tasks"
  | "/dashboard"
  | "/command-center"
  | "/assistant"
  | "/timeline"
  | "/health"
  | "/documents"
  | "/vehicles"
  | "/family"
  | "/knowledge"
  | "/birthdays"
  | "/shopping"
  | "/security"
  | "/permissions"
  | "/settings";

export type NavigationItem = {
  label: string;
  href: AppRoute;
  description: string;
  status: string;
};
