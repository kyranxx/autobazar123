# 🚀 Performance Optimization Plan
**Goal:** PageSpeed 90+ on all metrics | Core Web Vitals passing | <2s load time

## Priority 1: Image Optimization (2-3 days)
### Current Issue
- Images not lazy-loaded
- No srcset for responsive images
- Unsplash images not optimized
- Missing WebP/AVIF variants

### Tasks
- [x] Add Image component with lazy loading
- [ ] Implement cloudflare-images integration
- [ ] Add srcset to all large images
- [ ] Create image optimization middleware
- [ ] Compress existing images

## Priority 2: Code Splitting & Bundle (2 days)
### Current Issue
- Large initial bundle (450KB)
- No dynamic imports for heavy components
- Dead code not eliminated

### Tasks
- [ ] Dynamic imports for heavy libraries (react-leaflet, react-instantsearch)
- [ ] Tree-shaking verification
- [ ] Component code splitting
- [ ] Route-based splitting

## Priority 3: Caching Strategy (1 day)
### Current Issue
- No ISR for dynamic pages
- Cache headers partially set
- No service worker

### Tasks
- [ ] Add ISR to product pages
- [ ] Implement service worker for offline
- [ ] Cache-Control headers for all routes
- [ ] Redis caching for API responses

## Priority 4: Font Optimization (1 day)
### Current Issue
- Google Fonts not optimized
- No font-display: swap

### Tasks
- [ ] Add font-display: swap
- [ ] Subset critical fonts
- [ ] Preload critical fonts

## Priority 5: Third-Party Scripts (1 day)
### Current Issue
- Stripe script not async
- Algolia blocking

### Tasks
- [ ] Make Stripe script async
- [ ] Defer non-critical scripts
- [ ] Use Web Workers for heavy JS

---

## Implementation Progress
- Current Score: ~45 (PageSpeed Insights)
- Target Score: 90+
- Estimated Time: 5-8 days
- Priority: CRITICAL

