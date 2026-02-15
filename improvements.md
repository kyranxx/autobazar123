# Cloudflare Performance Stack for Vercel + Supabase + Algolia

Goal: make the app blazing fast globally using Cloudflare in front of Vercel.

---

## ✅ Core Setup (High Impact, Low Risk)

### 1. DNS on Cloudflare
Use Cloudflare as the DNS provider for your domain.

Benefits:
- ultra fast DNS resolution
- built-in DDoS protection
- foundation for CDN + caching

---

### 2. CDN + Cache Rules (Biggest Speed Boost)

Create cache rules:

#### Static assets (cache hard)

Path patterns:
- /_next/static/*
- /assets/*
- /fonts/*

Settings:
- Edge TTL: 1 year
- Browser TTL: 1 year
- Immutable: true

---

#### Public pages (cache at edge)

Examples:
- /
- /pricing
- /blog/*
- /docs/*

Settings:
- Edge TTL: 1h – 24h
- Bypass cache on cookies (auth)
- Purge cache on deploy

---

#### Never cache

Paths:
- /api/*
- /dashboard/*
- /account/*
- any authenticated routes

---

## ⚡ 3. Enable Protocol Optimizations

Turn on in Cloudflare settings:
- Brotli compression
- HTTP/3 (QUIC)
- Auto minify (HTML, CSS, JS)

---

## 🚀 4. Tiered Cache

Enable Tiered Cache:

Benefits:
- faster cache hits globally
- fewer origin requests to Vercel
- lower costs

---

## 🧠 5. Cloudflare Workers (Edge Logic)

Use Workers to:

- rate-limit public APIs
- block bots and abuse
- cache expensive GET responses
- hide API keys
- pre-validate auth

Example use cases:
- /api/search-suggestions
- /api/public/*
- heavy read endpoints

---

## 🛡 6. Turnstile (Bot Protection)

Add Cloudflare Turnstile to:
- signup forms
- login
- contact forms
- public submissions

Blocks bots without annoying captchas.

---

## 💸 Optional Paid Speed Boosts

### Argo Smart Routing
- routes traffic through faster Cloudflare backbone paths
- noticeable global latency improvement

### Cache Reserve
- keeps cached assets longer
- fewer cache misses on large static libraries

---

## 🎯 Recommended Minimum for Most Apps

Must have:
- Cloudflare DNS
- CDN + cache rules
- Brotli + HTTP/3
- Tiered Cache

Add later when needed:
- Workers
- Argo
- Cache Reserve

---

## 🧭 Request Flow (mental model)

User
→ Cloudflare Edge (cache + protection + workers)
→ Vercel (Next.js app)
→ Supabase (DB/auth/storage)
→ Algolia (search)

---

## ⚠️ Important Rules

- Never cache authenticated content unless you fully control cache keys
- Always bypass cache on auth cookies
- Purge cache on every deploy
- Start simple, add Workers gradually

---

## ✅ Result

- global instant loads
- lower server load
- better reliability
- safer public endpoints
- scalable performance

---

End of document