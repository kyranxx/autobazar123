"use client";

import { useState, useEffect, useTransition, useDeferredValue } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Input } from "@/components/ui/shadcn/input";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { toast } from "sonner";
import {
  getAdminUsers,
  updateUserCredits,
  banUser,
  type AdminUser,
} from "../actions";

function UserRow({
  user: userData,
  onEditCredits,
  onBan,
}: {
  user: AdminUser;
  onEditCredits: () => void;
  onBan: () => void;
}) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="accent">Admin</Badge>;
      case "dealer":
        return <Badge variant="success">Dealer</Badge>;
      default:
        return <Badge variant="default">Používateľ</Badge>;
    }
  };

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <span className="text-sm font-bold text-accent">
              {userData.email?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">{userData.email}</p>
            <p className="text-sm text-text-secondary">
              {userData.full_name || "-"}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">{getRoleBadge(userData.role)}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">
            {userData.credit_balance}
          </span>
          <button
            onClick={onEditCredits}
            className="p-1 rounded hover:bg-background-tertiary transition-colors"
          >
            <svg
              className="w-4 h-4 text-text-secondary hover:text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-text-primary">{userData.ad_count}</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-text-secondary text-sm">
          {new Date(userData.created_at).toLocaleDateString("sk-SK")}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {userData.is_banned ? (
            <Badge variant="error">Blokovaný</Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBan}
              className="text-error hover:bg-error/10"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function EditCreditsModal({
  open,
  onClose,
  user: userData,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSave: (newCredits: number) => void;
}) {
  const [credits, setCredits] = useState(() =>
    userData ? String(userData.credit_balance) : "",
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const newCredits = parseInt(credits, 10);
    if (isNaN(newCredits) || newCredits < 0) {
      toast.error("Zadajte platný počet kreditov");
      return;
    }
    startTransition(() => {
      onSave(newCredits);
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upraviť kredity"
      description={userData?.email}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="admin-user-credits-input" className="block text-sm font-medium text-text-secondary mb-2">
            Počet kreditov
          </label>
          <Input id="admin-user-credits-input"
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            min={0}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Zrušiť
          </Button>
          <Button variant="accent" onClick={handleSave} loading={isPending}>
            Uložiť
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BanUserModal({
  open,
  onClose,
  user: userData,
  onBan,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onBan: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleBan = () => {
    startTransition(() => {
      onBan(reason);
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zablokovať používateľa"
      description={userData?.email}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-error/10 border border-error/20">
          <p className="text-sm text-error">
            Táto akcia zablokuje používateľa a znemožní mu prístup k platforme.
          </p>
        </div>
        <div>
          <label htmlFor="admin-user-ban-reason" className="block text-sm font-medium text-text-secondary mb-2">
            Dôvod zablokovania
          </label>
          <textarea id="admin-user-ban-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Popíšte dôvod..."
            className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-error"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Zrušiť
          </Button>
          <Button
            variant="primary"
            onClick={handleBan}
            loading={isPending}
            className="bg-error hover:bg-error/90"
          >
            Zablokovať
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDeferredValue(search);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [modals, setModals] = useState<{
    edit: { open: boolean; user: AdminUser | null };
    ban: { open: boolean; user: AdminUser | null };
  }>({
    edit: { open: false, user: null },
    ban: { open: false, user: null },
  });

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAdminUsers(debouncedSearch || undefined);
        setUsers(data);
      } catch (caughtError) {
        console.error("Failed to fetch users:", caughtError);
        setUsers([]);
        setError("Používateľov sa nepodarilo načítať.");
        toast.error("Nepodarilo sa načítať používateľov");
      } finally {
        setLoading(false);
      }
    }
    void fetchUsers();
  }, [debouncedSearch, refreshNonce]);

  const handleSaveCredits = async (newCredits: number) => {
    if (!currentUser || !modals.edit.user) return;

    try {
      await updateUserCredits(
        modals.edit.user.id,
        newCredits,
        modals.edit.user.credit_balance,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === modals.edit.user?.id
            ? { ...u, credit_balance: newCredits }
            : u,
        ),
      );
      setModals((prev) => ({ ...prev, edit: { open: false, user: null } }));
      toast.success("Kredity aktualizované");
    } catch (error) {
      console.error("Failed to update credits:", error);
      toast.error("Nepodarilo sa aktualizovať kredity");
    }
  };

  const handleBanUser = async (reason: string) => {
    if (!currentUser || !modals.ban.user) return;

    try {
      await banUser(modals.ban.user.id, reason);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === modals.ban.user?.id ? { ...u, is_banned: true } : u,
        ),
      );
      setModals((prev) => ({ ...prev, ban: { open: false, user: null } }));
      toast.success("Používateľ zablokovaný");
    } catch (error) {
      console.error("Failed to ban user:", error);
      toast.error("Nepodarilo sa zablokovať používateľa");
    }
  };

  const adminCount = users.filter((userData) => userData.role === "admin").length;
  const dealerCount = users.filter((userData) => userData.role === "dealer").length;
  const bannedCount = users.filter((userData) => userData.is_banned).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <Input
                placeholder="Hľadať používateľa (email, meno)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">{users.length} používateľov</Badge>
              <Badge variant="success">{dealerCount} dealerov</Badge>
              <Badge variant="accent">{adminCount} adminov</Badge>
              <Badge variant={bannedCount > 0 ? "error" : "default"}>
                {bannedCount} blokovaných
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRefreshNonce((currentValue) => currentValue + 1)}
              >
                Obnoviť
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-error/20 bg-error/5">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-error sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRefreshNonce((currentValue) => currentValue + 1)}
            >
              Skusiť znova
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-background-tertiary">
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Používateľ
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Typ
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Kredity
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Inzeráty
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Registrácia
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Akcie
                </th>
              </tr>
            </thead>
              <tbody>
                {loading ? (
                  [
                    "users-skeleton-1",
                    "users-skeleton-2",
                    "users-skeleton-3",
                    "users-skeleton-4",
                    "users-skeleton-5",
                  ].map((skeletonKey) => (
                    <tr key={skeletonKey} className="border-b border-border-subtle">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10" variant="circular" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-6 w-20" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-8 w-16" />
                      </td>
                    </tr>
                  ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-text-secondary"
                  >
                    {debouncedSearch
                      ? "Pre tento filter sa nenašli ziadni pouzivatelia"
                      : "Zatial nie sú dostupne ziadni pouzivatelia"}
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                  <UserRow
                    key={userData.id}
                    user={userData}
                    onEditCredits={() =>
                      setModals((prev) => ({
                        ...prev,
                        edit: { open: true, user: userData },
                      }))
                    }
                    onBan={() =>
                      setModals((prev) => ({
                        ...prev,
                        ban: { open: true, user: userData },
                      }))
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EditCreditsModal
        key={modals.edit.user?.id ?? "edit-modal-empty"}
        open={modals.edit.open}
        onClose={() =>
          setModals((prev) => ({ ...prev, edit: { open: false, user: null } }))
        }
        user={modals.edit.user}
        onSave={handleSaveCredits}
      />

      <BanUserModal
        open={modals.ban.open}
        onClose={() =>
          setModals((prev) => ({ ...prev, ban: { open: false, user: null } }))
        }
        user={modals.ban.user}
        onBan={handleBanUser}
      />
    </div>
  );
}







