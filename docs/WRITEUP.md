# Resume & Portfolio Writeup

Copy-paste-ready copy for different contexts. Trim to fit whatever space constraint you're working
with — the bullet points are ordered by impact, so cutting from the bottom is safe.

---

## Resume bullet points (pick 2-4 depending on space)

- Built a full-stack context-engineering toolkit (React, Node/Express, MongoDB) implementing
  semantic chunk selection (embeddings + MMR), extractive compression, and LLM-based summarization
  in a single orchestrated pipeline that only invokes the LLM when free methods measurably fall
  short — reducing unnecessary API cost by design, not just in outcome
- Designed and shipped a cost-conscious pipeline architecture: automatically escalates from free,
  local computation (transformers.js embeddings, TF-IDF fallback, extractive scoring) to a paid LLM
  call only when a measured "meaning-preserved" threshold isn't met, then validates the decision
  with a real raw-vs-engineered answer comparison
- Wrote 45 automated interaction tests (Vitest, React Testing Library) covering every interactive
  component; found and fixed a real UX bug (a dropdown missing click-outside-to-close behavior) via
  systematic testing rather than manual inspection
- Implemented bring-your-own-API-key support and tiered rate limiting to keep a public-facing
  AI-powered demo operable on free-tier API quotas
- Built the entire stack on genuinely free infrastructure (Vercel, Render, MongoDB Atlas free
  tiers, local ML inference) — zero recurring cost, zero credit card required anywhere

## One-paragraph project summary (portfolio site / LinkedIn "Featured" description)

**Context Toolkit** is a full-stack context-engineering platform that reduces LLM token usage and
cost without sacrificing answer quality. It selects only the relevant chunks from a document using
local embeddings and MMR re-ranking, compresses extractively, and escalates to a real LLM summary
only when extraction demonstrably isn't enough — then proves the result by running the same
question through both the raw and engineered context and comparing real answers side by side.
Built end-to-end (React, Node/Express, MongoDB) on a $0 infrastructure stack, with 45 automated
tests and a bring-your-own-API-key system so the public demo scales past any single free-tier
quota.

## Short version (Twitter/X bio, GitHub profile pin description)

Context engineering toolkit — selects, compresses, and summarizes context for LLMs, only paying
for a model call when free methods genuinely aren't enough. React + Node + MongoDB, $0 infra, 45
tests.

## LinkedIn post draft (if you want to share it)

Just shipped a project I'm genuinely proud of: a context-engineering toolkit that tackles a real
problem — most of what people paste into an LLM's context window is noise that costs tokens, money,
and often answer quality.

It selects relevant chunks with embeddings + MMR, compresses extractively, and only spends an LLM
call on summarization when the free path measurably falls short — then proves it worked by
comparing real answers, raw context vs. engineered context, side by side.

Built solo: React/Vite frontend, Node/Express backend, MongoDB for persistence, 45 automated tests,
and a genuinely $0 infrastructure stack (free-tier hosting + local ML inference + bring-your-own-key
support so a public demo doesn't drain my personal API quota).

[link] [screenshot]

---

## Talking points for an interview

If asked to walk through this project, the strongest things to lead with:

1. **The core design decision**, not just the tech stack: the Pipeline only escalates to a paid LLM
   call when a measured threshold says free extraction wasn't enough — that's a genuine
   engineering tradeoff, not a feature checklist item.
2. **A bug you actually found through testing**, not just "I wrote tests": the click-outside-close
   bug on the settings dropdown, found via 45 real DOM-interaction tests, not visual inspection.
3. **An honest dead end you documented**: investigating a "can't reach server" report, forming a
   real hypothesis (an unhandled-promise-rejection crash pattern), testing it directly, and finding
   it didn't reproduce — then saying so rather than claiming a fix that wasn't proven. This is a
   strong signal of engineering maturity if you can talk through it calmly.
4. **The $0 infrastructure constraint as a design forcing function**, not just a budget note — it's
   why the rate limiter and bring-your-own-key system exist at all.
