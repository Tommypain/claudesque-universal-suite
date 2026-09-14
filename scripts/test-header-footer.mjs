import assert from 'node:assert';
import fs from 'node:fs';

const officeSuiteCode = fs.readFileSync('public/office-suite.js', 'utf8');

// Extract functions
const headerFnMatch = officeSuiteCode.match(/function createPageHeaderElement\([\s\S]*?\n  \}/);
const footerFnMatch = officeSuiteCode.match(/function createPageFooterElement\([\s\S]*?\n  \}/);
const updateFootersMatch = officeSuiteCode.match(/function updateAllPageFooters\([\s\S]*?\n  \}/);

assert(headerFnMatch, 'createPageHeaderElement must exist in office-suite.js');
assert(footerFnMatch, 'createPageFooterElement must exist in office-suite.js');
assert(updateFootersMatch, 'updateAllPageFooters must exist in office-suite.js');

// Mock a lightweight DOM environment
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.id = '';
    this.innerHTML = '';
    this.textContent = '';
    this.children = [];
    this.style = {};
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.children.find(c => c.className && c.className.includes(cls)) || null;
    }
    return null;
  }
}

const elementsById = new Map();
const mockDocument = {
  createElement: (tag) => new MockElement(tag),
  getElementById: (id) => elementsById.get(id) || null
};

// Evaluate functions in sandbox
const state = {
  wordDocTitle: 'Annual Financial Report',
  wordPages: [{ id: 1 }, { id: 2 }, { id: 3 }]
};

const fnScope = new Function('document', 'state', `
  ${headerFnMatch[0]}
  ${footerFnMatch[0]}
  ${updateFootersMatch[0]}
  return { createPageHeaderElement, createPageFooterElement, updateAllPageFooters };
`);

const { createPageHeaderElement, createPageFooterElement, updateAllPageFooters } = fnScope(mockDocument, state);

// Test 1: Header creation
const hdr0 = createPageHeaderElement(0);
assert.strictEqual(hdr0.className, 'doc-page-header');
assert.strictEqual(hdr0.id, 'word-page-header-0');
assert(hdr0.innerHTML.includes('Annual Financial Report'), 'Header should display current document title');
console.log('✓ Case 1 passed: Header creates proper element with document title.');

// Test 2: Footer creation
const ftr0 = createPageFooterElement(0, 3);
assert.strictEqual(ftr0.className, 'page-footer-num');
assert.strictEqual(ftr0.id, 'word-page-footer-0');
assert.strictEqual(ftr0.textContent, 'Page 1 of 3');
console.log('✓ Case 2 passed: Footer creates proper numbering "Page 1 of 3".');

// Register mock elements
for (let i = 0; i < 3; i++) {
  const h = createPageHeaderElement(i);
  const titleSpan = mockDocument.createElement('span');
  titleSpan.className = 'doc-header-title';
  titleSpan.textContent = state.wordDocTitle;
  h.children.push(titleSpan);
  elementsById.set('word-page-header-' + i, h);

  const f = createPageFooterElement(i, 3);
  elementsById.set('word-page-footer-' + i, f);
}

// Test 3: Updating footers when adding a page and renaming document
state.wordDocTitle = 'Q3 Strategy Briefing';
state.wordPages.push({ id: 4 });
const ftr3 = createPageFooterElement(3, 4);
elementsById.set('word-page-footer-3', ftr3);

updateAllPageFooters();

assert.strictEqual(elementsById.get('word-page-footer-0').textContent, 'Page 1 of 4');
assert.strictEqual(elementsById.get('word-page-footer-1').textContent, 'Page 2 of 4');
assert.strictEqual(elementsById.get('word-page-footer-2').textContent, 'Page 3 of 4');
assert.strictEqual(elementsById.get('word-page-header-0').querySelector('.doc-header-title').textContent, 'Q3 Strategy Briefing');

console.log('✓ Case 3 passed: updateAllPageFooters refreshes all page counters and titles.');
console.log('ALL HEADER / FOOTER TESTS PASSED SUCCESSFULLY.');
