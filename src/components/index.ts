/**
 * Optimized component barrel exports
 * Use selective imports instead of importing entire default exports
 */

// UI Components
export { Badge } from "./ui/shadcn/badge";
export { LoadingSpinner } from "./ui/LoadingSpinner";
export { Modal } from "./ui/shadcn/modal";
export { Input } from "./ui/shadcn/input";
export { FormField } from "./ui/FormField";
// Icons are exported individually from './ui/Icons'

// Common Components
export { default as Navbar } from "./Navbar";
export { default as Footer } from "./Footer";
export { ErrorBoundary } from "./ErrorBoundary";
export { OptimizedImage } from "./OptimizedImage";
export { LazyImage } from "./LazyImage";
export { default as CookieBanner } from "./CookieBanner";

// Features (use dynamic import in routes)
// export { default as FeaturedCars } from './FeaturedCars';
// export { default as RecentlySoldFeed } from './RecentlySoldFeed';
// export { default as SimpleMap } from './SimpleMap';
