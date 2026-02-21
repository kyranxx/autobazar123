"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/shadcn/skeleton";

// Dynamically load search client to reduce initial bundle
const AlgoliaSearchPageClient = dynamic(
  () => import("./AlgoliaSearchPageClient"),
  {
    loading: () => <SearchPageSkeleton />,
    ssr: false,
  },
);

function SearchPageSkeleton() {
  const skeletonRows = [
    "result-skeleton-1",
    "result-skeleton-2",
    "result-skeleton-3",
    "result-skeleton-4",
    "result-skeleton-5",
    "result-skeleton-6",
  ];

  return (
    <main className="py-12">
      <div className="container-main grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </aside>
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4">
            {skeletonRows.map((skeletonKey) => (
              <Skeleton key={skeletonKey} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SearchPageClientWrapper() {
  return <AlgoliaSearchPageClient />;
}
