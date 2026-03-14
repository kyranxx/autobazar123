"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToAccount() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/moj-ucet?tab=create");
  }, [router]);

  return null;
}
