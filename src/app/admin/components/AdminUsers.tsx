"use client";

import { useLocale } from "next-intl";
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

type AdminUsersLocale = "sk" | "en";

type AdminUsersCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  usersCount: (count: number) => string;
  dealersCount: (count: number) => string;
  adminsCount: (count: number) => string;
  blockedCount: (count: number) => string;
  createUser: string;
  refresh: string;
  loadError: string;
  loadToastError: string;
  retry: string;
  emptySearch: string;
  empty: string;
  tableUser: string;
  tableType: string;
  tableVerification: string;
  tableBalance: string;
  tableAds: string;
  tableRegistration: string;
  tableActions: string;
  roleAdmin: string;
  roleDealer: string;
  roleUser: string;
  verifiedDealer: string;
  dealerWaiting: string;
  blockedBadge: string;
  unblock: string;
  deleteUser: string;
  cancel: string;
  close: string;
  copied: string;
  copyLink: string;
  openLink: string;
  edit: string;
  saveChanges: string;
  blockUser: string;
  verifyDealer: string;
  removeVerification: string;
  openAsUser: string;
  ownAccount: string;
  adminAccount: string;
  editUserTitle: string;
  editUserHelp: string;
  email: string;
  name: string;
  emailPlaceholder: string;
  namePlaceholder: string;
  impersonationTitle: string;
  privateWindowTitle: string;
  privateWindowHelp: string;
  userFallback: string;
  createUserDescription: string;
  passwordSetupEmailTitle: string;
  passwordSetupEmailHelp: string;
  deleteUserTitle: string;
  deleteUserWarning: string;
  deleteUserConfirmLabel: string;
  deleteUserPlaceholder: string;
  banUserTitle: string;
  banUserWarning: string;
  banReason: string;
  banReasonPlaceholder: string;
  toastUserCreated: string;
  toastCreateFailed: string;
  toastUserBlocked: string;
  toastBlockFailed: string;
  toastUserUnblocked: string;
  toastUnblockFailed: string;
  toastDealerVerified: string;
  toastDealerUnverified: string;
  toastDealerVerificationFailed: string;
  toastUserDeleted: string;
  toastDeleteFailed: string;
  toastUserUpdated: string;
  toastUpdateFailed: string;
  toastLinkReady: string;
  toastLinkFailed: string;
  toastLinkCopied: string;
  toastLinkCopyFailed: string;
};

