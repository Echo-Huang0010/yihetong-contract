const assert = require('node:assert/strict');
const {
  normalizeTemplateItems,
  normalizeSnapshotSigners,
  mergeApprovalSignerSnapshot,
  findMissingTemplateSigner,
} = require('./templateSigner.js');

const roles = normalizeTemplateItems([
  { ctSignerId: 7, signerFlag: '甲方', signers: [] },
  { ctSignerId: '8', signerFlag: '乙方', signers: [] },
]);
const nestedSnapshot = {
  signers: [{
    ctSignerId: '7',
    signers: [{ signerType: 1, person: { name: '张三' } }],
  }, {
    ctSignerId: 8,
    signers: [{ signerType: 2, company: { agentName: '李四' } }],
  }],
};

assert.equal(normalizeSnapshotSigners(nestedSnapshot).length, 2);
const restored = mergeApprovalSignerSnapshot(roles, JSON.stringify(nestedSnapshot));
assert.equal(restored[0].signers[0].person.name, '张三');
assert.equal(restored[1].signers[0].company.agentName, '李四');
assert.equal(findMissingTemplateSigner(restored), null);
assert.equal(findMissingTemplateSigner(normalizeTemplateItems([
  { ctSignerId: '7', signers: [{ signerType: 1 }] },
  { ctSignerId: '8', signers: [] },
])).ctSignerId, '8');
console.log('template signer fixture: PASS');
