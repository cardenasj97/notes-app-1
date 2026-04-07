export type OrganizationActionState = {
  fieldErrors?: {
    name?: string[];
    email?: string[];
    displayName?: string[];
    role?: string[];
    organizationId?: string[];
  };
  message?: string;
};

export const initialOrganizationActionState: OrganizationActionState = {};
