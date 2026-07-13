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
  siteUrl,
}: {
  items: BreadcrumbTrailItem[];
  currentHref: string;
  className?: string;
  siteUrl?: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={buildBreadcrumbSchemaItems({ items, currentHref, siteUrl })}
      />
      <BreadcrumbTrail items={items} className={className} />
    </>
  );
}
