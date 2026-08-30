function normalizeSetting(setting = {}) {
  return {
    appName: setting.appName || '电子签',
    title: setting.shareTitle || '',
    desc: setting.shareDesc || '',
    imageUrl: setting.shareImage || '',
  };
}

export function buildMiniInviteShare(setting, inviteCode) {
  const brand = normalizeSetting(setting);
  const code = inviteCode ? encodeURIComponent(inviteCode) : '';
  return {
    title: brand.title || `邀您使用${brand.appName}电子签`,
    desc: brand.desc,
    path: code ? `/pages/index/index?inviteCode=${code}` : '/pages/index/index',
    imageUrl: brand.imageUrl || undefined,
  };
}

export function buildMiniInviteTimeline(setting, inviteCode) {
  const share = buildMiniInviteShare(setting, inviteCode);
  return {
    title: share.title,
    query: inviteCode ? `inviteCode=${encodeURIComponent(inviteCode)}` : '',
    imageUrl: share.imageUrl,
  };
}

export function buildH5InviteLink(inviteCode) {
  const query = inviteCode ? `?inviteCode=${encodeURIComponent(inviteCode)}` : '';
  if (typeof window === 'undefined' || !window.location) {
    return `/pages/index/index${query}`;
  }
  const entryPath = window.location.pathname.replace(/\/index\.html$/, '/');
  const pathname = entryPath.endsWith('/') ? entryPath : `${entryPath}/`;
  return `${window.location.origin}${pathname}#/pages/index/index${query}`;
}

export async function shareOrCopyH5Invite(setting, inviteCode) {
  const share = buildMiniInviteShare(setting, inviteCode);
  const url = buildH5InviteLink(inviteCode);
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: share.title, text: share.desc, url });
      return 'shared';
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data: url,
      success: () => resolve('copied'),
      fail: reject,
    });
  });
}
