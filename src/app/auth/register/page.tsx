"use client";

import { useMemo, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function getRedirectTarget(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  const redirectParam = new URLSearchParams(window.location.search).get("redirect");
  return redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";
}

export default function RegisterPage() {
  const [showModal, setShowModal] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const redirectTo = useMemo(() => getRedirectTarget(), []);

  const handleClose = () => {
    setShowModal(false);
    router.push(redirectTo);
  };

  const handleContinue = () => {
    router.push(redirectTo);
  };

  if (user) {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-background flex items-center justify-center px-4"
      >
        <div className="w-full max-w-md rounded-xl border border-border-subtle bg-background-secondary p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-text-primary">Už ste prihlásený</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Pokračujte na požadovanú stránku.
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            Pokračovať
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-background flex items-center justify-center"
    >
      <h1 className="sr-only">Registrácia používateľa</h1>
      <AuthModal
        isOpen={showModal}
        onClose={handleClose}
        initialView="register"
      />
    </main>
  );
}