const ADMIN_USERS_COPY: Record<AdminUsersLocale, AdminUsersCopy> = {
  sk: {
    eyebrow: "Používatelia",
    title: "Používatelia a dealeri",
    subtitle:
      "Nájdite účet, otvorte ho na kontrolu, upravte údaje alebo vytvorte nový účet pre zákazníka.",
    searchPlaceholder: "Hľadať používateľa (e-mail, meno)...",
    usersCount: (count) => `${count} používateľov`,
    dealersCount: (count) => `${count} dealerov`,
    adminsCount: (count) => `${count} adminov`,
    blockedCount: (count) => `${count} blokovaných`,
    createUser: "Vytvoriť používateľa",
    refresh: "Obnoviť",
    loadError: "Používateľov sa nepodarilo načítať.",
    loadToastError: "Nepodarilo sa načítať používateľov",
    retry: "Skúsiť znova",
    emptySearch: "Pre tento filter sa nenašli žiadni používatelia",
    empty: "Zatiaľ nie sú dostupní žiadni používatelia",
    tableUser: "Používateľ",
    tableType: "Typ",
    tableVerification: "Overenie",
    tableBalance: "Zostatok",
    tableAds: "Inzeráty",
    tableRegistration: "Registrácia",
    tableActions: "Akcie",
    roleAdmin: "Admin",
    roleDealer: "Dealer",
    roleUser: "Používateľ",
    verifiedDealer: "Overený dealer",
    dealerWaiting: "Dealer čaká na overenie",
    blockedBadge: "Blokovaný",
    unblock: "Odblokovať",
    deleteUser: "Vymazať",
    cancel: "Zrušiť",
    close: "Zavrieť",
    copied: "Skopírované",
    copyLink: "Kopírovať odkaz",
    openLink: "Otvoriť odkaz",
    edit: "Upraviť",
    saveChanges: "Uložiť zmeny",
    blockUser: "Zablokovať",
    verifyDealer: "Overiť",
    removeVerification: "Zrušiť overenie",
    openAsUser: "Prihlásiť ako",
    ownAccount: "Váš účet",
    adminAccount: "Admin účet",
    editUserTitle: "Upraviť používateľa",
    editUserHelp:
      "Zmení sa prihlasovací e-mail aj profil používateľa. Admin účty sa upravujú samostatne.",
    email: "E-mail",
    name: "Meno",
    emailPlaceholder: "meno@example.com",
    namePlaceholder: "Meno používateľa",
    impersonationTitle: "Prihlásiť ako používateľ",
    privateWindowTitle: "Odporúčané: súkromné okno",
    privateWindowHelp:
      "Odkaz otvorí účet používateľa. Najbezpečnejšie je otvoriť ho v súkromnom okne, aby sa vám neprepísalo admin prihlásenie.",
    userFallback: "Používateľ",
    createUserDescription: "Účet bude pripravený hneď.",
    passwordSetupEmailTitle: "E-mail na nastavenie hesla",
    passwordSetupEmailHelp:
      "Používateľ dostane e-mail na nastavenie hesla. Heslo sa v admine nevytvára ani nezobrazuje.",
    deleteUserTitle: "Vymazať používateľa",
    deleteUserWarning:
      "Vymazanie odstráni prihlasovanie používateľa aj údaje naviazané na jeho profil. Nedá sa to vrátiť späť.",
    deleteUserConfirmLabel: "Pre potvrdenie napíšte e-mail používateľa",
    deleteUserPlaceholder: "email@example.com",
    banUserTitle: "Zablokovať používateľa",
    banUserWarning:
      "Táto akcia zablokuje používateľa a znemožní mu prístup k platforme.",
    banReason: "Dôvod zablokovania",
    banReasonPlaceholder: "Popíšte dôvod...",
    toastUserCreated:
      "Používateľ vytvorený. E-mail na nastavenie hesla bol odoslaný.",
    toastCreateFailed: "Nepodarilo sa vytvoriť používateľa",
    toastUserBlocked: "Používateľ zablokovaný",
    toastBlockFailed: "Nepodarilo sa zablokovať používateľa",
    toastUserUnblocked: "Používateľ odblokovaný",
    toastUnblockFailed: "Nepodarilo sa odblokovať používateľa",
    toastDealerVerified: "Dealer bol overený",
    toastDealerUnverified: "Overenie dealera bolo zrušené",
    toastDealerVerificationFailed: "Nepodarilo sa zmeniť overenie dealera",
    toastUserDeleted: "Používateľ vymazaný",
    toastDeleteFailed: "Nepodarilo sa vymazať používateľa",
    toastUserUpdated: "Používateľ upravený",
    toastUpdateFailed: "Používateľa sa nepodarilo upraviť",
    toastLinkReady: "Prihlasovací odkaz je pripravený",
    toastLinkFailed: "Prihlasovací odkaz sa nepodarilo vytvoriť",
    toastLinkCopied: "Odkaz skopírovaný",
    toastLinkCopyFailed: "Odkaz sa nepodarilo skopírovať",
  },
  en: {
    eyebrow: "Users",
    title: "Users and dealers",
    subtitle:
      "Find an account, open it for support, edit details, or create a new customer account.",
    searchPlaceholder: "Search user (email, name)...",
    usersCount: (count) => `${count} users`,
    dealersCount: (count) => `${count} dealers`,
    adminsCount: (count) => `${count} admins`,
    blockedCount: (count) => `${count} blocked`,
    createUser: "Create user",
    refresh: "Refresh",
    loadError: "Users could not be loaded.",
    loadToastError: "Unable to load users",
    retry: "Try again",
    emptySearch: "No users match this filter",
    empty: "No users are available yet",
    tableUser: "User",
    tableType: "Type",
    tableVerification: "Verification",
    tableBalance: "Balance",
    tableAds: "Listings",
    tableRegistration: "Registered",
    tableActions: "Actions",
    roleAdmin: "Admin",
    roleDealer: "Dealer",
    roleUser: "User",
    verifiedDealer: "Verified dealer",
    dealerWaiting: "Dealer waiting for verification",
    blockedBadge: "Blocked",
    unblock: "Unblock",
    deleteUser: "Delete user",
    cancel: "Cancel",
    close: "Close",
    copied: "Copied",
    copyLink: "Copy link",
    openLink: "Open link",
    edit: "Edit",
    saveChanges: "Save changes",
    blockUser: "Block",
    verifyDealer: "Verify",
    removeVerification: "Remove verification",
    openAsUser: "Open as user",
    ownAccount: "Your account",
    adminAccount: "Admin account",
    editUserTitle: "Edit user",
    editUserHelp:
      "This changes the login email and user profile. Admin accounts are managed separately.",
    email: "Email",
    name: "Name",
    emailPlaceholder: "name@example.com",
    namePlaceholder: "User name",
    impersonationTitle: "Open as user",
    privateWindowTitle: "Private window recommended",
    privateWindowHelp:
      "The link opens the user's account. Open it in a private window so your admin login is not replaced.",
    userFallback: "User",
    createUserDescription: "The account will be ready immediately.",
    passwordSetupEmailTitle: "Password setup email",
    passwordSetupEmailHelp:
      "The user receives an email to set a password. Passwords are not created or shown in admin.",
    deleteUserTitle: "Delete user",
    deleteUserWarning:
      "Deleting removes the user's login and profile-linked data. This cannot be undone.",
    deleteUserConfirmLabel: "Type the user's email to confirm",
    deleteUserPlaceholder: "email@example.com",
    banUserTitle: "Block user",
    banUserWarning:
      "This blocks the user and prevents access to the platform.",
    banReason: "Block reason",
    banReasonPlaceholder: "Describe the reason...",
    toastUserCreated: "User created. Password setup email was sent.",
    toastCreateFailed: "Unable to create user",
    toastUserBlocked: "User blocked",
    toastBlockFailed: "Unable to block user",
    toastUserUnblocked: "User unblocked",
    toastUnblockFailed: "Unable to unblock user",
    toastDealerVerified: "Dealer verified",
    toastDealerUnverified: "Dealer verification removed",
    toastDealerVerificationFailed: "Unable to change dealer verification",
    toastUserDeleted: "User deleted",
    toastDeleteFailed: "Unable to delete user",
    toastUserUpdated: "User updated",
    toastUpdateFailed: "Unable to update user",
    toastLinkReady: "Login link is ready",
    toastLinkFailed: "Unable to create login link",
    toastLinkCopied: "Link copied",
    toastLinkCopyFailed: "Unable to copy link",
  },
};

