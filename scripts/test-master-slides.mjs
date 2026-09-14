import assert from 'node:assert';
import fs from 'node:fs';

const officeSuiteCode = fs.readFileSync('public/office-suite.js', 'utf8');

// Extract functions & masters
assert(officeSuiteCode.includes('defaultSlideMasters'), 'defaultSlideMasters must exist in office-suite.js');
assert(officeSuiteCode.includes('function getSlideMaster('), 'getSlideMaster must exist');
assert(officeSuiteCode.includes('function getEffectiveTextStyle('), 'getEffectiveTextStyle must exist');
assert(officeSuiteCode.includes('function applyMasterToSlide('), 'applyMasterToSlide must exist');
assert(officeSuiteCode.includes('function updateSlideMaster('), 'updateSlideMaster must exist');

// Extract matching code snippets
const mastersMatch = officeSuiteCode.match(/const defaultSlideMasters = (\{[\s\S]*?\n  \});/);
const getSlideMasterMatch = officeSuiteCode.match(/function getSlideMaster\([\s\S]*?\n  \}/);
const getEffectiveTextStyleMatch = officeSuiteCode.match(/function getEffectiveTextStyle\([\s\S]*?\n  \}/);
const applyMasterToSlideMatch = officeSuiteCode.match(/function applyMasterToSlide\([\s\S]*?\n  \}/);
const updateSlideMasterMatch = officeSuiteCode.match(/function updateSlideMaster\([\s\S]*?\n  \}/);
const ensureSlideTextsMatch = officeSuiteCode.match(/function ensureSlideTexts\([\s\S]*?\n  \}/);

assert(mastersMatch, 'defaultSlideMasters match');
assert(getSlideMasterMatch, 'getSlideMaster match');
assert(getEffectiveTextStyleMatch, 'getEffectiveTextStyle match');
assert(applyMasterToSlideMatch, 'applyMasterToSlide match');
assert(updateSlideMasterMatch, 'updateSlideMaster match');
assert(ensureSlideTextsMatch, 'ensureSlideTexts match');

// Sandbox environment
let renderActiveSlideCalled = 0;
let renderSlideListCalled = 0;

const mockRenderActiveSlide = () => { renderActiveSlideCalled++; };
const mockRenderSlideList = () => { renderSlideListCalled++; };

class MockDiv {
  constructor() {
    this.innerHTML = '';
    this.innerText = '';
  }
}

const mockDocument = {
  createElement: () => new MockDiv()
};

const fnScope = new Function('document', 'renderActiveSlide', 'renderSlideList', `
  ${mastersMatch[0]}
  const state = {
    slideMasters: JSON.parse(JSON.stringify(defaultSlideMasters)),
    slides: []
  };
  ${getSlideMasterMatch[0]}
  ${getEffectiveTextStyleMatch[0]}
  ${applyMasterToSlideMatch[0]}
  ${updateSlideMasterMatch[0]}
  ${ensureSlideTextsMatch[0]}

  return { defaultSlideMasters, state, getSlideMaster, getEffectiveTextStyle, applyMasterToSlide, updateSlideMaster, ensureSlideTexts };
`);

const { state, getSlideMaster, getEffectiveTextStyle, applyMasterToSlide, updateSlideMaster, ensureSlideTexts } =
  fnScope(mockDocument, mockRenderActiveSlide, mockRenderSlideList);

// Test 1: Verify Masters Registry
assert(state.slideMasters.title, 'Title master must exist');
assert(state.slideMasters.content, 'Content master must exist');
assert(state.slideMasters['two-column'], 'Two-column master must exist');
assert(state.slideMasters.blank, 'Blank master must exist');
console.log('✓ Case 1 passed: Masters registry loaded with all 4 standard layouts.');

// Test 2: Style Inheritance
const testSlide = { id: 101, masterId: 'title', layout: 'Title', bg: null };
ensureSlideTexts(testSlide);

assert.strictEqual(testSlide.texts.length, 2, 'Title slide should have 2 placeholders (title + subtitle)');
const titleBox = testSlide.texts[0];
assert.strictEqual(titleBox.masterRole, 'title');

let effStyle = getEffectiveTextStyle(testSlide, titleBox);
assert.strictEqual(effStyle.size, 54);
assert.strictEqual(effStyle.color, '#1e293b');
assert.strictEqual(effStyle.weight, 800);
console.log('✓ Case 2 passed: Text placeholder cleanly inherits master styles.');

// Test 3: Dynamic Master updates propagate to slides without overrides
updateSlideMaster('title', {
  styles: {
    title: { color: '#dc2626', size: 60 }
  }
});

effStyle = getEffectiveTextStyle(testSlide, titleBox);
assert.strictEqual(effStyle.color, '#dc2626', 'Master color update should reflect on inherited slide');
assert.strictEqual(effStyle.size, 60, 'Master size update should reflect on inherited slide');
console.log('✓ Case 3 passed: Updating Master dynamically propagates to linked slides in real-time.');

// Test 4: Custom Overrides break inheritance for specific property only
titleBox.customColor = true;
titleBox.color = '#10b981'; // green override

effStyle = getEffectiveTextStyle(testSlide, titleBox);
assert.strictEqual(effStyle.color, '#10b981', 'Custom color override takes precedence');
assert.strictEqual(effStyle.size, 60, 'Non-overridden size still inherits from master');
console.log('✓ Case 4 passed: Granular override mechanism preserves custom changes while keeping other master styles.');

// Test 5: applyMasterToSlide converts layout and preserves user text
titleBox.html = 'Q4 Financial Highlights';
applyMasterToSlide(testSlide, 'two-column');

assert.strictEqual(testSlide.masterId, 'two-column');
assert.strictEqual(testSlide.layout, 'TwoColumns');
assert.strictEqual(testSlide.texts.length, 3, 'Two-column layout has 3 placeholders (title + 2 cols)');
assert.strictEqual(testSlide.texts[0].html, 'Q4 Financial Highlights', 'Title text preserved across master switch');
console.log('✓ Case 5 passed: applyMasterToSlide successfully re-maps placeholders and preserves text.');

console.log('ALL MASTER SLIDES TESTS PASSED SUCCESSFULLY.');
