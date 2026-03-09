# Codex Security Threat Model

## What the system is designed to do

Autobazar123 is a car marketplace that lets users browse listings, manage accounts, publish ads, and complete payment-related flows. The system is designed to keep listing integrity, account security, and payment correctness reliable across web and API surfaces.

## Where the system is exposed

- Public web routes and search/filter UI
- Authentication and account-management endpoints
- Ad creation/editing and media upload flows
- Payment and billing integrations
- Admin and scheduled workflow automation endpoints
- Third-party service integrations (Supabase, Algolia fallback, Stripe, monitoring webhooks)

## Trust boundaries

- Browser client to Next.js application server
- Application server to Supabase (anon/service/admin contexts)
- Application server to payment and search providers
- GitHub Actions/workflow automation to repository and deployment infrastructure
- Authenticated user roles (public, user, dealer, admin) and route-level authorization boundaries

## How to use this document in Codex Security

1. Before implementation, identify which trust boundaries the change touches.
2. During review, list new attack surfaces, sensitive data paths, and abuse cases.
3. In PRs, complete Threat Model / Security Review checklist items and reference this document.
4. If no security impact is detected, state that explicitly with rationale.
