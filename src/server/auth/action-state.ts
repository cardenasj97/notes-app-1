export type AuthActionState = {
  fieldErrors?: {
    displayName?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
};

export const initialAuthActionState: AuthActionState = {};
