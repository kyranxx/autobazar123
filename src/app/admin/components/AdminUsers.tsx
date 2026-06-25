"use client";

import { formatSkDate } from "@/utils/date-format";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Input } from "@/components/ui/shadcn/input";
import { Modal } from "@/components/ui/shadcn/modal";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import {
  ArrowSquareOut,
  CopySimple,
  PencilSimple,
  SignIn,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  getAdminUsers,
  banUser,
  unbanUser,
  createAdminUser,
  createAdminUserImpersonationLink,
  deleteAdminUser,
  setDealerVerification,
  updateAdminUser,
  type AdminUser,
  type AdminUserImpersonationLink,
} from "../actions";

function UserRow({
  user: userData,
  onToggleDealerVerification,
  onBan,
  onUnban,
  onDelete,
  onEdit,
  onImpersonate,
  canBan,
  canDelete,
  canEdit,
  canImpersonate,
  impersonating,
}: {
  user: AdminUser;
  onToggleDealerVerification: () => void;
  onBan: () => void;
  onUnban: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onImpersonate: () => void;
  canBan: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canImpersonate: boolean;
  impersonating: boolean;
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
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent/10">
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
      <td className="p-4">{getRoleBadge(userData.role)}</td>
      <td className="p-4">
        {userData.is_dealer ? (
          userData.dealer_is_verified ? (
            <Badge variant="success">Overený dealer</Badge>
          ) : (
            <Badge variant="warning">Dealer čaká na overenie</Badge>
          )
        ) : (
          <span className="text-text-secondary text-sm">-</span>
        )}
      </td>
      <td className="p-4">
        {userData.is_dealer ? (
          <span className="font-semibold text-text-primary">
            {(userData.dealer_prepaid_balance_cents / 100).toLocaleString("sk-SK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </span>
        ) : (
          <span className="text-text-secondary text-sm">-</span>
        )}
      </td>
      <td className="p-4">
        <span className="text-text-primary">{userData.ad_count}</span>
      </td>
      <td className="p-4">
        <span className="text-text-secondary text-sm">
          {formatSkDate(userData.created_at)}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {userData.is_banned ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="error">Blokovaný</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnban}
                className="text-success hover:bg-success/10"
              >
                Odblokovať
              </Button>
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-error hover:bg-error/10"
                  leftIcon={<Trash className="size-4" />}
                >
                  Vymazať
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {userData.is_dealer && userData.dealer_id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDealerVerification}
                  className="text-success hover:bg-success/10"
                  title={userData.dealer_is_verified ? "Zrušiť overenie" : "Overiť dealera"}
                >
                  {userData.dealer_is_verified ? "Zrušiť overenie" : "Overiť"}
                </Button>
              ) : null}
              {canImpersonate ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onImpersonate}
                  loading={impersonating}
                  className="text-success hover:bg-success/10"
                  leftIcon={<SignIn className="size-4" />}
                >
                  Prihlásiť ako
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-text-primary hover:bg-surface-hover"
                  leftIcon={<PencilSimple className="size-4" />}
                >
                  Upraviť
                </Button>
              ) : null}
              {canBan ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBan}
                  className="text-error hover:bg-error/10"
                >
                  Zablokovať
                </Button>
              ) : (
                <span className="text-sm text-text-muted">Váš účet</span>
              )}
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-error hover:bg-error/10"
                  leftIcon={<Trash className="size-4" />}
                >
                  Vymazať
                </Button>
              ) : userData.role === "admin" && canBan ? (
                <span className="text-sm text-text-muted">Admin účet</span>
              ) : null}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function EditUserModal({
  open,
  onClose,
  user: userData,
  email,
  fullName,
  onEmailChange,
  onFullNameChange,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  email: string;
  fullName: string;
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onUpdate: (input: { email: string; fullName: string }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      void onUpdate({ email, fullName });
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upraviť používateľa"
      description={userData?.email}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
          <p className="text-sm text-text-secondary">
            Zmení sa prihlasovací e-mail aj profil používateľa. Admin účty sa
            upravujú samostatne.
          </p>
        </div>
        <div>
          <label
            htmlFor="admin-edit-user-email"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            E-mail
          </label>
          <Input
            id="admin-edit-user-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="meno@example.com"
            required
          />
        </div>
        <div>
          <label
            htmlFor="admin-edit-user-name"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Meno
          </label>
          <Input
            id="admin-edit-user-name"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder="Meno používateľa"
            maxLength={120}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Zrušiť
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={email.trim().length === 0}
            leftIcon={<PencilSimple className="size-4" />}
          >
            Uložiť zmeny
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ImpersonationLinkModal({
  open,
  onClose,
  user: userData,
  link,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  link: AdminUserImpersonationLink | null;
}) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copied = Boolean(link?.url && copiedUrl === link.url);

  const handleCopy = async () => {
    if (!link?.url) return;

    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedUrl(link.url);
      toast.success("Odkaz skopírovaný");
    } catch (error) {
      console.error("Failed to copy impersonation link:", error);
      toast.error("Odkaz sa nepodarilo skopírovať");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prihlásiť ako používateľ"
      description={link?.email || userData?.email}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="text-sm text-text-primary">
            Odkaz otvorí účet používateľa. Najbezpečnejšie je otvoriť ho v
            súkromnom okne, aby sa vám neprepísalo admin prihlásenie.
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-background-secondary p-3">
          <p className="text-sm font-medium text-text-primary">
            {link?.fullName || userData?.full_name || "Používateľ"}
          </p>
          <p className="text-sm text-text-secondary">{link?.email || userData?.email}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Zavrieť
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            disabled={!link?.url}
            leftIcon={<CopySimple className="size-4" />}
          >
            {copied ? "Skopírované" : "Kopírovať odkaz"}
          </Button>
          {link?.url ? (
            <Button asChild variant="primary">
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut className="size-4" />
                Otvoriť odkaz
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { email: string; fullName: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setFullName("");
  };

  const handleClose = () => {
    if (!isPending) {
      reset();
      onClose();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      void onCreate({ email, fullName }).then(reset);
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Vytvoriť používateľa"
      description="Účet bude pripravený hneď."
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
          <p className="text-sm text-text-secondary">
            Používateľ dostane e-mail na nastavenie hesla. Heslo sa v admine
            nevytvára ani nezobrazuje.
          </p>
        </div>
        <div>
          <label
            htmlFor="admin-create-user-email"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            E-mail
          </label>
          <Input
            id="admin-create-user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="meno@example.com"
            required
          />
        </div>
        <div>
          <label
            htmlFor="admin-create-user-name"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Meno
          </label>
          <Input
            id="admin-create-user-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Meno používateľa"
            maxLength={120}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Zrušiť
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={email.trim().length === 0}
            leftIcon={<UserPlus className="size-4" />}
          >
            Vytvoriť používateľa
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteUserModal({
  open,
  onClose,
  user: userData,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onDelete: () => Promise<void>;
}) {
  const [typedEmail, setTypedEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const canDelete = Boolean(userData?.email && typedEmail.trim() === userData.email);

  const handleClose = () => {
    if (!isPending) {
      setTypedEmail("");
      onClose();
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    startTransition(() => {
      void onDelete().then(() => setTypedEmail(""));
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Vymazať používateľa"
      description={userData?.email}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-error/20 bg-error/10 p-4">
          <p className="text-sm text-error">
            Vymazanie odstráni prihlasovanie používateľa aj údaje naviazané na
            jeho profil. Nedá sa to vrátiť späť.
          </p>
        </div>
        <div>
          <label
            htmlFor="admin-delete-user-email"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Pre potvrdenie napíšte e-mail používateľa
          </label>
          <Input
            id="admin-delete-user-email"
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
            placeholder={userData?.email || "email@example.com"}
            autoComplete="off"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Zrušiť
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={!canDelete}
            onClick={handleDelete}
            leftIcon={<Trash className="size-4" />}
          >
            Vymazať
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
  const [usersState, setUsersState] = useState<{
    users: AdminUser[];
    loading: boolean;
    error: string | null;
  }>({
    users: [],
    loading: true,
    error: null,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDeferredValue(search);
  const [modals, setModals] = useState<{
    create: boolean;
    ban: { open: boolean; user: AdminUser | null };
    delete: { open: boolean; user: AdminUser | null };
    edit: {
      open: boolean;
      user: AdminUser | null;
      email: string;
      fullName: string;
    };
  }>({
    create: false,
    ban: { open: false, user: null },
    delete: { open: false, user: null },
    edit: { open: false, user: null, email: "", fullName: "" },
  });
  const [impersonation, setImpersonation] = useState<{
    open: boolean;
    user: AdminUser | null;
    link: AdminUserImpersonationLink | null;
    loadingUserId: string | null;
  }>({
    open: false,
    user: null,
    link: null,
    loadingUserId: null,
  });

  const loadUsers = useCallback(async (query: string) => {
    setUsersState((current) => ({ ...current, loading: true, error: null }));

    try {
      const data = await getAdminUsers(query || undefined);
      setUsersState({ users: data, loading: false, error: null });
    } catch (caughtError) {
      console.error("Failed to fetch users:", caughtError);
      setUsersState({
        users: [],
        loading: false,
        error: "Používateľov sa nepodarilo načítať.",
      });
      toast.error("Nepodarilo sa načítať používateľov");
    }
  }, []);
  const loadUsersFromEffect = useEffectEvent((query: string) => {
    void loadUsers(query);
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadUsersFromEffect(debouncedSearch);
    });
  }, [debouncedSearch]);

  const handleCreateUser = async (input: { email: string; fullName: string }) => {
    try {
      const createdUser = await createAdminUser(input);
      setUsersState((prev) => ({
        ...prev,
        users: [createdUser, ...prev.users.filter((userData) => userData.id !== createdUser.id)],
      }));
      setModals((prev) => ({ ...prev, create: false }));
      toast.success("Používateľ vytvorený. E-mail na nastavenie hesla bol odoslaný.");
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error("Nepodarilo sa vytvoriť používateľa");
    }
  };

  const handleBanUser = async (reason: string) => {
    if (!currentUser || !modals.ban.user) return;

    try {
      await banUser(modals.ban.user.id, reason);
      setUsersState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === modals.ban.user?.id ? { ...u, is_banned: true } : u,
        ),
      }));
      setModals((prev) => ({ ...prev, ban: { open: false, user: null } }));
      toast.success("Používateľ zablokovaný");
    } catch (error) {
      console.error("Failed to ban user:", error);
      toast.error("Nepodarilo sa zablokovať používateľa");
    }
  };

  const handleUnbanUser = async (userData: AdminUser) => {
    if (!currentUser) return;

    try {
      await unbanUser(userData.id);
      setUsersState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userData.id ? { ...u, is_banned: false } : u,
        ),
      }));
      toast.success("Používateľ odblokovaný");
    } catch (error) {
      console.error("Failed to unban user:", error);
      toast.error("Nepodarilo sa odblokovať používateľa");
    }
  };

  const handleToggleDealerVerification = async (userData: AdminUser) => {
    if (!userData.dealer_id) return;

    try {
      await setDealerVerification(userData.dealer_id, !userData.dealer_is_verified);
      setUsersState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userData.id
            ? { ...u, dealer_is_verified: !u.dealer_is_verified }
            : u,
        ),
      }));
      toast.success(
        !userData.dealer_is_verified
          ? "Dealer bol overený"
          : "Overenie dealera bolo zrušené",
      );
    } catch (error) {
      console.error("Failed to toggle dealer verification:", error);
      toast.error("Nepodarilo sa zmeniť overenie dealera");
    }
  };

  const handleDeleteUser = async () => {
    const userData = modals.delete.user;
    if (!userData) return;

    try {
      await deleteAdminUser(userData.id);
      setUsersState((prev) => ({
        ...prev,
        users: prev.users.filter((user) => user.id !== userData.id),
      }));
      setModals((prev) => ({ ...prev, delete: { open: false, user: null } }));
      toast.success("Používateľ vymazaný");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Nepodarilo sa vymazať používateľa");
    }
  };

  const handleUpdateUser = async (input: { email: string; fullName: string }) => {
    const userData = modals.edit.user;
    if (!userData) return;

    try {
      const updated = await updateAdminUser({
        userId: userData.id,
        email: input.email,
        fullName: input.fullName,
      });
      setUsersState((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user.id === updated.id
            ? {
                ...user,
                email: updated.email,
                full_name: updated.full_name,
              }
            : user,
        ),
      }));
      setModals((prev) => ({
        ...prev,
        edit: { open: false, user: null, email: "", fullName: "" },
      }));
      toast.success("Používateľ upravený");
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Používateľa sa nepodarilo upraviť");
    }
  };

  const handleCreateImpersonationLink = async (userData: AdminUser) => {
    setImpersonation((prev) => ({ ...prev, loadingUserId: userData.id }));

    try {
      const link = await createAdminUserImpersonationLink(userData.id);
      setImpersonation({
        open: true,
        user: userData,
        link,
        loadingUserId: null,
      });
      toast.success("Prihlasovací odkaz je pripravený");
    } catch (error) {
      console.error("Failed to create impersonation link:", error);
      toast.error("Prihlasovací odkaz sa nepodarilo vytvoriť");
      setImpersonation((prev) => ({ ...prev, loadingUserId: null }));
    }
  };

  const { error, loading, users } = usersState;
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
                    className="size-5"
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
                variant="primary"
                size="sm"
                onClick={() => setModals((prev) => ({ ...prev, create: true }))}
                leftIcon={<UserPlus className="size-4" />}
              >
                Vytvoriť používateľa
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadUsers(debouncedSearch)}
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
              onClick={() => void loadUsers(debouncedSearch)}
            >
              Skúsiť znova
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
                  Overenie
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  Zostatok
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
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-10" variant="circular" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-16" />
                      </td>
                    </tr>
                  ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-text-secondary"
                  >
                    {debouncedSearch
                      ? "Pre tento filter sa nenašli žiadni používatelia"
                      : "Zatiaľ nie sú dostupní žiadni používatelia"}
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                    <UserRow
                      key={userData.id}
                      user={userData}
                      onToggleDealerVerification={() =>
                        void handleToggleDealerVerification(userData)
                      }
                      onBan={() =>
                        setModals((prev) => ({
                          ...prev,
                          ban: { open: true, user: userData },
                        }))
                      }
                      onUnban={() => void handleUnbanUser(userData)}
                      canBan={currentUser?.id !== userData.id}
                      onEdit={() =>
                        setModals((prev) => ({
                          ...prev,
                          edit: {
                            open: true,
                            user: userData,
                            email: userData.email,
                            fullName: userData.full_name || "",
                          },
                        }))
                      }
                      canEdit={
                        currentUser?.id !== userData.id && userData.role !== "admin"
                      }
                      onImpersonate={() => void handleCreateImpersonationLink(userData)}
                      canImpersonate={
                        currentUser?.id !== userData.id &&
                        userData.role !== "admin" &&
                        !userData.is_banned
                      }
                      impersonating={impersonation.loadingUserId === userData.id}
                      onDelete={() =>
                        setModals((prev) => ({
                          ...prev,
                          delete: { open: true, user: userData },
                        }))
                      }
                      canDelete={
                        currentUser?.id !== userData.id && userData.role !== "admin"
                      }
                    />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BanUserModal
        open={modals.ban.open}
        onClose={() =>
          setModals((prev) => ({ ...prev, ban: { open: false, user: null } }))
        }
        user={modals.ban.user}
        onBan={handleBanUser}
      />
      <CreateUserModal
        open={modals.create}
        onClose={() => setModals((prev) => ({ ...prev, create: false }))}
        onCreate={handleCreateUser}
      />
      <DeleteUserModal
        open={modals.delete.open}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            delete: { open: false, user: null },
          }))
        }
        user={modals.delete.user}
        onDelete={handleDeleteUser}
      />
      <EditUserModal
        open={modals.edit.open}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            edit: { open: false, user: null, email: "", fullName: "" },
          }))
        }
        user={modals.edit.user}
        email={modals.edit.email}
        fullName={modals.edit.fullName}
        onEmailChange={(value) =>
          setModals((prev) => ({
            ...prev,
            edit: { ...prev.edit, email: value },
          }))
        }
        onFullNameChange={(value) =>
          setModals((prev) => ({
            ...prev,
            edit: { ...prev.edit, fullName: value },
          }))
        }
        onUpdate={handleUpdateUser}
      />
      <ImpersonationLinkModal
        open={impersonation.open}
        user={impersonation.user}
        link={impersonation.link}
        onClose={() =>
          setImpersonation({
            open: false,
            user: null,
            link: null,
            loadingUserId: null,
          })
        }
      />
    </div>
  );
}
