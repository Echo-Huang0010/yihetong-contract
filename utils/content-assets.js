export const CONTENT_COVER_FALLBACK = '/static/ic_service_content.svg';
export const SERVICE_ICON_FALLBACK = '/static/ic_service_kefu.svg';

export function normalizeContentAssetUrl(value, fallback = '') {
  const clean = String(value || '').trim();
  if (!clean || /\?[^#]*\s+\S/.test(clean)) {
    return fallback;
  }
  if (/^http:\/\//i.test(clean)) {
    return clean.replace(/^http:\/\//i, 'https://');
  }
  if (/^(https:\/\/|\/)/i.test(clean)) {
    return clean;
  }
  return fallback;
}

export function normalizeContentRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(item => ({
    ...item,
    coverUrl: normalizeContentAssetUrl(item && item.coverUrl, CONTENT_COVER_FALLBACK),
  }));
}

export function normalizeServiceRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(item => ({
    ...item,
    iconUrl: normalizeContentAssetUrl(item && item.iconUrl, SERVICE_ICON_FALLBACK),
  }));
}
