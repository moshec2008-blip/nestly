export type AppRoute =
  | "/"
  | "/finance"
  | "/tasks"
  | "/dashboard"
  | "/command-center"
  | "/assistant"
  | "/timeline"
  | "/life"
  | "/health"
  | "/documents"
  | "/vehicles"
  | "/family"
  | "/knowledge"
  | "/legacy"
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