function getAdminUsersLocale(locale: string): AdminUsersLocale {
  return locale === "en" ? "en" : "sk";
}

function formatAdminUsersDate(locale: AdminUsersLocale, value: string) {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-GB" : "sk-SK");
}

function UserRow({
  user: userData,
  copy,
  locale,
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
  copy: AdminUsersCopy;
  locale: AdminUsersLocale;
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
        return <Badge variant="accent">{copy.roleAdmin}</Badge>;
      case "dealer":
        return <Badge variant="success">{copy.roleDealer}</Badge>;
      default:
        return <Badge variant="default">{copy.roleUser}</Badge>;
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
            <Badge variant="success">{copy.verifiedDealer}</Badge>
          ) : (
            <Badge variant="warning">{copy.dealerWaiting}</Badge>
          )
        ) : (
          <span className="text-text-secondary text-sm">-</span>
        )}
      </td>
      <td className="p-4">
        {userData.is_dealer ? (
          <span className="font-semibold text-text-primary">
            {(userData.dealer_prepaid_balance_cents / 100).toLocaleString(
              locale === "en" ? "en-GB" : "sk-SK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}{" "}
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
          {formatAdminUsersDate(locale, userData.created_at)}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {userData.is_banned ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="error">{copy.blockedBadge}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnban}
                className="text-success hover:bg-success/10"
              >
                {copy.unblock}
              </Button>
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-error hover:bg-error/10"
                  leftIcon={<Trash className="size-4" />}
                >
                  {copy.deleteUser}
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
                  title={
                    userData.dealer_is_verified
                      ? copy.removeVerification
                      : copy.verifyDealer
                  }
                >
                  {userData.dealer_is_verified
                    ? copy.removeVerification
                    : copy.verifyDealer}
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
                  {copy.openAsUser}
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
                  {copy.edit}
                </Button>
              ) : null}
              {canBan ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBan}
                  className="text-error hover:bg-error/10"
                >
                  {copy.blockUser}
                </Button>
              ) : (
                <span className="text-sm text-text-muted">{copy.ownAccount}</span>
              )}
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-error hover:bg-error/10"
                  leftIcon={<Trash className="size-4" />}
                >
                  {copy.deleteUser}
                </Button>
              ) : userData.role === "admin" && canBan ? (
                <span className="text-sm text-text-muted">{copy.adminAccount}</span>
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
  copy,
  email,
  fullName,
  onEmailChange,
  onFullNameChange,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  copy: AdminUsersCopy;
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
      title={copy.editUserTitle}
      description={userData?.email}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
          <p className="text-sm text-text-secondary">
            {copy.editUserHelp}
          </p>
        </div>
        <div>
          <label
            htmlFor="admin-edit-user-email"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            {copy.email}
          </label>
          <Input
            id="admin-edit-user-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder={copy.emailPlaceholder}
            required
          />
        </div>
        <div>
          <label
            htmlFor="admin-edit-user-name"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            {copy.name}
          </label>
          <Input
            id="admin-edit-user-name"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder={copy.namePlaceholder}
            maxLength={120}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {copy.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={email.trim().length === 0}
            leftIcon={<PencilSimple className="size-4" />}
          >
            {copy.saveChanges}
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
  copy,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  link: AdminUserImpersonationLink | null;
  copy: AdminUsersCopy;
}) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copied = Boolean(link?.url && copiedUrl === link.url);

  const handleCopy = async () => {
    if (!link?.url) return;

    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedUrl(link.url);
      toast.success(copy.toastLinkCopied);
    } catch (error) {
      console.error("Failed to copy impersonation link:", error);
      toast.error(copy.toastLinkCopyFailed);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.impersonationTitle}
      description={link?.email || userData?.email}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="mb-1 text-sm font-semibold text-text-primary">
            {copy.privateWindowTitle}
          </p>
          <p className="text-sm text-text-primary">
            {copy.privateWindowHelp}
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-background-secondary p-3">
          <p className="text-sm font-medium text-text-primary">
            {link?.fullName || userData?.full_name || copy.userFallback}
          </p>
          <p className="text-sm text-text-secondary">{link?.email || userData?.email}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            {copy.close}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            disabled={!link?.url}
            leftIcon={<CopySimple className="size-4" />}
          >
            {copied ? copy.copied : copy.copyLink}
          </Button>
          {link?.url ? (
            <Button asChild variant="primary">
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut className="size-4" />
                {copy.openLink}
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
  copy,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { email: string; fullName: string }) => Promise<void>;
  copy: AdminUsersCopy;
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
      title={copy.createUser}
      description={copy.createUserDescription}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
          <p className="mb-1 text-sm font-semibold text-text-primary">
            {copy.passwordSetupEmailTitle}
          </p>
          <p className="text-sm text-text-secondary">
            {copy.passwordSetupEmailHelp}
          </p>
        </div>
        <div>
          <label
            htmlFor="admin-create-user-email"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            {copy.email}
          </label>
          <Input
            id="admin-create-user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.emailPlaceholder}
            required
          />
        </div>
        <div>
          <label
            htmlFor="admin-create-user-name"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            {copy.name}
          </label>
          <Input
            id="admin-create-user-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder={copy.namePlaceholder}
            maxLength={120}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {copy.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={email.trim().length === 0}
            leftIcon={<UserPlus className="size-4" />}
          >
            {copy.createUser}
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
  copy,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onDelete: () => Promise<void>;
  copy: AdminUsersCopy;
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
      title={copy.deleteUserTitle}
      description={userData?.email}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-error/20 bg-error/10 p-4">
          <p className="text-sm text-error">
            {copy.deleteUserWarning}
          </p>
        </div>
        <div>
          <label
            htmlFor="admin-delete-user-email"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            {copy.deleteUserConfirmLabel}
          </label>
          <Input
            id="admin-delete-user-email"
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
            placeholder={userData?.email || copy.deleteUserPlaceholder}
            autoComplete="off"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {copy.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={!canDelete}
            onClick={handleDelete}
            leftIcon={<Trash className="size-4" />}
          >
            {copy.deleteUser}
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
  copy,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onBan: (reason: string) => void;
  copy: AdminUsersCopy;
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
      title={copy.banUserTitle}
      description={userData?.email}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-error/10 border border-error/20">
          <p className="text-sm text-error">
            {copy.banUserWarning}
          </p>
        </div>
        <div>
          <label htmlFor="admin-user-ban-reason" className="block text-sm font-medium text-text-secondary mb-2">
            {copy.banReason}
          </label>
          <textarea id="admin-user-ban-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={copy.banReasonPlaceholder}
            className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-error"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {copy.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleBan}
            loading={isPending}
            className="bg-error hover:bg-error/90"
          >
            {copy.blockUser}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const locale = getAdminUsersLocale(useLocale());
  const copy = ADMIN_USERS_COPY[locale];
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
        error: copy.loadError,
      });
      toast.error(copy.loadToastError);
    }
  }, [copy.loadError, copy.loadToastError]);
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
      toast.success(copy.toastUserCreated);
    } catch (error) {
      console.error("Failed to create user:", error);
      toast.error(copy.toastCreateFailed);
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
      toast.success(copy.toastUserBlocked);
    } catch (error) {
      console.error("Failed to ban user:", error);
      toast.error(copy.toastBlockFailed);
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
      toast.success(copy.toastUserUnblocked);
    } catch (error) {
      console.error("Failed to unban user:", error);
      toast.error(copy.toastUnblockFailed);
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
          ? copy.toastDealerVerified
          : copy.toastDealerUnverified,
      );
    } catch (error) {
      console.error("Failed to toggle dealer verification:", error);
      toast.error(copy.toastDealerVerificationFailed);
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
      toast.success(copy.toastUserDeleted);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(copy.toastDeleteFailed);
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
      toast.success(copy.toastUserUpdated);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(copy.toastUpdateFailed);
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
      toast.success(copy.toastLinkReady);
    } catch (error) {
      console.error("Failed to create impersonation link:", error);
      toast.error(copy.toastLinkFailed);
      setImpersonation((prev) => ({ ...prev, loadingUserId: null }));
    }
  };

  const { error, loading, users } = usersState;
  const adminCount = users.filter((userData) => userData.role === "admin").length;
  const dealerCount = users.filter((userData) => userData.role === "dealer").length;
  const bannedCount = users.filter((userData) => userData.is_banned).length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {copy.eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary">{copy.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">
          {copy.subtitle}
        </p>
      </section>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <Input
                placeholder={copy.searchPlaceholder}
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
              <Badge variant="default">{copy.usersCount(users.length)}</Badge>
              <Badge variant="success">{copy.dealersCount(dealerCount)}</Badge>
              <Badge variant="accent">{copy.adminsCount(adminCount)}</Badge>
              <Badge variant={bannedCount > 0 ? "error" : "default"}>
                {copy.blockedCount(bannedCount)}
              </Badge>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModals((prev) => ({ ...prev, create: true }))}
                leftIcon={<UserPlus className="size-4" />}
              >
                {copy.createUser}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadUsers(debouncedSearch)}
              >
                {copy.refresh}
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
              {copy.retry}
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
                  {copy.tableUser}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  {copy.tableType}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  {copy.tableVerification}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  {copy.tableBalance}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  {copy.tableAds}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  {copy.tableRegistration}
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-text-secondary">
                  {copy.tableActions}
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
                      ? copy.emptySearch
                      : copy.empty}
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                    <UserRow
                      key={userData.id}
                      user={userData}
                      copy={copy}
                      locale={locale}
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
        copy={copy}
      />
      <CreateUserModal
        open={modals.create}
        onClose={() => setModals((prev) => ({ ...prev, create: false }))}
        onCreate={handleCreateUser}
        copy={copy}
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
        copy={copy}
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
        copy={copy}
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
        copy={copy}
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
