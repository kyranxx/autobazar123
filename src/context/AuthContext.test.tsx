import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockCreateClient = vi.fn();
const mockIdentifyAnalyticsUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/analytics/client", () => ({
  identifyAnalyticsUser: (...args: unknown[]) => mockIdentifyAnalyticsUser(...args),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockCreateClient(),
}));

function AuthProbe() {
  const { loading, isAdmin } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="is-admin">{String(isAdmin)}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks non-admin status without a noisy zero-row single request", async () => {
    const siteAdminsSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
    });
    const siteAdminsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    mockCreateClient.mockReturnValue({
      auth: {
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: "user-123" },
            },
          },
        }),
        signOut: vi.fn(),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-123",
                email: "user@example.com",
                full_name: "User",
                phone: null,
                is_verified: false,
                avatar_url: null,
              },
              error: null,
            }),
          };
        }

        if (table === "site_admins") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: siteAdminsSingle,
            maybeSingle: siteAdminsMaybeSingle,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    expect(screen.getByTestId("is-admin")).toHaveTextContent("false");
    expect(siteAdminsMaybeSingle).toHaveBeenCalledTimes(1);
    expect(siteAdminsSingle).not.toHaveBeenCalled();
  });
});
