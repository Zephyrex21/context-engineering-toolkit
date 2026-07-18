export const HOME_ITEM = {
  id: "home",
  label: "Home",
  icon: "home",
  requiresLLM: false,
  description: "",
};

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        id: "pipeline",
        label: "Pipeline",
        icon: "pipeline",
        requiresLLM: "partial",
        description: "Watch the full flow: select, compress, summarize, and evaluate — in one run.",
      },
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "dashboard",
        requiresLLM: false,
        description: "Real aggregate stats from every pipeline run you've made.",
      },
    ],
  },
  {
    label: "Toolkit",
    items: [
      {
        id: "tokens",
        label: "Token Engine",
        icon: "tokens",
        requiresLLM: false,
        description: "Measure exactly what your text costs, per model, against a budget.",
      },
      {
        id: "context",
        label: "Context Selector",
        icon: "context",
        requiresLLM: false,
        description: "Chunk a document and select only what's relevant to your question.",
      },
      {
        id: "compress",
        label: "Compressor",
        icon: "compress",
        requiresLLM: false,
        description: "Strip redundancy and trim to a token budget — no LLM required.",
      },
      {
        id: "summarize",
        label: "Summarizer",
        icon: "summarize",
        requiresLLM: true,
        description: "Map-reduce document summaries and sliding-window chat compression.",
      },
      {
        id: "evaluate",
        label: "Evaluator",
        icon: "evaluate",
        requiresLLM: true,
        description: "Prove it: raw vs. engineered context, real answers, side by side.",
      },
    ],
  },
];

export const ALL_TABS = [HOME_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];
