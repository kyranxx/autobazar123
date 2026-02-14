"use client";

import { useEffect, useState, Suspense } from "react";
import AuthModal from "@/components/AuthModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const [showModal, setShowModal] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const redirectTo = searchParams.get("redirect") || "/";

  // If already logged in, redirect to destination
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleClose = () => {
    setShowModal(false);
    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <AuthModal isOpen={showModal} onClose={handleClose} initialView="login" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}

