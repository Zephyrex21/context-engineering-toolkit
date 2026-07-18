export function cosineSimilarity(a, b) {
  if (a instanceof Map || b instanceof Map) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (const v of a.values()) normA += v * v;
    for (const v of b.values()) normB += v * v;
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    for (const [term, weight] of small) {
      const other = large.get(term);
      if (other) dot += weight * other;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
