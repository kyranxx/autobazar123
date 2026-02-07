# ⚡ Quick Start - Session 3 (Feb 8)

**Before you start:** Read NEXT_SESSION_TASKS.md (15 min)

---

## 🎯 Your Mission Today

Get to **85% project completion** (from current 79%)

Focus: **Image optimization + Performance** (8 hours of work)

---

## 📋 Task Checklist (In Order)

### TASK 1: Image Lazy Loading (90 min)
```bash
# 1. Create new component
touch src/components/OptimizedImage.tsx

# 2. Copy template from NEXT_SESSION_TASKS.md lines 31-73

# 3. Update these files:
src/components/CarCard.tsx
src/components/search/CarHit.tsx  
src/components/RecentlySoldFeedClient.tsx
src/components/FeaturedCarsClient.tsx

# 4. Test
npm run build  # Should pass
npm run dev    # Visit a page, check DevTools Network
```

**Success Criteria:**
- ✅ No TypeScript errors
- ✅ Images use loading="lazy"
- ✅ npm run build passes

---

### TASK 2: Bundle Size Analysis (60 min)
```bash
# 1. Install analyzer
npm install --save-dev @next/bundle-analyzer

# 2. Run analysis
npm run analyze

# 3. Takes ~30 seconds, opens browser with visualization

# 4. Take screenshot of top 10 largest
# 5. Document findings in NEXT_SESSION_TASKS.md
```

**Success Criteria:**
- ✅ Know your 5 largest dependencies
- ✅ Have reduction strategy
- ✅ Expected: current ~450KB → target 350KB

---

### TASK 3: Dynamic Imports Setup (90 min)

**For Map Component:**
```tsx
// src/components/map/Map.tsx (or wherever map is)
'use client';
import dynamic from 'next/dynamic';

// Wrap in dynamic import in pages that use it:
const Map = dynamic(() => import('@/components/map/Map'), {
  loading: () => <div>Loading map...</div>,
  ssr: false,
});
```

**For Search:**
```tsx
// Same pattern for search/algolia components
const AlgoliaSearch = dynamic(...);
```

**Files to Update:**
- [ ] Page using maps
- [ ] Page using search
- [ ] Page using calculator (if heavy)

**Success Criteria:**
- ✅ Build passes
- ✅ Dynamic components load on demand
- ✅ Loading states show

---

### TASK 4: ISR & Caching (90 min)

**Enable ISR in routes:**
```tsx
// src/app/[brand]/[model]/[city]/page.tsx
export const revalidate = 3600; // 1 hour

// Or on-demand revalidation:
export const dynamicParams = true;

export default function Page() {
  // Your component
}
```

**Add cache headers to next.config.ts:**
```tsx
// In headers() function, add:
{
  source: '/auto/:id',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=3600, s-maxage=86400',
    },
  ],
},
{
  source: '/predajca/:slug',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=1800, s-maxage=3600',
    },
  ],
},
```

**Files to Update:**
- [ ] next.config.ts (add cache headers)
- [ ] src/app/[brand]/[model]/[city]/page.tsx (add revalidate)
- [ ] src/app/predajca/[slug]/page.tsx (add revalidate)

**Success Criteria:**
- ✅ Build passes
- ✅ curl -I shows Cache-Control headers
- ✅ Pages revalidate on schedule

---

### TASK 5: Performance Testing (120 min)

**Step 1: Check Current Score**
```
Visit: https://pagespeed.web.dev/
URL: https://autobazar123.sk/
Record baseline scores
```

**Step 2: Test Locally**
```bash
# Start dev server
npm run dev

# In another terminal, test home page
npm run test:e2e
```

**Step 3: Check Metrics**
- LCP (Largest Contentful Paint) - target: <2.5s
- FID (First Input Delay) - target: <100ms
- CLS (Cumulative Layout Shift) - target: <0.1
- PageSpeed Score - target: 85+ (mobile), 90+ (desktop)

**Step 4: Test Slow Network**
```
DevTools → Network → Throttling → Slow 3G
Refresh page → Should still be responsive
```

**Step 5: Document Findings**
Create: PERFORMANCE_RESULTS.md with before/after scores

**Success Criteria:**
- ✅ Baseline scores recorded
- ✅ Local testing passes
- ✅ Slow network still usable
- ✅ Results documented

