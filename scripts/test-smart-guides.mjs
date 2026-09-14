import assert from 'node:assert';
import fs from 'node:fs';

const officeSuiteCode = fs.readFileSync('public/office-suite.js', 'utf8');

assert(officeSuiteCode.includes('function clearSmartGuides('), 'clearSmartGuides must exist');
assert(officeSuiteCode.includes('function showSmartGuide('), 'showSmartGuide must exist');
assert(officeSuiteCode.includes('function computeSnapCoordinates('), 'computeSnapCoordinates must exist');

const clearSmartGuidesMatch = officeSuiteCode.match(/function clearSmartGuides\([\s\S]*?\n  \}/);
const showSmartGuideMatch = officeSuiteCode.match(/function showSmartGuide\([\s\S]*?\n  \}/);
const computeSnapCoordinatesMatch = officeSuiteCode.match(/function computeSnapCoordinates\([\s\S]*?\n  \}/);

assert(clearSmartGuidesMatch);
assert(showSmartGuideMatch);
assert(computeSnapCoordinatesMatch);

// Mock DOM host
class MockGuideEl {
  constructor(className) {
    this.className = className;
    this.style = {};
  }
  remove() {
    this.removed = true;
  }
}

class MockHost {
  constructor() {
    this.children = [];
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  querySelectorAll(sel) {
    if (sel.includes('smart-guide-line')) {
      return this.children.filter(c => c.className && c.className.includes('smart-guide-line'));
    }
    return [];
  }
}

const mockDocument = {
  createElement: (tag) => new MockGuideEl('')
};

const host = new MockHost();

const state = {
  slideW: 1280,
  slideH: 720,
  slides: [
    {
      id: 1,
      texts: [
        { id: 10, xf: 0.20, yf: 0.20, wf: 0.30, hf: 0.15 },
        { id: 20, xf: 0.60, yf: 0.50, wf: 0.25, hf: 0.20 }
      ],
      shapes: [
        { id: 30, xf: 0.20, yf: 0.70, wf: 0.10, hf: 0.10 }
      ]
    }
  ],
  activeSlideId: 1
};

const fnScope = new Function('document', 'state', `
  function getActiveSlide() { return state.slides[0]; }
  ${clearSmartGuidesMatch[0]}
  ${showSmartGuideMatch[0]}
  ${computeSnapCoordinatesMatch[0]}
  return { clearSmartGuides, showSmartGuide, computeSnapCoordinates };
`);

const { clearSmartGuides, showSmartGuide, computeSnapCoordinates } = fnScope(mockDocument, state);

// Test 1: Guide creation & removal
showSmartGuide(host, 'vertical', 50);
showSmartGuide(host, 'horizontal', 35);
assert.strictEqual(host.children.length, 2);
assert(host.children[0].className.includes('smart-guide-line vertical'));
assert.strictEqual(host.children[0].style.left, '50%');
assert(host.children[1].className.includes('smart-guide-line horizontal'));
assert.strictEqual(host.children[1].style.top, '35%');

clearSmartGuides(host);
assert(host.children[0].removed && host.children[1].removed, 'Guides should be removed');
console.log('✓ Case 1 passed: showSmartGuide and clearSmartGuides work correctly.');

// Test 2: Snapping to slide center (0.50)
const movingObj = { id: 99, xf: 0.349, yf: 0.10, wf: 0.30, hf: 0.10 };
// Center of movingObj is 0.349 + 0.15 = 0.499, which is within threshold of 0.50
let snap = computeSnapCoordinates(movingObj, host, false);
assert(snap.snapX !== null, 'Should snap to slide center X');
assert.strictEqual(snap.guideX, 0.5);
assert.strictEqual(snap.snapX, 0.35); // 0.5 - wf/2
console.log('✓ Case 2 passed: Snapping to slide center X (0.50) calculated accurately.');

// Test 3: Snapping to another element's left edge
const movingObj2 = { id: 99, xf: 0.202, yf: 0.80, wf: 0.20, hf: 0.10 };
// Should snap to text 10 or shape 30 which has xf: 0.20
snap = computeSnapCoordinates(movingObj2, host, false);
assert(snap.snapX !== null, 'Should snap to reference element left edge');
assert.strictEqual(snap.snapX, 0.20);
assert.strictEqual(snap.guideX, 0.20);
console.log('✓ Case 3 passed: Snapping to neighbor element edge matches coordinate.');

// Test 4: No false snapping when far away
const farObj = { id: 99, xf: 0.33, yf: 0.37, wf: 0.12, hf: 0.08 };
snap = computeSnapCoordinates(farObj, host, false);
assert.strictEqual(snap.snapX, null);
assert.strictEqual(snap.snapY, null);
console.log('✓ Case 4 passed: No false positive snaps when outside threshold.');

// Test 5: Snapping during resize (right edge alignment)
const resizingObj = { id: 99, xf: 0.10, yf: 0.10, wf: 0.498, hf: 0.10 };
// Right edge is 0.10 + 0.498 = 0.598, which is within threshold of text 20's left edge (0.60)
snap = computeSnapCoordinates(resizingObj, host, true);
assert(snap.snapX !== null, 'Resize should snap right edge to neighbor left edge');
assert.strictEqual(snap.guideX, 0.60);
assert.strictEqual(Math.round(snap.snapX * 100) / 100, 0.50); // new width = 0.60 - 0.10 = 0.50
console.log('✓ Case 5 passed: Resizing correctly snaps dimensions to neighbor bounds.');

console.log('ALL SMART GUIDES TESTS PASSED SUCCESSFULLY.');
