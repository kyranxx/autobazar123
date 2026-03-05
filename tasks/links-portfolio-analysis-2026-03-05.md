# Links Portfolio Analysis (2026-03-05)

Source snapshot:
- `output/link_research/links-ingest/latest.json` (45 total entries, 45 unique, 0 duplicates)

Classification rules:
- `Now`: direct value to current Autobazar123 roadmap, low integration cost.
- `Later`: useful, but needs dedicated implementation time or clearer scope.
- `Skip`: low signal, unstable source, or weak fit for current priorities.

## Recommendation Matrix

- Use now: 15
- Use later: 16
- Skip for now: 14

## Use Now

- [x] `https://lawsofux.com/`  
  Why: Reliable UX heuristics for conversion and usability decisions.  
  Use case: Validate homepage/search CTA hierarchy before UI changes ship.

- [x] `https://www.figma.com/blog/introducing-codex-to-figma/`  
  Why: Matches our existing Figma-to-code workflow.  
  Use case: Speed up future homepage/layout redesign iterations with tighter design-engineering handoff.

- [x] `https://developers.cloudflare.com/changelog/post/2026-02-26-async-stale-while-revalidate/`  
  Why: Directly relevant to cache posture decisions.  
  Use case: Improve safe freshness strategy for non-personalized content routes.

- [x] `https://skills.sh/vercel-labs/agent-browser/dogfood`  
  Why: Practical browser-driven QA workflow we can adopt quickly.  
  Use case: Standardize reproducible manual+agent browser checks for critical journeys.

- [x] `https://github.com/millionco/react-doctor`  
  Why: Helps diagnose React issues faster.  
  Use case: Triage hydration/perf regressions before they reach production.

- [x] `https://react.email/`  
  Why: We already use React email tooling in stack.  
  Use case: Improve transactional email template quality and preview workflow.

- [x] `https://github.com/vercel-labs/web-interface-guidelines`  
  Why: Strong fit for our existing UI quality gates.  
  Use case: Use as checklist baseline for PR-level web interface reviews.

- [x] `https://github.com/vercel-labs/agent-browser`  
  Why: Aligns with our test and audit automation style.  
  Use case: Expand scripted browser audits for high-value routes.

- [x] `https://posthog.com/`  
  Why: High-value analytics capability reference for product decisions.  
  Use case: Instrument funnel events for listing creation and lead contact flows.

- [x] `https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices`  
  Why: Actionable React quality guidance for our stack.  
  Use case: Improve code review prompts/checklists around React ergonomics and performance.

- [x] `npx skills add coreyhaines31/marketingskills (checked: installs the marketing skills pack; prefer --skill flags for focused install)`  
  Why: Already aligned to our SEO/CRO effort and skill installation path.  
  Use case: Keep onboarding instructions simple for future research/implementation passes.

- [x] `https://autobazar123.sk/llms.txt`  
  Why: Current production endpoint we own and should maintain.  
  Use case: Periodic verification that AI-discoverability docs remain accurate after route changes.

- [x] `https://blog.cloudflare.com/markdown-for-agents`  
  Why: Relevant for machine-readable docs strategy.  
  Use case: Improve internal docs structure for agent-assisted maintenance.

- [x] `Programmatic SEO`  
  Why: Already a core growth lever in this codebase.  
  Use case: Continue scaling brand/model/city landing coverage safely.

- [x] `https://agents.md/`  
  Why: Directly relevant to our agent collaboration model.  
  Use case: Keep repository guidance format consistent and maintainable.

## Use Later

- [ ] `https://github.com/Dimillian/CodexMonitor`  
  Why: Useful observability for multi-agent workflows, but not blocking delivery.  
  Use case: Add when parallel-agent throughput becomes a frequent bottleneck.

- [ ] `https://github.com/ibelick/ui-skills`  
  Why: Helpful design polish references, but secondary to current reliability/security work.  
  Use case: Use during focused UI refresh cycles.

- [ ] `https://detail.design/`  
  Why: Good visual inspiration, but limited direct implementation guidance.  
  Use case: Moodboard source for future design explorations.

- [ ] `SEO.png in projects local main folder`  
  Why: Unknown artifact quality until reviewed.  
  Use case: Audit and extract any reusable keyword/content planning notes.

- [ ] `https://github.com/steipete/agent-scripts`  
  Why: Could improve automation ergonomics.  
  Use case: Borrow script patterns for repeated maintenance tasks.

- [ ] `https://github.com/KeygraphHQ/shannon`  
  Why: Security testing value is high, but adoption cost is non-trivial.  
  Use case: Evaluate for periodic autonomous pentest runs in security hardening cycles.

