import { Suspense } from "react";
import { TopBar, TopBarFrame } from "@/components/dashboard/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <Suspense fallback={<TopBarFrame />}>
        <TopBar />
      </Suspense>
      <main className="flex-1">{children}</main>
    </div>
  );
}
