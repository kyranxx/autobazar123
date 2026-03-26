import type { Metadata } from "next";
import PaymentSuccessClient from "./PaymentSuccessClient";

export const metadata: Metadata = {
  title: "Platba | Autobazar123",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <PaymentSuccessClient />
    </div>
  );
}
