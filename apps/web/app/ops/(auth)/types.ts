export interface AuthFormState {
  status: "idle" | "error";
  message?: string;
}

export const initialAuthState: AuthFormState = { status: "idle" };
