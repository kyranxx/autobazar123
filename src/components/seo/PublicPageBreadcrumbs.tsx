import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import {
  buildBreadcrumbSchemaItems,
  type BreadcrumbTrailItem,
} from "@/lib/seo/breadcrumbs";

export function PublicPageBreadcrumbs({
  items,
  currentHref,
  className,
}: {
  items: BreadcrumbTrailItem[];
  currentHref: string;
  className?: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbSchemaItems({ items, currentHref })}
      />
      <BreadcrumbTrail items={items} className={className} />
    </>
  );
}