---

## 🔄 Daily Workflow

### Morning (Get Started)
1. Read QUICK_REFERENCE.md (2 min)
2. Read NEXT_SESSION_TASKS.md (10 min)
3. Start TASK 1

### Midday (Check Progress)
1. npm run build (verify)
2. Check diagnostics
3. Continue next task

### Evening (Wrap Up)
1. Complete current task
2. Document progress
3. Update PROJECT_STATUS_DASHBOARD.txt
4. Commit code to git

---

## ✅ Verification Commands

Run these multiple times throughout the day:

```bash
# Check build
npm run build

# Check TypeScript
npx tsc --noEmit

# Check lint
npm run lint

# Check dev server
npm run dev

# Check health endpoint
curl http://localhost:3000/api/health
```

All should pass ✅

---

## 🎯 Success Criteria for End of Day

- [ ] Image lazy loading implemented
- [ ] Bundle analysis completed
- [ ] Dynamic imports for 3+ components
- [ ] ISR enabled on key routes
- [ ] Cache headers configured
- [ ] Performance tested
- [ ] All metrics documented
- [ ] npm run build passing
- [ ] 0 TypeScript errors
- [ ] Code committed to git

---

## ⚠️ If Something Breaks

### Build fails
```bash
# 1. Check error message
npm run build 2>&1 | grep -i error

# 2. Undo last change
git diff HEAD

# 3. Fix or revert
git checkout -- [file]
```

### TypeScript errors
```bash
# Check what's wrong
npx tsc --noEmit

# Usually: missing import or wrong type
# Fix: Add import or update type
```

### Dev server won't start
```bash
# Kill any existing process
lsof -i :3000  # On Mac/Linux
netstat -ano | findstr :3000  # On Windows

# Clear cache
rm -rf .next node_modules/.cache

# Restart
npm run dev
```

---

## 📚 Documentation References

**For questions about:**
- Image optimization → NEXT_SESSION_TASKS.md Priority 1
- Bundle analysis → NEXT_SESSION_TASKS.md Priority 2  
- Dynamic imports → NEXT_SESSION_TASKS.md Priority 3
- ISR/Caching → NEXT_SESSION_TASKS.md Priority 4
- Performance testing → NEXT_SESSION_TASKS.md Priority 5
- Error handling → RELIABILITY_GUIDE.md
- General status → EXECUTIVE_SUMMARY.md

---

## 🚀 Expected Outcome

After 8 hours of focused work:

| Metric | Current | Target |
|--------|---------|--------|
| Project % | 79% | 85%+ |
| PageSpeed | 45 | 85+ |
| LCP | 2.5s | 2.0s |
| Repeat Visit | 2.5s | 0.5s |
| Bundle Size | 450KB | 350KB |
| Build Time | 24s | 22s |

**Plus:** Launch-ready status by end of week ✅

---

## 💡 Pro Tips

1. **Test frequently** - Don't code for hours then test
2. **Commit often** - Small commits are easier to fix
3. **Read the task doc** - NEXT_SESSION_TASKS.md is gold
4. **Use DevTools** - Network tab shows what's slow
5. **Document as you go** - Don't save it all for the end

---

## ⏰ Time Estimate

```
Task 1 (Image lazy):          90 min ⏱️
Task 2 (Bundle analysis):     60 min ⏱️
Task 3 (Dynamic imports):     90 min ⏱️
Task 4 (ISR/Caching):         90 min ⏱️
Task 5 (Performance test):   120 min ⏱️
─────────────────────────────────────
TOTAL:                       450 min (7.5 hours) ⏱️
Buffer:                       30 min (for issues)
─────────────────────────────────────
Target: 8 hours of focused work ✅
```

---

## 🎉 Ready?

**YES!** Start with:

```bash
# 1. Read the full task list
cat NEXT_SESSION_TASKS.md

# 2. Create a branch
git checkout -b performance/image-lazy-loading

# 3. Start coding!
touch src/components/OptimizedImage.tsx
```

Good luck! You got this! 🚀

---

**Session Starts:** Feb 8, 2026  
**Session Target:** 85% completion + 85+ PageSpeed score  
**Next Review:** Feb 8, 2026 @ 6:00 PM  

