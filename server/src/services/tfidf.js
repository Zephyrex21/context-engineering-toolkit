function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

/**
 * Builds sparse TF-IDF vectors (Map<term, weight>) over the given corpus.
 * Corpus-relative by design — each request is its own self-contained corpus
 * (the document's chunks + the query), which is exactly the scope that matters
 * for a single retrieval call.
 */
export function buildTfidfVectors(texts) {
  const docsTokens = texts.map(tokenize);
  const docFrequency = new Map();

  for (const tokens of docsTokens) {
    const seen = new Set(tokens);
    for (const term of seen) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
    }
  }

  const N = texts.length;

  return docsTokens.map((tokens) => {
    const termFrequency = new Map();
    for (const term of tokens) {
      termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
    }
    const vector = new Map();
    for (const [term, count] of termFrequency) {
      const idf = Math.log((N + 1) / ((docFrequency.get(term) || 0) + 1)) + 1;
      vector.set(term, (count / tokens.length) * idf);
    }
    return vector;
  });
}
