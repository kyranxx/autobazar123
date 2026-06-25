import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUserMock = vi.fn();
const requireRoleMock = vi.fn();
const assertAdminMfaAssuranceMock = vi.fn();
const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const listUsersMock = vi.fn();
const updateUserByIdMock = vi.fn();
const getUserByIdMock = vi.fn();
const createUserMock = vi.fn();
const generateLinkMock = vi.fn();
const deleteUserMock = vi.fn();
const enqueuePasswordRecoveryEmailJobMock = vi.fn();
const scheduleQueuedEmailDrainMock = vi.fn();
const auditInsertMock = vi.fn();
const profileUpdateMock = vi.fn();
let siteAdminRows: Array<{ user_id: string }> = [];
let profileRows: Array<{
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock("@/lib/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

vi.mock("@/lib/auth/admin-mfa", () => ({
  assertAdminMfaAssurance: (...args: unknown[]) =>
    assertAdminMfaAssuranceMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/email/jobs", () => ({
  enqueuePasswordRecoveryEmailJob: (...args: unknown[]) =>
    enqueuePasswordRecoveryEmailJobMock(...args),
  enqueueModerationDecisionEmailJob: vi.fn(),
  scheduleQueuedEmailDrain: (...args: unknown[]) =>
    scheduleQueuedEmailDrainMock(...args),
}));

vi.mock("@/lib/analytics/server", () => ({
  recordServerAnalyticsEvent: vi.fn(),
}));

function makeSupabaseMock() {
  const profilesResult = {
    data: profileRows,
    error: null,
  };
  const dealersResult = {
    data: [
      {
        id: "dealer-1",
        owner_id: "user-2",
        is_verified: true,
        prepaid_balance_cents: 4990,
      },
    ],
    error: null,
  };
  const adsResult = {
    data: [
      { seller_id: "user-1" },
      { seller_id: "user-2" },
      { seller_id: "user-2" },
    ],
    error: null,
  };

  return {
    auth: {
      getUser: authGetUserMock,
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        let idFilter: string | null = null;
        const builder = {
          select: vi.fn().mockReturnThis(),
          update: vi.fn((values: unknown) => {
            profileUpdateMock(values);
            return builder;
          }),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          eq: vi.fn((column: string, value: string) => {
            if (column === "id") {
              idFilter = value;
            }
            return builder;
          }),
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: profileRows.find((profile) => profile.id === idFilter) || null,
              error: null,
            }),
          ),
          then: (resolve: (value: typeof profilesResult) => void) =>
            resolve(profilesResult),
        };
        return builder;
      }
      if (table === "dealers") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue(dealersResult),
        };
      }
      if (table === "ads") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue(adsResult),
        };
      }
      if (table === "admin_audit_logs") {
        return {
          insert: auditInsertMock,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe("admin user actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUserMock.mockResolvedValue({
      data: { user: { id: "admin-user" } },
    });
    requireRoleMock.mockResolvedValue(undefined);
    assertAdminMfaAssuranceMock.mockResolvedValue(undefined);
    listUsersMock.mockResolvedValue({
      data: {
        users: [
          { id: "user-1", banned_until: null },
          { id: "user-2", banned_until: "2126-06-01T00:00:00.000Z" },
        ],
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({ data: { user: null }, error: null });
    getUserByIdMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "seller@example.com" } },
      error: null,
    });
    createUserMock.mockResolvedValue({
      data: {
        user: {
          id: "created-user",
          email: "new@example.com",
          created_at: "2026-06-20T10:00:00.000Z",
          user_metadata: { full_name: "New User" },
        },
      },
      error: null,
    });
    generateLinkMock.mockResolvedValue({
      data: {
        properties: {
          action_link: "https://auth.example/verify?token=magic-token",
          email_otp: "123456",
          hashed_token: "reset-token",
          redirect_to: "http://localhost:3000/auth/reset-password",
          verification_type: "recovery",
        },
        user: { user_metadata: { full_name: "New User" } },
      },
      error: null,
    });
    deleteUserMock.mockResolvedValue({ data: { user: null }, error: null });
    enqueuePasswordRecoveryEmailJobMock.mockResolvedValue({ ok: true });
    auditInsertMock.mockResolvedValue({ data: null, error: null });
    profileUpdateMock.mockReturnValue(undefined);
    siteAdminRows = [{ user_id: "admin-user" }];
    profileRows = [
      {
        id: "user-1",
        email: "seller@example.com",
        full_name: "Seller One",
        created_at: "2026-06-01T10:00:00.000Z",
      },
      {
        id: "user-2",
        email: "dealer@example.com",
        full_name: "Dealer Two",
        created_at: "2026-06-02T10:00:00.000Z",
      },
    ];
    createAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          listUsers: listUsersMock,
          updateUserById: updateUserByIdMock,
          getUserById: getUserByIdMock,
          createUser: createUserMock,
          generateLink: generateLinkMock,
          deleteUser: deleteUserMock,
        },
      },
      from: vi.fn((table: string) => {
        if (table === "site_admins") {
          return {
            select: vi.fn().mockResolvedValue({
              data: siteAdminRows,
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected admin table ${table}`);
      }),
    });
    createClientMock.mockReturnValue(makeSupabaseMock());
  });

  it("blocks login through Supabase auth when banning a user", async () => {
    const { banUser } = await import("./actions");

    await banUser("user-2", "spam");

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(updateUserByIdMock).toHaveBeenCalledWith("user-2", {
      ban_duration: "876000h",
    });
  });

  it("unblocks login through Supabase auth when unbanning a user", async () => {
    const { unbanUser } = await import("./actions");

    await unbanUser("user-2");

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(updateUserByIdMock).toHaveBeenCalledWith("user-2", {
      ban_duration: "none",
    });
  });

  it("marks users as blocked when Supabase auth has a future banned_until", async () => {
    const { getAdminUsers } = await import("./actions");

    const users = await getAdminUsers();

    expect(listUsersMock).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "user-1", is_banned: false }),
        expect.objectContaining({ id: "user-2", is_banned: true }),
      ]),
    );
  });

  it("creates a normal user and sends the password setup email", async () => {
    const { createAdminUser } = await import("./actions");

    const created = await createAdminUser({
      email: " New@Example.com ",
      fullName: " New User ",
    });

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(createUserMock).toHaveBeenCalledWith({
      email: "new@example.com",
      email_confirm: true,
      user_metadata: {
        created_by_admin: true,
        full_name: "New User",
      },
    });
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "recovery",
      email: "new@example.com",
      options: {
        redirectTo: expect.stringMatching(/\/auth\/reset-password$/),
      },
    });
    expect(enqueuePasswordRecoveryEmailJobMock).toHaveBeenCalledWith({
      email: "new@example.com",
      fullName: "New User",
      resetUrl: expect.stringContaining(
        "/auth/reset-password?token_hash=reset-token&type=recovery",
      ),
    });
    expect(scheduleQueuedEmailDrainMock).toHaveBeenCalledWith({
      batchSize: 5,
      jobTypes: ["auth_password_reset"],
    });
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "create_user",
        target_type: "user",
        target_id: "created-user",
      }),
    );
    expect(created).toEqual(
      expect.objectContaining({
        id: "created-user",
        email: "new@example.com",
        full_name: "New User",
        role: "user",
      }),
    );
  });

  it("deletes a non-admin user through Supabase auth", async () => {
    const { deleteAdminUser } = await import("./actions");

    await deleteAdminUser("user-1");

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(deleteUserMock).toHaveBeenCalledWith("user-1");
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "delete_user",
        target_type: "user",
        target_id: "user-1",
      }),
    );
  });

  it("does not allow deleting the current admin account", async () => {
    const { deleteAdminUser } = await import("./actions");

    await expect(deleteAdminUser("admin-user")).rejects.toThrow(
      "Nemôžete vymazať vlastný admin účet.",
    );
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("does not allow deleting another site admin", async () => {
    siteAdminRows = [{ user_id: "admin-user" }, { user_id: "user-2" }];
    const { deleteAdminUser } = await import("./actions");

    await expect(deleteAdminUser("user-2")).rejects.toThrow(
      "Admin účet najprv odstráňte zo zoznamu adminov.",
    );
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("creates an audited magic login link for a non-admin user", async () => {
    const { createAdminUserImpersonationLink } = await import("./actions");

    const result = await createAdminUserImpersonationLink("user-1");

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(getUserByIdMock).toHaveBeenCalledWith("user-1");
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "magiclink",
      email: "seller@example.com",
      options: {
        redirectTo: expect.stringMatching(/\/moj-ucet$/),
      },
    });
    expect(result).toEqual({
      url: "https://auth.example/verify?token=magic-token",
      email: "seller@example.com",
      fullName: "Seller One",
    });
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "create_user_impersonation_link",
        target_type: "user",
        target_id: "user-1",
        details: {
          email: "seller@example.com",
          fullName: "Seller One",
        },
      }),
    );
  });

  it("does not allow impersonating the current admin account", async () => {
    const { createAdminUserImpersonationLink } = await import("./actions");

    await expect(createAdminUserImpersonationLink("admin-user")).rejects.toThrow(
      "Nemôžete sa prihlásiť ako vlastný admin účet.",
    );
    expect(generateLinkMock).not.toHaveBeenCalled();
  });

  it("does not allow impersonating another site admin", async () => {
    siteAdminRows = [{ user_id: "admin-user" }, { user_id: "user-2" }];
    const { createAdminUserImpersonationLink } = await import("./actions");

    await expect(createAdminUserImpersonationLink("user-2")).rejects.toThrow(
      "Admin účet nie je možné otvoriť cez prihlásenie používateľa.",
    );
    expect(generateLinkMock).not.toHaveBeenCalled();
  });

  it("edits a non-admin user's email and name in auth and profile", async () => {
    const { updateAdminUser } = await import("./actions");

    const updated = await updateAdminUser({
      userId: "user-1",
      email: " Seller.Updated@Example.com ",
      fullName: " Seller Updated ",
    });

    expect(assertAdminMfaAssuranceMock).toHaveBeenCalled();
    expect(updateUserByIdMock).toHaveBeenCalledWith("user-1", {
      email: "seller.updated@example.com",
      email_confirm: true,
      user_metadata: {
        full_name: "Seller Updated",
      },
    });
    expect(profileUpdateMock).toHaveBeenCalledWith({
      email: "seller.updated@example.com",
      full_name: "Seller Updated",
    });
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-user",
        action: "update_user",
        target_type: "user",
        target_id: "user-1",
        details: {
          previousEmail: "seller@example.com",
          nextEmail: "seller.updated@example.com",
          previousFullName: "Seller One",
          nextFullName: "Seller Updated",
        },
      }),
    );
    expect(updated).toEqual({
      id: "user-1",
      email: "seller.updated@example.com",
      full_name: "Seller Updated",
    });
  });

  it("does not allow editing the current admin account", async () => {
    const { updateAdminUser } = await import("./actions");

    await expect(
      updateAdminUser({
        userId: "admin-user",
        email: "admin@example.com",
        fullName: "Admin",
      }),
    ).rejects.toThrow("Nemôžete upraviť vlastný admin účet.");
    expect(updateUserByIdMock).not.toHaveBeenCalled();
    expect(profileUpdateMock).not.toHaveBeenCalled();
  });

  it("does not allow editing another site admin", async () => {
    siteAdminRows = [{ user_id: "admin-user" }, { user_id: "user-2" }];
    const { updateAdminUser } = await import("./actions");

    await expect(
      updateAdminUser({
        userId: "user-2",
        email: "admin2@example.com",
        fullName: "Admin Two",
      }),
    ).rejects.toThrow("Admin účet nie je možné upraviť v zozname používateľov.");
    expect(updateUserByIdMock).not.toHaveBeenCalled();
    expect(profileUpdateMock).not.toHaveBeenCalled();
  });
});
