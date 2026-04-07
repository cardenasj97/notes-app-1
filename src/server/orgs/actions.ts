"use server";

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { logger } from "@/lib/logger";

import { requireOrgAdmin, requireOrgMember } from "@/server/auth/permissions";
import { requireAuthContext } from "@/server/auth/session";

import {
  addMemberToOrganization,
  createOrganizationForProfile,
  setActiveOrgCookie,
} from "./service";
import type { OrganizationActionState } from "./action-state";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const selectOrganizationSchema = z.object({
  organizationId: z.uuid(),
});

const addMemberSchema = z.object({
  organizationId: z.uuid(),
  email: z.email(),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(["owner", "admin", "member"]),
});

export async function createOrganizationAction(
  _state: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Provide a valid organization name.",
    };
  }

  const { profile } = await requireAuthContext({ createProfile: true });
  const organization = await createOrganizationForProfile({
    profileId: profile.id,
    name: parsed.data.name,
  });

  await setActiveOrgCookie(organization.id);
  logger.info("org.selected_after_create", {
    organizationId: organization.id,
    profileId: profile.id,
  });
  redirect("/app");
}

export async function selectOrganizationAction(formData: FormData) {
  const parsed = selectOrganizationSchema.safeParse({
    organizationId: formData.get("organizationId"),
  });

  if (!parsed.success) {
    redirect("/app");
  }

  const membership = await requireOrgMember(parsed.data.organizationId);
  await setActiveOrgCookie(parsed.data.organizationId);

  logger.info("org.selected", {
    organizationId: parsed.data.organizationId,
    profileId: membership.profileId,
    role: membership.role,
  });

  redirect("/app");
}

export async function addMemberAction(
  _state: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const parsed = addMemberSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Provide a valid member email, display name, and role.",
    };
  }

  const membership = await requireOrgAdmin(parsed.data.organizationId);

  await addMemberToOrganization({
    organizationId: parsed.data.organizationId,
    email: parsed.data.email,
    displayName: parsed.data.displayName,
    role: parsed.data.role,
    invitedByProfileId: membership.profileId,
  });

  logger.info("org.add_member_submitted", {
    organizationId: parsed.data.organizationId,
    invitedByProfileId: membership.profileId,
    role: parsed.data.role,
  });

  redirect("/app");
}
