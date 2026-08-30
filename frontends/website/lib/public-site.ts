const publicSectionHashes = new Set([
  '#top',
  '#features',
  '#advantages',
  '#industries',
  '#showcase',
  '#platform-access',
  '#tech',
  '#version-compare',
  '#cta',
])

export function resolvePublicHref(value: string | undefined, fallback: string) {
  const href = String(value || '').trim()
  if (!href) return fallback
  if (publicSectionHashes.has(href)) return href
  if (/^\/(?!\/)/.test(href)) {
    return href
  }
  if (/^(mailto:|tel:)/i.test(href)) return href
  if (!/^https?:\/\//i.test(href)) return fallback
  try {
    const url = new URL(href)
    return url.toString()
  } catch {
    return fallback
  }
}
