export type AppRoute =
  | "/"
  | "/finance"
  | "/tasks"
  | "/dashboard"
  | "/health"
  | "/documents"
  | "/vehicles"
  | "/family"
  | "/birthdays"
  | "/shopping"
  | "/permissions"
  | "/settings";

export type NavigationItem = {
  label: string;
  href: AppRoute;
  description: string;
  status: string;
};
