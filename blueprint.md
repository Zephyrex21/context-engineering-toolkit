# Context Engineering Toolkit — Build Blueprint
**Option A: Context Engineering for RAG apps | $0 stack**

---

## Stack Lock-in (from prior decisions)

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + Vite + Tailwind + TanStack Query | Free |
| Backend | Node + Express | Free |
| Tokenizer | tiktoken (local) | Free |
| Embeddings | transformers.js (`all-MiniLM-L6-v2`, local) | Free |
| LLM (judge/summarize) | Gemini API free tier (+ Groq as 2nd provider) | Free |
| DB / Vector search | MongoDB Atlas M0 (+ in-memory cosine sim fallback) | Free |
| Hosting | Vercel (frontend) + Render free web service (backend) | Free |

Every phase below is designed to run entirely inside this stack. No phase introduces a paid dependency.

---

## Phase 0 — Foundations & Repo Skeleton
**Goal:** A running, empty full-stack app deployed to real URLs before any "smart" feature exists. This kills deployment risk on day 1 instead of day 20.

**Build:**
- Monorepo: `/client` (Vite React) + `/server` (Express)
- `.env` structure: `GEMINI_API_KEY`, `GROQ_API_KEY`, `MONGO_URI` — all optional at runtime (app must not crash if a key is missing, just disable that feature)
- Health check route `/api/health`
- Mongo connection with graceful fallback (in-memory mode if `MONGO_URI` absent)
- Deploy skeleton to Vercel + Render immediately, confirm the URLs work end-to-end (including the cold-start UX — add a "waking server" loading state in the frontend now, not later)

**Definition of done:** Live URL, empty UI, `/api/health` returns 200 from the deployed backend, not just localhost.

**Time:** 0.5–1 day

---

## Phase 1 — Token Engine (the funnel's foundation)
**Goal:** Accurate, provider-aware token counting. Everything downstream depends on this number being trustworthy.

**Build:**
- `POST /api/tokens/count` — accepts text + model name, returns token count via tiktoken
- Support at least: GPT-family encoding (cl100k_base) and an approximate Claude count
- Frontend: a live-updating token counter component (textarea → token count updates as you type, debounced)
- "Budget bar" component: user sets a token budget (e.g. 2000), UI shows current usage as a fill bar, red when over

**Definition of done:** Paste any text, see accurate token count per model, see it visually against a budget. No LLM call involved — pure local computation, instant.

**Time:** 1 day

---

## Phase 2 — Right-Context Selector (scissors icon — the RAG core)
**Goal:** Given a query + a document, return only the chunks worth sending to the LLM.