- [ ] `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`  
  Why: Potentially useful for UI improvements, needs quality screening.  
  Use case: Trial on one non-critical page redesign.

- [ ] `https://www.agenstskills.com/`  
  Why: Skills directory may be useful; requires curation effort.  
  Use case: Source vetted skills when we need capability expansion.

- [ ] `https://torph.lochie.me/`  
  Why: Nice micro-animation utility, but not a priority need.  
  Use case: Use for controlled hero text animation experiments.

- [ ] `https://ui.shadcn.com/llms.txt`  
  Why: Useful reference for machine-readable component docs patterns.  
  Use case: Mirror structure ideas in our own `llms.txt` maintenance process.

- [ ] `https://openai.com/sk-SK/index/introducing-aardvark/`  
  Why: Content appears access-restricted (403 in fetch), so actionability is currently low.  
  Use case: Re-check later if publicly accessible and relevant to workflow.

- [ ] `https://blog.cloudflare.com/code-mode-mcp/`  
  Why: Interesting for API tooling strategy, but optional for current milestones.  
  Use case: Consider when expanding Cloudflare automation depth.

- [ ] `https://codewiki.google/`  
  Why: Potentially useful for codebase intelligence, needs deeper evaluation.  
  Use case: Explore for architecture onboarding/document search aid.

- [ ] `https://github.com/Context-Engine-AI/Context-Engine`  
  Why: Context compression may help bigger agent sessions, but integration effort is unclear.  
  Use case: Pilot in large multi-file backlog passes.

- [ ] `https://github.com/Jeffallan/claude-skills`  
  Why: Broad skill pack; likely useful in parts, but requires filtering.  
  Use case: Cherry-pick specific ideas rather than full adoption.

- [ ] `https://github.com/davideast/stitch-mcp`  
  Why: Design-to-dev bridge is promising, but outside immediate priorities.  
  Use case: Evaluate when we run next major UI redesign program.

## Skip For Now

- [ ] `https://x.com/adamkpx/status/2023315986271670417?s=46&t=CXednS4RuOVkTvG-lFX96A`  
  Why: Social post context is unstable and hard to verify deeply.  
  Use case: Revisit only if a concrete implementation idea emerges.

- [ ] `https://www.oneusefulthing.org/p/a-guide-to-which-ai-to-use-in-the`  
  Why: Broad strategic article; low direct implementation leverage right now.  
  Use case: Optional reading for team context, not execution planning.

- [ ] `https://x.com/aiedge_/status/2020891784461894081`  
  Why: Low-structure source with uncertain durability.  
  Use case: None required for current roadmap.

- [ ] `https://x.com/poof_eth/status/2020541601739579626`  
  Why: Same low-signal social source profile.  
  Use case: None required for current roadmap.

- [ ] `https://gist.github.com/banteg/0ea5484d58e80b8223fcba64bd0d29db`  
  Why: Narrow snippet reference, limited project-wide value.  
  Use case: Re-open only if we need that exact CLI behavior.

- [ ] `https://x.com/ryancarson/status/2023452909883609111`  
  Why: Social post without durable implementation detail.  
  Use case: None required for current roadmap.

- [ ] `https://x.com/arscontexta/status/2023957499183829467`  
  Why: Social post with low reproducibility.  
  Use case: None required for current roadmap.

- [ ] `https://x.com/afterxleep/status/2024758925434789935`  
  Why: Social post with unclear action path.  
  Use case: None required for current roadmap.

- [ ] `https://github.com/sanyuan0704/code-review-expert`  
  Why: Overlaps with existing review process and adds little immediate differentiation.  
  Use case: Reconsider only if review quality regressions appear.

- [ ] `https://x.com/av1dlive/status/2023086925817729306`  
  Why: Low durability and low direct actionability.  
  Use case: None required for current roadmap.

- [ ] `https://www.reddit.com/r/codex/comments/1r4x4xc/i_ported_gemini_conductor_into_codex_and_damn_it`  
  Why: Community anecdote, not a stable implementation standard.  
  Use case: Optional inspiration only.

- [ ] `https://twin.so/`  
  Why: Not aligned to immediate Autobazar123 product/infra priorities.  
  Use case: Revisit if company-building automation becomes a target area.

- [ ] `https://x.com/burakeregar/status/2013615136502616225`  
  Why: Same low-signal social source profile.  
  Use case: None required for current roadmap.

- [ ] `https://x.com/HsanC_/status/2013265200577646962`  
  Why: Same low-signal social source profile.  
  Use case: None required for current roadmap.
