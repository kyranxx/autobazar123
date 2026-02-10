"use client";

import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
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
          <Button
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:text-text-primary"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </Button>
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
  const [credits, setCredits] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (userData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state with prop
      setCredits(String(userData.credit_balance));
    }
  }, [userData]);

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
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Počet kreditov
          </label>
          <Input
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
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Dôvod zablokovania
          </label>
          <textarea
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editModal, setEditModal] = useState<{
    open: boolean;
    user: AdminUser | null;
  }>({
    open: false,
    user: null,
  });
  const [banModal, setBanModal] = useState<{
    open: boolean;
    user: AdminUser | null;
  }>({
    open: false,
    user: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const data = await getAdminUsers(debouncedSearch || undefined);
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Nepodarilo sa načítať používateľov");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [debouncedSearch]);

  const handleSaveCredits = async (newCredits: number) => {
    if (!currentUser || !editModal.user) return;

    try {
      await updateUserCredits(
        editModal.user.id,
        newCredits,
        editModal.user.credit_balance,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editModal.user?.id
            ? { ...u, credit_balance: newCredits }
            : u,
        ),
      );
      setEditModal({ open: false, user: null });
      toast.success("Kredity aktualizované");
    } catch (error) {
      console.error("Failed to update credits:", error);
      toast.error("Nepodarilo sa aktualizovať kredity");
    }
  };

  const handleBanUser = async (reason: string) => {
    if (!currentUser || !banModal.user) return;

    try {
      await banUser(banModal.user.id, reason);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === banModal.user?.id ? { ...u, is_banned: true } : u,
        ),
      );
      setBanModal({ open: false, user: null });
      toast.success("Používateľ zablokovaný");
    } catch (error) {
      console.error("Failed to ban user:", error);
      toast.error("Nepodarilo sa zablokovať používateľa");
    }
  };

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
            </div>
          </div>
        </CardContent>
      </Card>

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
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-border-subtle">
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
                    Žiadni používatelia nenájdení
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                  <UserRow
                    key={userData.id}
                    user={userData}
                    onEditCredits={() =>
                      setEditModal({ open: true, user: userData })
                    }
                    onBan={() => setBanModal({ open: true, user: userData })}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EditCreditsModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        user={editModal.user}
        onSave={handleSaveCredits}
      />

      <BanUserModal
        open={banModal.open}
        onClose={() => setBanModal({ open: false, user: null })}
        user={banModal.user}
        onBan={handleBanUser}
      />
    </div>
  );
}
