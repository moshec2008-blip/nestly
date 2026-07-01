export type AuthProvider = "google" | "email";

export type AuthRole = "admin" | "member" | "viewer";

export type AuthSession = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  role: AuthRole;
  workspaceName: string;
  signedInAt: string;
};

