/**
 * Normalizes template signer role identifiers and approval snapshot shapes.
 * Keep this module framework-free so H5, MP-Weixin and the node fixture use
 * exactly the same matching rules.
 */
function normalizeTemplateSignerId(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseSnapshot(snapshot) {
  if (typeof snapshot !== 'string') {
    return snapshot || [];
  }
  try {
    return JSON.parse(snapshot);
  } catch (error) {
    return [];
  }
}

function normalizeTemplateItems(items) {
  return asArray(items).filter(Boolean).map((item) => {
    const signers = asArray(item.signers || item.selectedSigners || item.templateSigners);
    return {
      ...item,
      ctSignerId: normalizeTemplateSignerId(item.ctSignerId),
      signers: signers.filter(Boolean).map((signer) => ({
        ...signer,
        ctSignerId: normalizeTemplateSignerId(
          signer.ctSignerId !== undefined ? signer.ctSignerId : item.ctSignerId
        ),
      })),
    };
  });
}

/** Flatten array, {signers: []}, {items: []}, or {templateSigners: []} snapshots. */
function normalizeSnapshotSigners(snapshot) {
  const parsed = parseSnapshot(snapshot);
  let rows = asArray(parsed);
  if (!rows.length && parsed && typeof parsed === 'object') {
    rows = asArray(parsed.signers || parsed.items || parsed.templateSigners);
  }
  return rows.reduce((result, row) => {
    if (!row || typeof row !== 'object') {
      return result;
    }
    const roleId = row.ctSignerId !== undefined
      ? row.ctSignerId
      : (row.templateSignerId !== undefined ? row.templateSignerId : row.roleId);
    const nested = asArray(row.signers || row.selectedSigners);
    if (nested.length) {
      return result.concat(nested.filter(Boolean).map((signer) => ({
        ...signer,
        ctSignerId: normalizeTemplateSignerId(
          signer.ctSignerId !== undefined ? signer.ctSignerId : roleId
        ),
      })));
    }
    result.push({
      ...row,
      ctSignerId: normalizeTemplateSignerId(
        row.ctSignerId !== undefined ? row.ctSignerId : roleId
      ),
    });
    return result;
  }, []);
}

function mergeApprovalSignerSnapshot(items, snapshot) {
  const normalizedItems = normalizeTemplateItems(items);
  const snapshotSigners = normalizeSnapshotSigners(snapshot);
  if (!snapshotSigners.length) {
    return normalizedItems;
  }
  return normalizedItems.map((item) => {
    const roleId = normalizeTemplateSignerId(item.ctSignerId);
    const matches = snapshotSigners.filter((signer) =>
      normalizeTemplateSignerId(signer.ctSignerId) === roleId
    );
    if (!matches.length) {
      return item;
    }
    const base = { ...item };
    delete base.signers;
    return {
      ...item,
      signers: matches.map((signer) => ({
        ...base,
        ...signer,
        ctSignerId: roleId,
      })),
    };
  });
}

function findMissingTemplateSigner(items) {
  return normalizeTemplateItems(items).find((item) => item.signers.length === 0) || null;
}

if (typeof module !== 'undefined') {
  module.exports = {
    normalizeTemplateSignerId,
    normalizeTemplateItems,
    normalizeSnapshotSigners,
    mergeApprovalSignerSnapshot,
    findMissingTemplateSigner,
  };
}
