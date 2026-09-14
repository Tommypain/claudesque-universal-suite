// Test: Widow/Orphan rule for headings
import assert from 'node:assert';

function simulateWidowOrphan(children, overflowingIndices) {
  const overflowingNodes = overflowingIndices.map(i => children[i]);
  const lastRemaining = children[children.length - overflowingNodes.length - 1];
  
  if (lastRemaining && (/^H[1-6]$/.test(lastRemaining.tagName) || (lastRemaining.classList && lastRemaining.classList.includes('heading')))) {
    overflowingNodes.unshift(lastRemaining);
  }
  return overflowingNodes;
}

// Case 1: Last remaining is an H2 heading
const childrenCase1 = [
  { tagName: 'P', text: 'Paragraph 1' },
  { tagName: 'P', text: 'Paragraph 2' },
  { tagName: 'H2', text: 'Section 2 Heading' },
  { tagName: 'P', text: 'Paragraph overflowing to next page' }
];
const result1 = simulateWidowOrphan(childrenCase1, [3]);
assert.strictEqual(result1.length, 2, 'Should move both H2 and P');
assert.strictEqual(result1[0].tagName, 'H2', 'First moved element should be H2');
assert.strictEqual(result1[1].tagName, 'P', 'Second moved element should be P');
console.log('✓ Case 1 passed: H2 heading successfully bundled with overflowing paragraph!');

// Case 2: Last remaining is normal P, not a heading
const childrenCase2 = [
  { tagName: 'P', text: 'Paragraph 1' },
  { tagName: 'P', text: 'Paragraph 2' },
  { tagName: 'P', text: 'Paragraph 3' },
  { tagName: 'P', text: 'Paragraph overflowing' }
];
const result2 = simulateWidowOrphan(childrenCase2, [3]);
assert.strictEqual(result2.length, 1, 'Should move only the overflowing P');
assert.strictEqual(result2[0].text, 'Paragraph overflowing');
console.log('✓ Case 2 passed: Normal paragraph left in place, only overflow moved!');

console.log('ALL WIDOW/ORPHAN TESTS PASSED SUCCESSFULLY.');