**Build (in order):**
1. **Chunker** — split doc into overlapping chunks (by tokens, not chars — use Phase 1's counter)
2. **Embedder** — embed all chunks locally via transformers.js on upload; embed the query at request time
3. **Retriever** — cosine similarity, top-k
4. **MMR re-ranker** — penalize near-duplicate chunks so top-k isn't 5 versions of the same sentence
5. **Tiered override** — let user manually tag a chunk as "always include" / "never include" (this is the "choose the right context" UX hook — makes it feel like a *tool*, not just a black box)
6. `POST /api/context/select` — input: doc + query + budget → output: selected chunks + token count + similarity scores

**Definition of done:** Upload a long doc (e.g. a README or article), ask a question, see which chunks got selected and why (show similarity score per chunk in the UI — this transparency is a differentiator).

**Time:** 2–3 days (this is the meatiest phase — budget the most time here)

---

## Phase 3 — Compressor (funnel icon)
**Goal:** Shrink selected/raw text further under a hard token budget without an LLM call (algorithmic, free, instant).

**Build:**
- Sentence-level scorer: TF-IDF or embedding-similarity-to-query score per sentence (reuse Phase 2's embedder)
- Greedy budget-fill: keep highest-scoring sentences until budget is hit, preserve original order
- Redundancy stripper: dedupe near-identical sentences before scoring (cheap win, easy to demo)
- `POST /api/compress` — input: text + budget + (optional) query → output: compressed text + compression ratio + before/after token counts

**Definition of done:** Paste a noisy 3000-token doc, hit compress with a 800-token budget, get back a readable ~800-token version with a visible compression ratio (e.g. "73% reduction").

**Time:** 1.5–2 days

---

## Phase 4 — Long Input / Chat History Compressor (gear icon)
**Goal:** Handle inputs too large for extractive compression to preserve meaning — needs actual summarization.

**Build:**
- Sliding window logic: keep last N turns of a conversation verbatim, summarize everything older
- Map-reduce summarizer for long single documents (chunk → summarize each chunk via Gemini free tier → summarize the summaries)
- Semantic-preservation check: embed original vs. compressed, report cosine similarity as a "meaning preserved" score — this is your proof-of-quality metric, don't skip it
- `POST /api/summarize` — input: long text or chat history array → output: compressed version + preservation score + token savings

**Definition of done:** Feed a 20-turn fake chat history, get a compressed version that keeps recent turns intact and summarizes old ones, with a preservation score shown.

**Time:** 1.5–2 days

---

## Phase 5 — Response Quality Improver / A-B Evaluator (gauge icon)
**Goal:** Prove the whole pipeline actually helps — this is the payoff module and your strongest portfolio talking point.

**Build:**
- `POST /api/evaluate/compare` — runs the *same* query twice: once with raw/unprocessed context, once with the engineered (selected + compressed) context, through Gemini
- Show both responses side by side
- Auto-score: cosine similarity to a reference answer (if user supplies one) OR a simple LLM-as-judge prompt ("rate 1-10 how well this answer addresses the query, given this context")
- Metrics panel per run: tokens used (raw vs engineered), estimated cost saved (tokens × public per-token pricing, computed not billed), latency for each call

**Definition of done:** One click produces a real before/after comparison with a number attached — this is the screenshot you put at the top of your README.

**Time:** 1.5 days

---

## Phase 6 — Pipeline Visualizer (the "wow" UI)
**Goal:** Turn Phases 1–5 into one connected, watchable flow instead of separate tool pages. This is what makes the project look like a *product* in an interview, not a homework set.

**Build:**
- Single "Run Pipeline" screen: input doc/query → animated stages (funnel → scissors → gear → gauge) with live token counts shrinking at each step
- Each stage click-expandable to show its own detail (chunks selected, sentences dropped, summary preservation score)
- Final stage shows the A-B response comparison from Phase 5

**Definition of done:** A stranger can land on the demo, paste text, hit run, and *watch* the token count fall stage by stage before seeing the final answer — no explanation needed.

**Time:** 2 days (mostly frontend/animation work)

---

## Phase 7 — Run History & Dashboard (Mongo)
**Goal:** Persist every run so you have *real* aggregate numbers, not fabricated marketing stats, for your README/demo.

**Build:**
- Save each pipeline run to Mongo: timestamp, input size, output size, tokens saved, latency, preservation score
- Dashboard page: total tokens saved across all runs, average compression ratio, a simple chart (recharts) of savings over time
- This data is what justifies your README saying "reduces token usage by X% on average" — with a number you can actually defend

**Definition of done:** Run the pipeline 10 times, dashboard shows real aggregated stats, not placeholders.

**Time:** 1 day

---

## Phase 8 — Polish, Docs, Deployment Hardening
**Goal:** Make it look and behave like a finished product.

**Build:**
- README with: problem statement, architecture diagram, before/after screenshot, live demo link, "why $0 infra" section (this is a genuinely good talking point — most people don't think about cost constraints)
- Loading states for Render cold start (don't let first-time visitors think it's broken)
- Error handling: missing API key → graceful "bring your own key" prompt, not a crash
- Optional: "bring your own Gemini/Groq key" input so the demo scales past your personal rate limit
- Rate-limit guard on your own backend so your free-tier quota can't be exhausted by one visitor

**Definition of done:** You'd be comfortable pasting the live link into a job application without checking it first.

**Time:** 1–1.5 days

---

## Total estimate
**~11–14 working days** solo, assuming Phase 2 and 3 (the actual "context engineering" logic) get the most careful attention — those are the parts that differentiate this from a generic CRUD app.

## Suggested build order priority (if time gets tight)
Phases 0 → 1 → 2 → 3 → 6 (wire up early, even half-finished) → 5 → 4 → 7 → 8.
Rationale: get something *visually running* end-to-end early (even ugly), then deepen each module — this avoids the classic trap of polishing Phase 2 for two weeks and never having a demoable product.

## Risk flags to watch during build
- **Gemini/Groq free-tier rate limits** during your own testing — cache test responses locally instead of re-calling on every dev refresh
- **Render cold start** — always test the deployed link fresh (not localhost) before considering a phase "done"
- **transformers.js first-load time** — the embedding model downloads on first use; warm it on server boot, not on first request, or your first demo query will look slow
