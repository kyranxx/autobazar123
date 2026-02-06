"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
    const [showModal, setShowModal] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    // If already logged in, redirect to home
    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    const handleClose = () => {
        setShowModal(false);
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <AuthModal isOpen={showModal} onClose={handleClose} initialView="register" />
        </div>
    );
}
