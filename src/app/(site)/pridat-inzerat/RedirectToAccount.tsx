"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToAccount() {
  const { replace } = useRouter();

  useEffect(() => {
    replace("/moj-ucet?tab=create");
  }, [replace]);

  return null;
}
