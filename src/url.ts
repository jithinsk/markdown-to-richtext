const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/**
 * Returns the URL unchanged when it uses a safe protocol or is a relative
 * reference (path / anchor). Replaces anything else (javascript:, data:, …)
 * with '#' to prevent protocol-based XSS.
 */
export function safeUrl(url: string): string {
  // Allow relative references: anchors, absolute paths, relative paths
  if (url.startsWith('#') || url.startsWith('/') || url.startsWith('.')) return url
  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.has(parsed.protocol) ? url : '#'
  } catch {
    // URL() throws on relative URLs in some environments — treat as safe relative ref
    return url
  }
}
