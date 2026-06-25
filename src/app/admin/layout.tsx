import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Autobazar123",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="main-content" className="scroll-landmark min-h-screen">
      {children}
    </div>
  );
}
