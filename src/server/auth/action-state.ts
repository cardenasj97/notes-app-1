export type AuthActionState = {
  fieldErrors?: {
    displayName?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
  fieldValues?: {
    displayName?: string;
    email?: string;
  };
};

export const initialAuthActionState: AuthActionState = {};
